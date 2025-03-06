import React, { useState, useRef } from "react";
import { Button, message } from "antd";
import { SendOutlined, DeleteOutlined } from "@ant-design/icons";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolderPlus, faCameraAlt } from '@fortawesome/free-solid-svg-icons';
import { useDispatch, useSelector } from "react-redux";
import { useStartConversation } from "@/service/index";
import { setLoading } from "@/store/modules/loading";
import { selectLoading } from "@/store/modules/loading";
import { selectUploadFileInfo } from "@/store/modules/fileInfo";
import { setFileInfo, addFileInfo, deleteFileInfo } from "@/store/modules/fileInfo";
import axios from "axios";
import { token } from '@/index'
import store from "@/store";
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

    const dispatch = useDispatch()
    const startConversation = useStartConversation()
    const loading = useSelector(selectLoading)
    const fileInfo = useSelector(selectUploadFileInfo)

    const handleClick = async () => {
        const editorContent = input.trim();
        if (!editorContent) {
            message.error('请输入内容');
            return;
        }

        dispatch(setLoading(true))
        const currentMsg = editorContent;
        setInput('')
        try {
            if (fileInfo.length > 0) {
                // 这里上传文件
                await Promise.all(fileInfo.map(async (item) => {
                    const formData = new FormData()
                    formData.append('file', item.file)
                    const response = await axios.post('https://api.coze.cn/v1/files/upload', formData, {
                        headers: {
                            "Authorization": `Bearer ${token}`,
                        },
                    });
                    const { code, data } = response.data;
                    if (code === 0) {
                        dispatch(setFileInfo({
                            file_id: data.id,
                            fileName: data.file_name,
                            fileType: item.fileType,
                            isloading: item.isloading,
                            fileBase: item.fileBase,
                            file: item.file
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

                await startConversation(currentMsg, 'object_string', content)

            } else {
                await startConversation(currentMsg)
            }

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
            dispatch(addFileInfo({
                file_id: fileId,
                fileName: file.name,
                fileType: file.type.startsWith('image/') ? 'image' : 'file',
                isloading: true,
                fileBase: '',
                file: file
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
                    file: file
                }))
            } else {
                // 处理其他文件
                dispatch(setFileInfo({
                    file_id: fileId,
                    fileName: file.name,
                    fileType: 'file',
                    isloading: false,
                    fileBase: '',
                    file: file
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
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="请输入消息"
                    className="chat-input"
                    onKeyDown={handleKeyDown}
                />

                <div className="chat-send">
                    <div className="chat-file">
                        <button onClick={() => handleFileClick(inputRef)}>
                            <FontAwesomeIcon icon={faFolderPlus} style={{ fontSize: "24px" }} />
                        </button>
                        <button onClick={() => handleFileClick(imageInputRef)}>
                            <FontAwesomeIcon icon={faCameraAlt} style={{ fontSize: "24px" }} />
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
                    >
                        {loading ? '发送中...' : '发送'}
                    </Button>
                </div>
            </div>
        </div>
    )
}
export default Bottom