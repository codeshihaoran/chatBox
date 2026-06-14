import { ChatEventType, RoleType } from "@coze/api";
import { client, botId, token } from "../index";
import { setContent } from "@/store/modules/content";
import { useDispatch, useSelector } from "react-redux";
import { selectConversationId } from "@/store/modules/conversation";
import { setConversationInfo } from "@/store/modules/conversationInfo";
import axios from "axios";
import { useMarked } from "@/components/marked";
import { updateConversationTitle } from "@/store/modules/conversation";
import { selectConversation } from "@/store/modules/conversation";

// 自定义hook，用于启动对话
export const useStartConversation = () => {
    const dispatch = useDispatch()
    const currentConversationId = useSelector(selectConversationId)
    const conversationContent = useSelector(selectConversation)

    const startMarked = useMarked()
    const startConversation = async (message: string, contentType: string = 'text', mediaContent: any = null, metaData: string = '') => {
        // UX1: 如果是新对话（标题为空），使用第一条消息作为标题
        const currentConv = conversationContent.find(c => c.conversation_id === currentConversationId);
        if (currentConv && !currentConv.value && message) {
            const title = message.substring(0, 30);
            dispatch(updateConversationTitle({ conversation_id: currentConversationId!, title }));
        }

        // 这里先获取消息列表
        dispatch(setContent({ msg: message, response: '', follow: [], message_id: '' }));
        if (currentConversationId) {
            try {
                const response = await axios.post('https://api.coze.cn/v1/conversation/message/list',
                    {},
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                        params: { conversation_id: currentConversationId }
                    }
                )
                const { data } = response
                if (data.code === 0) {
                    data.data.reverse()
                    const newData = []
                    for (let i = 0; i < data.data.length; i += 2) {
                        // 使用可选链防止 meta_data 为 undefined 时报错
                        const metaInfo = data.data[i]?.meta_data
                        const userMessage = metaInfo?.content || ''
                        const metaId = metaInfo?.id || ''
                        const assistantMessage = data.data[i + 1]
                        const aiContent = assistantMessage ? await startMarked(assistantMessage.content) : ''
                        const newItem = {
                            userContent: userMessage || '',
                            assistantContent: aiContent || '',
                            meta_id: metaId
                        };
                        newData.push(newItem)
                    }
                    dispatch(setConversationInfo(newData))
                }
            } catch (err) {
                console.log(err);
                console.error('加载历史消息失败，请稍后重试');
            }
        }
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
            const stream = await client.chat.stream({
                bot_id: botId!,
                conversation_id: currentConversationId!,
                additional_messages: additionalMsg,
            });

            for await (const part of stream) {
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
            }
        } catch (err) {
            console.error('Stream iteration error:', err);
            hasError = true;
            throw err;
        }
    };

    return startConversation;
}



