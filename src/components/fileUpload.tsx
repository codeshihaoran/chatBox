import React, { useRef } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolderPlus, faCameraAlt } from '@fortawesome/free-solid-svg-icons';
import { message } from "antd";
import { token } from '@/index'
import axios from "axios";

import { setFileInfo } from "@/store/modules/fileInfo";
import { useDispatch } from "react-redux";

const FileUpload: React.FC = () => {
    const inputRef = useRef<HTMLInputElement>(null)
    const dispatch = useDispatch()
    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files
        if (files && files.length > 0) {
            const formData = new FormData()
            formData.append('file', files[0])
            const fileType = files[0].type;
            let messageType = 'file'
            if (fileType.startsWith('image/')) {
                messageType = 'image'
            }
            try {
                const response = await axios.post('https://api.coze.cn/v1/files/upload', formData, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                })
                const { code, data } = response.data
                if (code === 0) {
                    console.log(data);

                    dispatch(setFileInfo({ file_id: data.id, fileName: data.file_name, fileType: messageType }))
                }
            } catch (err) {
                console.log(err);
                message.error('error')
            } finally {
            }
        }
    }
    const handleClick = () => {
        if (inputRef.current) {
            inputRef.current.click()
        }
    }
    return (
        <div className="chat-file">
            <button onClick={handleClick}><FontAwesomeIcon icon={faFolderPlus} style={{ fontSize: "24px" }} /></button>
            <button><FontAwesomeIcon icon={faCameraAlt} style={{ fontSize: "24px" }} /></button>
            <input type="file"
                ref={inputRef}
                style={{ display: "none" }}
                onChange={handleFileChange}
            />
        </div>
    )
}
export default FileUpload