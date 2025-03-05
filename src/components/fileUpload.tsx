import React, { useRef, useState } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolderPlus, faCameraAlt } from '@fortawesome/free-solid-svg-icons';
import { message } from "antd";
import { token } from '@/index'
import axios from "axios";
import { setFileInfo } from "@/store/modules/fileInfo";
import { useDispatch } from "react-redux";

const FileUpload: React.FC = () => {
    const inputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const dispatch = useDispatch();
    const [isUploading, setIsUploading] = useState(false);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (isUploading) return;
        setIsUploading(true);

        try {
            dispatch(setFileInfo({ file_id: '', fileName: '', fileType: '', fileBase: '' }));
            const files = event.target.files;

            if (files && files.length > 0) {
                const formData = new FormData();
                formData.append('file', files[0]);
                const fileType = files[0].type;
                let messageType = 'file';
                let base64String = '';

                if (fileType.startsWith('image/')) {
                    messageType = 'image';
                    base64String = await new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result as string);
                        reader.readAsDataURL(files[0]);
                    });
                }

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
                        fileType: messageType,
                        fileBase: base64String,
                    }));
                }
            }
        } catch (err) {
            console.log(err);
            message.error('上传失败');
        } finally {
            setIsUploading(false);
            // 清除 input 的值，允许重复上传相同文件
            event.target.value = '';
        }
    };

    const handleClick = (inputElement: React.RefObject<HTMLInputElement>) => {
        if (inputElement.current) {
            inputElement.current.click();
        }
    };

    return (
        <div className="chat-file">
            <button onClick={() => handleClick(inputRef)}>
                <FontAwesomeIcon icon={faFolderPlus} style={{ fontSize: "24px" }} />
            </button>
            <button onClick={() => handleClick(imageInputRef)}>
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
    );
};

// ... existing code ...

export default FileUpload;
