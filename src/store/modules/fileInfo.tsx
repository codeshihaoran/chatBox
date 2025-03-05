import { createSlice } from "@reduxjs/toolkit";
interface FileInfo {
    file_id: string | null;
    fileName: string;
    fileType: string;
    isloading: boolean;
    fileBase: string;
    file: File
}
export const fileInfoSlice = createSlice({
    name: 'fileInfo',
    initialState: {
        uploadFileInfo: [] as FileInfo[]
    },
    reducers: {
        setFileInfo: (state, action) => {
            // 这里可以使用 ...
            let lastFileInfo = state.uploadFileInfo[state.uploadFileInfo.length - 1]
            lastFileInfo.fileBase = action.payload.fileBase
            lastFileInfo.isloading = action.payload.isloading
            lastFileInfo.file_id = action.payload.file_id
            lastFileInfo.fileName = action.payload.fileName
        },
        // 添加文件
        addFileInfo: (state, action) => {
            state.uploadFileInfo.push(action.payload)
        },
        // 删除某个文件
        deleteFileInfo: (state, action) => {
            state.uploadFileInfo = state.uploadFileInfo.filter(item => {
                return item.file_id !== action.payload
            })
        },
        // 清空文件信息
        clearFileInfo: (state) => {
            state.uploadFileInfo = []
        }
    }
})

export const { addFileInfo, deleteFileInfo, clearFileInfo, setFileInfo } = fileInfoSlice.actions
export default fileInfoSlice.reducer
export const selectUploadFileInfo = (state: { fileInfo: { uploadFileInfo: FileInfo[] } }) => state.fileInfo.uploadFileInfo