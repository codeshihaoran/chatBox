import { ChatEventType, RoleType } from "@coze/api";
import { client, botId } from "../index";
import { setContent } from "@/store/modules/content";
import { useDispatch, useSelector } from "react-redux";
import { selectConversation } from "@/store/modules/conversation";
// 自定义 hook，用于启动对话
export const useStartConversation = () => {
    const dispatch = useDispatch()
    const { conversation_id } = useSelector(selectConversation)
    const startConversation = async (message: string, contentType: string = 'text', mediaContent: any = null) => {
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

        for await (const part of stream) {
            if (part.event === ChatEventType.CONVERSATION_MESSAGE_DELTA) {
                completeResponse += part.data.content;
            }
            if (part.event === ChatEventType.CONVERSATION_MESSAGE_COMPLETED && part.data.type === "follow_up") {
                followArr = [...followArr, part.data.content];
            }

            dispatch(setContent({ msg: message, response: completeResponse, follow: followArr }));
        }
    };

    return startConversation;
};
