import { ChatEventType, RoleType } from "@coze/api";
import { marked } from "marked";
import { getToken, getBotId, createClient } from "../index";
import { setContent, cacheStreamContent, clearStreamCache } from "@/store/modules/content";
import { setConversationInfo } from "@/store/modules/conversationInfo";
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

        // B9: 在开始新对话前，将上一轮完成的对话记录保存到 conversationInfo
        // 确保历史消息在同一对话页中不会因新消息发送而丢失
        const prevContent = store.getState().content.value;
        if (prevContent.msg && prevContent.response) {
            const prevConvInfo = store.getState().conversationInfo.value.conversationInfo;
            // 避免重复保存：检查 conversationInfo 最后一条是否与上一轮记录相同
            const lastEntry = prevConvInfo[prevConvInfo.length - 1];
            if (!lastEntry || lastEntry.userContent !== prevContent.msg) {
                let htmlContent = '';
                try {
                    htmlContent = await marked(prevContent.response) as string;
                } catch (e) {
                    htmlContent = prevContent.response;
                }
                dispatch(setConversationInfo([...prevConvInfo, {
                    userContent: prevContent.msg,
                    assistantContent: htmlContent,
                    meta_id: prevContent.meta_id || '',
                }]));
            }
        }

        // 流式输出开始前清除之前内容，显示新消息
        dispatch(setContent({ msg: message, response: '', follow: [], message_id: '', meta_id: metaData }));
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
                        data: { msg: message, response: completeResponse, follow: followArr, message_id: messageId, meta_id: metaData }
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
                    dispatch(setContent({ msg: message, response: completeResponse, follow: followArr, message_id: messageId, meta_id: metaData }));
                }

                if (part.event === ChatEventType.CONVERSATION_MESSAGE_COMPLETED && part.data.type === "follow_up") {
                    followArr = [...followArr, part.data.content];
                    dispatch(setContent({ msg: message, response: completeResponse, follow: followArr, message_id: messageId, meta_id: metaData }));
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
                dispatch(setContent({ msg: message, response: completeResponse, follow: followArr, message_id: messageId, meta_id: metaData }));
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



