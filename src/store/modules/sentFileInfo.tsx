import { createSlice } from "@reduxjs/toolkit";

interface SentFileInfo {
    file_id: string | null
    fileName: string
    fileType: string
    fileBase: string
    session_id: string
}

export const sentFileInfoSlice = createSlice({
    name: 'sentFileInfo',
    initialState: {
        sentFiles: [] as SentFileInfo[],
        currentSessionId: Date.now().toString()
    },
    reducers: {
        // 添加已发送的文件
        addSentFile: (state, action) => {
            state.sentFiles.push(action.payload)
        },
        // 更新当前会话ID
        updateSessionId: (state) => {
            state.currentSessionId = Date.now().toString()
        }
    }
})

export const { addSentFile, updateSessionId } = sentFileInfoSlice.actions
export default sentFileInfoSlice.reducer
export const selectSentFiles = (state: { sentFileInfo: { sentFiles: SentFileInfo[] } }) => state.sentFileInfo.sentFiles
export const selectCurrentSessionId = (state: { sentFileInfo: { currentSessionId: string } }) => state.sentFileInfo.currentSessionId