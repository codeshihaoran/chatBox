import { createSlice } from "@reduxjs/toolkit";

interface StreamCacheEntry {
    msg: string;
    response: string;
    follow: string[];
    message_id: string;
    meta_id: string;
}

export const contentSlice = createSlice({
    name: 'content',
    initialState: {
        value: {
            msg: '',
            response: '',
            follow: [] as string[],
            message_id: '',
            meta_id: ''
        },
        // B8: 按对话 ID 缓存流式响应的中间内容，切换回时恢复
        streamCache: {} as Record<string, StreamCacheEntry>
    },
    reducers: {
        // Use strict null/undefined check instead of || to prevent empty strings from being lost
        setContent: (state, action) => {
            if (action.payload.msg !== undefined && action.payload.msg !== null) {
                state.value.msg = action.payload.msg;
            }
            if (action.payload.response !== undefined && action.payload.response !== null) {
                state.value.response = action.payload.response;
            }
            if (action.payload.follow !== undefined && action.payload.follow !== null) {
                state.value.follow = action.payload.follow;
            }
            if (action.payload.message_id !== undefined && action.payload.message_id !== null) {
                state.value.message_id = action.payload.message_id;
            }
            if (action.payload.meta_id !== undefined && action.payload.meta_id !== null) {
                state.value.meta_id = action.payload.meta_id;
            }
        },
        // B8: 缓存某个对话的流式响应中间内容（切换会话时保存）
        cacheStreamContent: (state, action) => {
            const { conversationId, data } = action.payload;
            if (data) {
                state.streamCache[conversationId] = data;
            }
        },
        // B8: 清除某个对话的缓存（流正常完成或恢复后清除）
        clearStreamCache: (state, action) => {
            delete state.streamCache[action.payload];
        },
        // B8: 从缓存恢复到当前 content（切换回对话时使用）
        restoreFromCache: (state, action) => {
            const cached = state.streamCache[action.payload];
            if (cached) {
                state.value.msg = cached.msg;
                state.value.response = cached.response;
                state.value.follow = cached.follow;
                state.value.message_id = cached.message_id;
                state.value.meta_id = cached.meta_id;
                delete state.streamCache[action.payload];
            }
        }
    }
})

export const { setContent, cacheStreamContent, clearStreamCache, restoreFromCache } = contentSlice.actions
export default contentSlice.reducer
export const selectContent = (state: { content: { value: { msg: string, response: string, follow: string[], message_id: string, meta_id: string }; }; }) => state.content.value
export const selectStreamCache = (state: { content: { streamCache: Record<string, StreamCacheEntry> } }) => state.content.streamCache
