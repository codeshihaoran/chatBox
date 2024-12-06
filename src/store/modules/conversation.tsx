import { createSlice } from "@reduxjs/toolkit";

export const conversationSlice = createSlice({
    name: 'conversation',
    initialState: {
        value: {
            conversation_id: ''
        }
    },
    reducers: {
        setId: (state, action) => {
            state.value.conversation_id = action.payload
        }
    }
})

export const { setId } = conversationSlice.actions
export default conversationSlice.reducer
export const selectConversation = (state: { conversation: { value: { conversation_id: string } }; }) => state.conversation.value