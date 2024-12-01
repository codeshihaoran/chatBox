import React, { useState } from "react";
import { Input, Button } from "antd";
import { SendOutlined } from "@ant-design/icons";
import { useStartConversation } from "@/service/index";
const { TextArea } = Input
import FileUpload from "./fileUpload";
const Bottom: React.FC = () => {
    const [message, setMessage] = useState('') // 输入框内容
    const [loading, setLoading] = useState(false) // 按钮禁用
    const startConversation = useStartConversation()
    const handleClick = async () => {
        if (!message.trim()) {
            return
        }
        setLoading(true)
        const currentMsg = message
        setMessage('')
        try {
            await startConversation(currentMsg)
        } catch (err) {
            console.log(err);
        } finally {
            setLoading(false)
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
            <FileUpload />
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