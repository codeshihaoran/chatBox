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
        }
    }
})

export const { addConversationContent, setCurrentConversationId } = conversationSlice.actions
export default conversationSlice.reducer

export const selectConversation = (state: { conversation: { value: { conversationContent: ConversationContent[] } }; }) => state.conversation.value.conversationContent
export const selectConversationId = (state: { conversation: { value: { currentConversationId: string } } }) => state.conversation.value.currentConversationId