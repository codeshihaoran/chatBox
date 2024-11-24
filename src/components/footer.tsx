import React, { useState } from "react";
import { Input, Button } from "antd";
import { SendOutlined } from "@ant-design/icons";
const { TextArea } = Input

const Footer: React.FC = () => {
    const [message, setMessage] = useState('')
    const handleClick = () => {
        if (message == '') {
            return
        }
        // 这里发送消息

        setMessage('')
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
            >

            </Button>
        </div>
    )
}
export default Footer