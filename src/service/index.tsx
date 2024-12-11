import { ChatEventType, RoleType } from "@coze/api";
import { client, botId, token } from "../index";
import { setContent } from "@/store/modules/content";
import { useDispatch, useSelector } from "react-redux";
import { selectConversation } from "@/store/modules/conversation";
import { setConversationInfo } from "@/store/modules/conversationInfo";
import axios from "axios";
import { useMarked } from "@/components/marked";

// 自定义 hook，用于启动对话
export const useStartConversation = () => {
    const dispatch = useDispatch()
    const { conversation_id } = useSelector(selectConversation)
    const startMarked = useMarked()
    const startConversation = async (message: string, contentType: string = 'text', mediaContent: any = null) => {
        // 这里先获取消息列表
        if (conversation_id) {
            try {
                const response = await axios.post('https://api.coze.cn/v1/conversation/message/list',
                    {},
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                        params: { conversation_id }
                    }
                )
                const { data } = response
                if (data.code === 0) {
                    data.data.reverse()
                    const newData = []
                    for (let i = 0; i < data.data.length; i += 2) {
                        const userMessage = data.data[i]
                        const assistantMessage = data.data[i + 1]
                        const aiContent = await startMarked(assistantMessage.content)
                        const newItem = {
                            userContent: userMessage?.content || '',
                            assistantContent: aiContent || ''
                        };
                        newData.push(newItem)
                    }
                    dispatch(setConversationInfo(newData))
                }
            } catch (err) {
                console.log(err);
            }
        }

        const additionalMsg: any[] = [{
            role: RoleType.User,
            content: message,
            content_type: contentType,
        }]
        if (contentType !== 'text' && mediaContent) {
            additionalMsg[0].content = mediaContent
        }
        const stream = await client.chat.stream({
            bot_id: botId!,
            conversation_id: conversation_id!,
            additional_messages: additionalMsg
        });

        let completeResponse = '';
        let followArr: string[] = [];
        let messageId = ''
        for await (const part of stream) {
            if (part.event === ChatEventType.CONVERSATION_MESSAGE_DELTA) {
                completeResponse += part.data.content;
                messageId = part.data.id
            }
            if (part.event === ChatEventType.CONVERSATION_MESSAGE_COMPLETED && part.data.type === "follow_up") {
                followArr = [...followArr, part.data.content];
            }

            dispatch(setContent({ msg: message, response: completeResponse, follow: followArr, message_id: messageId }));
        }
    };

    return startConversation;
};
