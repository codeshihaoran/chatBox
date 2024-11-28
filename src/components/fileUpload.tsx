import React, { useState } from "react";
import { Button, Upload, message } from "antd";
import { FilePdfTwoTone, LoadingOutlined } from "@ant-design/icons";
import { token } from "../index";
import axios from "axios";
const FileUpload: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const handleUpload = async (file: File) => {
        const formData = new FormData()
        formData.append('file', file)
        try {
            setLoading(true)
            const response = await axios.post('https://api.coze.cn/v1/files/upload', formData, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            })
            const { code, msg, data } = response.data
            if (code === 0) {
                message.success(`File uploaded successfully: ${data.file_name}`)
            }
        } catch (err) {
            console.log(err);
            message.error('error')
        } finally {
            setLoading(false)
        }
    }
    const beforeUpload = (file: File) => {
        handleUpload(file);
        return false;
    };
    return (
        <Upload
            name="file"
            accept=".pdf,.png,.jpg,.jpeg"
            showUploadList={false}
            beforeUpload={beforeUpload}
        >
            <Button
                type="primary"
                icon={loading ? <LoadingOutlined /> : <FilePdfTwoTone />}
                disabled={loading}
            >
                {loading ? "uploading" : "upload"}
            </Button>
        </Upload>
    )
}
export default FileUpload