import { ChatEventType, RoleType } from "@coze/api";
import { getToken, getBotId, createClient } from "../index";
import { setContent, cacheStreamContent, clearStreamCache } from "@/store/modules/content";
import { useDispatch, useSelector } from "react-redux";
import { selectConversationId, updateConversationTitle, selectConversation } from "@/store/modules/conversation";
import store from "@/store";

// 自定义hook，用于启动对话
export const useStartConversation = () => {
    const dispatch = useDispatch()
    const currentConversationId = useSelector(selectConversationId)
    const conversationContent = useSelector(selectConversation)

    const startConversation = async (message: string, contentType: string = 'text', mediaContent: any = null, metaData: string = '') => {
        // UX1: 如果是新对话（标题为空），使用第一条消息作为标题
        const currentConv = conversationContent.find(c => c.conversation_id === currentConversationId);
        if (currentConv && !currentConv.value && message) {
            const title = message.substring(0, 30);
            dispatch(updateConversationTitle({ conversation_id: currentConversationId!, title }));
        }

        // 流式输出开始前清除之前内容，显示新消息
        dispatch(setContent({ msg: message, response: '', follow: [], message_id: '' }));
        const meta_data: Record<string, string> = {
            id: metaData,
            content: message
        }
        const additionalMsg: any[] = [{
            role: RoleType.User,
            content: contentType === 'text' ? message : mediaContent,
            content_type: contentType,
            meta_data: meta_data
        }]

        let completeResponse = '';
        let followArr: string[] = [];
        let messageId = '';
        let hasError = false;

        try {
            const stream = await createClient().chat.stream({
                bot_id: getBotId()!,
                conversation_id: currentConversationId!,
                additional_messages: additionalMsg,
            });

            for await (const part of stream) {
                // B8: 检测对话是否已切换，避免旧会话流式内容污染新对话页
                const latestId = store.getState().conversation.value.currentConversationId;
                if (latestId !== currentConversationId) {
                    console.log('对话已切换，缓存当前流式响应内容');
                    // B8: 缓存已收到部分内容，切换回去时可恢复
                    dispatch(cacheStreamContent({
                        conversationId: currentConversationId,
                        data: { msg: message, response: completeResponse, follow: followArr, message_id: messageId }
                    }));
                    hasError = true;
                    break;
                }

                if (part.event === ChatEventType.CONVERSATION_CHAT_FAILED) {
                    console.error('Chat failed:', JSON.stringify(part.data, null, 2));
                    hasError = true;
                    throw new Error('对话请求失败，请稍后重试');
                }

                if (part.event === ChatEventType.ERROR) {
                    console.error('Stream error:', JSON.stringify(part.data, null, 2));
                    hasError = true;
                    throw new Error('流式响应出错，请稍后重试');
                }

                if (part.event === ChatEventType.CONVERSATION_MESSAGE_DELTA) {
                    completeResponse += part.data.content;
                    messageId = part.data.id;
                    dispatch(setContent({ msg: message, response: completeResponse, follow: followArr, message_id: messageId }));
                }

                if (part.event === ChatEventType.CONVERSATION_MESSAGE_COMPLETED && part.data.type === "follow_up") {
                    followArr = [...followArr, part.data.content];
                    dispatch(setContent({ msg: message, response: completeResponse, follow: followArr, message_id: messageId }));
                }

                if (part.event === ChatEventType.CONVERSATION_CHAT_COMPLETED) {
                    console.log('Chat completed');
                }

                if (part.event === ChatEventType.DONE) {
                    console.log('Stream done');
                }
            }

            // Ensure final state is dispatched after stream ends (only if no error)
            if (!hasError) {
                dispatch(setContent({ msg: message, response: completeResponse, follow: followArr, message_id: messageId }));
                // B8: 流正常完成，清除该对话的缓存内容
                dispatch(clearStreamCache(currentConversationId));
            }
        } catch (err) {
            console.error('Stream iteration error:', err);
            hasError = true;
            throw err;
        }
    };

    return startConversation;
}



