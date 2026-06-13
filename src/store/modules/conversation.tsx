import { createSlice } from "@reduxjs/toolkit";

interface ConversationContent {
    conversation_id: string,
    value: string
}
const getStoredConversations = (): ConversationContent[] => {
    try {
        const stored = localStorage.getItem("conversationContent")
        return stored ? JSON.parse(stored) : []
    } catch {
        return []
    }
}
const getStoredId = () => {
    try {
        const stored = localStorage.getItem("currentConversationId")
        return stored ? JSON.parse(stored) : ''
    } catch {
        return ''
    }
}
export const conversationSlice = createSlice({
    name: 'conversation',
    initialState: {
        value: {
            conversationContent: getStoredConversations(),
            currentConversationId: getStoredId()
        }
    },
    reducers: {
        addConversationContent: (state, action) => {
            state.value.conversationContent.unshift(action.payload)
            localStorage.setItem("conversationContent", JSON.stringify(state.value.conversationContent))

        },
        setCurrentConversationId: (state, action) => {
            state.value.currentConversationId = action.payload
            localStorage.setItem("currentConversationId", JSON.stringify(state.value.currentConversationId))
        },
        // UX1: 更新会话标题（使用第一条用户消息的前20字）
        updateConversationTitle: (state, action) => {
            const { conversation_id, title } = action.payload;
            const index = state.value.conversationContent.findIndex(c => c.conversation_id === conversation_id);
            if (index !== -1) {
                state.value.conversationContent[index].value = title;
                localStorage.setItem("conversationContent", JSON.stringify(state.value.conversationContent));
            }
        },
        // UX3: 删除会话
        deleteConversationContent: (state, action) => {
            const conversationId = action.payload;
            state.value.conversationContent = state.value.conversationContent.filter(
                item => item.conversation_id !== conversationId
            );
            localStorage.setItem("conversationContent", JSON.stringify(state.value.conversationContent));
            // 如果删除的是当前会话，切换到第一个可用会话
            if (state.value.currentConversationId === conversationId) {
                state.value.currentConversationId = state.value.conversationContent[0]?.conversation_id || '';
                localStorage.setItem("currentConversationId", JSON.stringify(state.value.currentConversationId));
            }
        }
    }
})

export const { addConversationContent, setCurrentConversationId, updateConversationTitle, deleteConversationContent } = conversationSlice.actions
export default conversationSlice.reducer

export const selectConversation = (state: { conversation: { value: { conversationContent: ConversationContent[] } }; }) => state.conversation.value.conversationContent
export const selectConversationId = (state: { conversation: { value: { currentConversationId: string } } }) => state.conversation.value.currentConversationId
