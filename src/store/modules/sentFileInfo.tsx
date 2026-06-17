import { createSlice } from "@reduxjs/toolkit";

interface SentFileInfo {
    file_id: string | null
    fileName: string
    fileType: string
    fileBase: string
    session_id: string
}

const MAX_SENT_FILES = 50;

const getStoredFileInfo = () => {
    try {
        const stored = localStorage.getItem("sentFileInfo")
        return stored ? JSON.parse(stored) : []
    } catch {
        return []
    }
}
export const sentFileInfoSlice = createSlice({
    name: 'sentFileInfo',
    initialState: {
        sentFiles: getStoredFileInfo(),
        currentSessionId: Date.now().toString()
    },
    reducers: {
        // 添加已发送的文件，超出上限时自动移除最旧记录
        addSentFile: (state, action) => {
            state.sentFiles.push(action.payload)
            // 超出上限时，从头部移除最旧的记录
            while (state.sentFiles.length > MAX_SENT_FILES) {
                state.sentFiles.shift()
            }
            localStorage.setItem("sentFileInfo", JSON.stringify(state.sentFiles))
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