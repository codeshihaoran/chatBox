import React, { useState, useEffect, useRef } from "react";
import { Button, message } from "antd";
import { SendOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import ReactQuill from "react-quill"
import "react-quill/dist/quill.snow.css";

import { useStartConversation } from "@/service/index";
import { setLoading } from "@/store/modules/loading";
import { selectLoading } from "@/store/modules/loading";
import { selectFileInfo } from "@/store/modules/fileInfo";
import FileUpload from "@/components/fileUpload";

const Bottom: React.FC = () => {
    const [input, setInput] = useState('')
    const reactQuillRef = useRef<ReactQuill>(null);

    const dispatch = useDispatch()
    const startConversation = useStartConversation()
    const loading = useSelector(selectLoading)
    const fileInfo = useSelector(selectFileInfo)
    useEffect(() => {
        if (fileInfo && fileInfo.fileBase) {
            const quill = reactQuillRef.current?.getEditor()
            if (quill) {
                const range = quill.getSelection();
                if (range) {
                    setTimeout(() => {
                        quill.insertEmbed(range.index, fileInfo.fileType, fileInfo.fileBase);
                    }, 0);
                }
            }
        }

    }, [fileInfo])
    const handleClick = async () => {
        const quill = reactQuillRef.current?.getEditor();
        const editorContent = quill ? quill.getText().trim() : '';
        if (!editorContent) {
            message.error('请输入内容');
            return;
        }

        dispatch(setLoading(true))
        const currentMsg = editorContent.replace(/<\/?[^>]+(>|$)/g, "");
        setInput('')
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
        <div className="chat-input-container" onKeyDownCapture={(e) => {
            if (e.code === 'Enter') {
                e.preventDefault()
            }
        }}>
            <ReactQuill
                value={input}
                onChange={setInput}
                placeholder="请输入消息"
                className="chat-input"
                ref={reactQuillRef}
                modules={{
                    toolbar: false
                }}
                onKeyDown={handleKeyDown}

            />
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