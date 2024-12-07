import { createSlice } from "@reduxjs/toolkit";

type Message = {
    userContent: string;
    assistantContent: string;
};

export const conversationInfoSlice = createSlice({
    name: 'conversationInfo',
    initialState: {
        value: {
            conversationInfo: []
        }
    },
    reducers: {
        setConversationInfo: (state, action) => {
            state.value.conversationInfo = action.payload
        }
    }
})

export const { setConversationInfo } = conversationInfoSlice.actions
export default conversationInfoSlice.reducer
export const selectConversationInfo = (state: { conversationInfo: { value: { conversationInfo: Message[] } }; }) => state.conversationInfo.value