import { createSlice } from "@reduxjs/toolkit";
interface FileInfo {
    file_id: string | null;
    fileName: string;
    fileType: string;
    isloading: boolean;
    fileBase: string;
}
// 用外部 Map 存储 File 对象，避免非可序列化数据进入 Redux store
const fileMap = new Map<string, File>();

export const setFileInMap = (fileId: string, file: File) => {
    fileMap.set(fileId, file);
};

export const getFileFromMap = (fileId: string): File | undefined => {
    return fileMap.get(fileId);
};

export const deleteFileFromMap = (fileId: string) => {
    fileMap.delete(fileId);
};

export const clearFileMap = () => {
    fileMap.clear();
};

export const fileInfoSlice = createSlice({
    name: 'fileInfo',
    initialState: {
        uploadFileInfo: [] as FileInfo[]
    },
    reducers: {
        setFileInfo: (state, action) => {
            // 这里可以使用 ...
            // 空数组保护：防止 uploadFileInfo 为空时访问 undefined 属性
            if (state.uploadFileInfo.length === 0) return;
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
