import React, { useState } from "react";
import { Input, Button } from "antd";
import { SendOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
const { TextArea } = Input

import { useStartConversation } from "@/service/index";
import { setLoading } from "@/store/modules/loading";
import { selectLoading } from "@/store/modules/loading";
import FileUpload from "@/components/fileUpload";

const Bottom: React.FC = () => {
    const [message, setMessage] = useState('')
    const dispatch = useDispatch()
    const startConversation = useStartConversation()
    const loading = useSelector(selectLoading)
    const handleClick = async () => {
        if (!message.trim()) {
            return
        }
        dispatch(setLoading(true))
        const currentMsg = message
        setMessage('')
        try {
            await startConversation(currentMsg)
        } catch (err) {
            console.log(err);
        } finally {
            dispatch(setLoading(false))
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
                autoSize={{ minRows: 2.5, maxRows: 5 }}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
            >
            </TextArea>
            <div className="chat-send">
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
        </div>
    )
}
export default Bottom