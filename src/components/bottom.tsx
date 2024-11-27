import React, { useState } from "react";
import { ChatEventType, RoleType } from "@coze/api";
import { client, botId } from "../index";
import { Input, Button } from "antd";
import { SendOutlined } from "@ant-design/icons";
const { TextArea } = Input
interface ChildComponentProps {
    sendDataToHome: (data: { msg: string; response: string }) => void; // 回调函数类型，接收一个字符串参数
}
const Bottom: React.FC<ChildComponentProps> = ({ sendDataToHome }) => {
    const [message, setMessage] = useState('') // 输入框内容
    const [loading, setLoading] = useState(false) // 按钮禁用
    const [response, setResponse] = useState(''); // 响应的完整内容
    const handleClick = async () => {
        if (!message.trim()) {
            return
        }
        setLoading(true)
        const currentMsg = message
        setMessage('')
        setResponse(''); // 清空之前的响应内容
        try {
            const stream = await client.chat.stream({
                bot_id: botId!,
                additional_messages: [{
                    role: RoleType.User,
                    content: currentMsg,
                    content_type: 'text',
                }],
            });
            let completeResponse = ''
            for await (const part of stream) {
                if (part.event === ChatEventType.CONVERSATION_MESSAGE_DELTA) {
                    completeResponse += part.data.content;

                    // 更新当前流式响应
                    setResponse(completeResponse);

                    // 每次增量内容更新时，可以实时传递给父组件
                    const data = { msg: currentMsg, response: completeResponse };
                    sendDataToHome(data);
                }
            }
        } catch (err) {
            console.log(err);
        } finally {
            setLoading(false)
            setMessage('')
        }

    }
    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            handleClick()
        }
    }
    return (
        <div className="chat-input-container">
            <TextArea
                className="chat-input"
                placeholder="请输入消息"
                autoSize={{ minRows: 1.5, maxRows: 3 }}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
            >
            </TextArea>
            <Button
                type="primary"
                icon={<SendOutlined />}
                className="chat-send-button"
                onClick={handleClick}
                disabled={loading}
            >
                {loading ? '发送中...' : '发送'}
            </Button>
        </div>
    )
}
export default Bottom