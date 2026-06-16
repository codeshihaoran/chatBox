import React, { useState, useRef } from "react";
import { Button, message } from "antd";
import { SendOutlined, DeleteOutlined } from "@ant-design/icons";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolderPlus, faCameraAlt } from '@fortawesome/free-solid-svg-icons';
import { useDispatch, useSelector } from "react-redux";
import { useStartConversation } from "@/service/index";
import { setLoading, selectLoading } from "@/store/modules/loading";
import { setFileInfo, addFileInfo, deleteFileInfo, clearFileInfo, selectUploadFileInfo } from "@/store/modules/fileInfo";
import { setFileInMap, getFileFromMap, deleteFileFromMap, clearFileMap } from "@/store/modules/fileInfo";
import { addSentFile, updateSessionId } from '@/store/modules/sentFileInfo';

import axios from "axios";
import { getToken } from '@/index'
import store from "@/store";
import { hasValidConfig } from "@/utils/userConfig";

// 定义消息内容类型
interface TextMessage {
    type: 'text';
    text: string;
}

interface FileMessage {
    type: string;
    file_id: string | null;
}

type MessageContent = TextMessage | FileMessage;

const Bottom: React.FC = () => {
    const inputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const [input, setInput] = useState('')
    const [isFocused, setIsFocused] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const dispatch = useDispatch()
    const startConversation = useStartConversation()
    const loading = useSelector(selectLoading)
    const fileInfo = useSelector(selectUploadFileInfo)

    // UX8: textarea 自动调整高度
    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
        // 自动调整高度
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
        }
    };

   const handleClick = async () => {
        if (loading) return;

        // 检查用户是否已配置 API Key
        if (!hasValidConfig()) {
            message.warning('请先配置 API Key 后再发送消息');
            return;
        }

       const editorContent = input.trim();
        if (!editorContent) {
            message.error('请输入内容');
            return;
        }

        dispatch(setLoading(true))
        const currentMsg = editorContent;
        setInput('')
        try {
            dispatch(updateSessionId());
            const newSessionId = store.getState().sentFileInfo.currentSessionId;
            if (fileInfo.length > 0) {
                // 上传文件并获取文件ID
                await Promise.all(fileInfo.map(async (item) => {
                    const formData = new FormData()
                    formData.append('file', getFileFromMap(item.file_id!))
                    const response = await axios.post('https://api.coze.cn/v1/files/upload', formData, {
                        headers: {
                            "Authorization": `Bearer ${getToken()}`,
                        },
                    });
                    const { code, data } = response.data;
                    if (code === 0) {
                        // 更新当前文件信息
                        dispatch(setFileInfo({
                            file_id: data.id,
                            fileName: data.file_name,
                            fileType: item.fileType,
                            isloading: item.isloading,
                            fileBase: item.fileBase,
                        }))
                        dispatch(addSentFile({
                            file_id: data.id,
                            fileName: data.file_name,
                            fileType: item.fileType,
                            fileBase: item.fileBase,
                            session_id: newSessionId
                        }))
                    }
                }))

                const updatedFileInfo = store.getState().fileInfo.uploadFileInfo
                const messageContent: MessageContent[] = [{
                    type: 'text',
                    text: currentMsg
                }]
                updatedFileInfo.forEach(item => {
                    const id = item.file_id
                    const type = item.fileType
                    messageContent.push({
                        type: type,
                        file_id: id
                    })
                })
                const content = JSON.stringify(messageContent)
                dispatch(clearFileInfo())
                clearFileMap()
                await startConversation(currentMsg, 'object_string', content, newSessionId)
            } else {
                await startConversation(currentMsg)
            }
        } catch (err) {
            console.error('Send message error:', err);
            message.error('发送消息失败，请检查网络后重试');
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

    // 文件上传事件 
    const handleFileClick = (inputElement: React.RefObject<HTMLInputElement>) => {
        if (inputElement.current) {
            inputElement.current.click();
        }
    }

    // 处理文件上传
    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        // 获取插入的文件
        const files = event.target.files

        // 判断是否存在文件
        if (!files || files.length === 0) return
        const file = files[0]
        try {
            // 生成文件/照片ID
            const fileId = Date.now().toString();
            setFileInMap(fileId, file);
            dispatch(addFileInfo({
                file_id: fileId,
                fileName: file.name,
                fileType: file.type.startsWith('image/') ? 'image' : 'file',
                isloading: true,
                fileBase: '',
            }))

            if (file.type.startsWith('image/')) {
                const base64 = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(file);
                });

                dispatch(setFileInfo({
                    file_id: fileId,
                    fileName: file.name,
                    fileType: 'image',
                    isloading: false,
                    fileBase: base64,
                }))
            } else {
                // 处理其他文件
                dispatch(setFileInfo({
                    file_id: fileId,
                    fileName: file.name,
                    fileType: 'file',
                    isloading: false,
                    fileBase: '',
                }))
            }
        } catch (err) {
            console.log(err);
        } finally {
            event.target.value = '';
        }
    }
    // 删除预览文件
    const handleDeleteFile = (fileId: string) => {
        deleteFileFromMap(fileId)
        dispatch(deleteFileInfo(fileId))
    }

    return (
        <div className="chat-input-container" onKeyDownCapture={(e) => {
            if (e.code === 'Enter') {
                e.preventDefault()
            }
        }}>
            {/* 显示上传的文件预览 */}
            {fileInfo.length > 0 && (
                <div className="uploaded-files-container">
                    {fileInfo.map(file => (
                        <div key={file.file_id} className="uploaded-file-item">
                            {file.fileType === 'image' ? (
                                <div className="uploaded-image-container">
                                    {!file.isloading ? (
                                        <img src={file.fileBase} alt="上传的图片" className="uploaded-image-preview" />
                                    ) : (
                                        <div className="loading-image">
                                            <div className="spinner"></div>
                                        </div>
                                    )}
                                    <button
                                        className="delete-file-button"
                                        onClick={() => handleDeleteFile(file.file_id!)}
                                    >
                                        <DeleteOutlined />
                                    </button>
                                </div>
                            ) : (
                                <div className="uploaded-file-container">
                                    {!file.isloading ? (
                                        <span className="file-name">📎 {file.fileName}</span>
                                    ) : (
                                        <div className="loading-image">
                                            <div className="spinner"></div>
                                        </div>
                                    )}
                                    <button
                                        className="delete-file-button"
                                        onClick={() => handleDeleteFile(file.file_id!)}
                                    >
                                        <DeleteOutlined />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <div className="input-and-send-container">
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={handleInputChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    autoFocus
                    placeholder="请输入消息..."
                    className="chat-input"
                    onKeyDown={handleKeyDown}
                    rows={1}
                />

                <div className="chat-send">
                    <div className="chat-file">
                        <button onClick={() => handleFileClick(inputRef)}>
                            <FontAwesomeIcon icon={faFolderPlus} style={{ fontSize: "2.4rem", color: "#B0B0B0" }} />
                        </button>
                        <button onClick={() => handleFileClick(imageInputRef)}>
                            <FontAwesomeIcon icon={faCameraAlt} style={{ fontSize: "2.4rem", color: "#B0B0B0" }} />
                        </button>
                        <input
                            type="file"
                            ref={inputRef}
                            style={{ display: "none" }}
                            onChange={handleFileChange}
                        />
                        <input
                            type="file"
                            accept="image/*"
                            ref={imageInputRef}
                            style={{ display: "none" }}
                            onChange={handleFileChange}
                        />
                    </div>

                    <Button
                        type="primary"
                        icon={<SendOutlined />}
                        className="chat-send-button"
                        onClick={handleClick}
                        disabled={loading}
                        style={{
                            backgroundColor: "#4A90E2"
                        }}
                    >
                        {loading ? '发送中...' : '发送'}
                    </Button>
                </div>
            </div>
            {/* UX8: 输入提示 */}
            <div style={{
                fontSize: '1.1rem',
                color: '#666',
                textAlign: 'right',
                marginTop: '0.4rem',
                paddingRight: '0.4rem',
                opacity: isFocused || input.length > 0 ? 1 : 0.5,
                transition: 'opacity 0.3s'
            }}>
                Enter 发送，Shift+Enter 换行
            </div>
        </div>
    )
}
export default Bottom
