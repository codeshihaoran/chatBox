import React, { useState } from "react";
import { ChatEventType, RoleType } from "@coze/api";
import { client, botId } from "../index";
import { Input, Button } from "antd";
import { SendOutlined } from "@ant-design/icons";
const { TextArea } = Input
const Main: React.FC = () => {
    const [message, setMessage] = useState('') // 输入框内容
    const [sendMessage, setSendMessage] = useState('') // 发送消息
    const [loading, setLoading] = useState(false) // 按钮禁用
    const [output, setOutput] = useState(''); // 回复消息

    const handleClick = async () => {
        if (!message.trim()) {
            return
        }
        setLoading(true)
        const currentMsg = message
        setSendMessage(currentMsg)
        setMessage('')
        setOutput("");
        try {
            const stream = await client.chat.stream({
                bot_id: botId!,
                additional_messages: [{
                    role: RoleType.User,
                    content: currentMsg,
                    content_type: 'text',
                }],
            });
            for await (const part of stream) {
                if (part.event === ChatEventType.CONVERSATION_MESSAGE_DELTA) {
                    setOutput((prev) => prev + part.data.content);
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
        <div className="chat-main">
            <div className="main">
                {sendMessage && <div className="user">
                    {sendMessage}
                </div>}
                {output && <div className="ai">
                    {output}
                </div>}

            </div>
            <div className="footer">

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

            </div>
        </div>
    )
}
export default Main