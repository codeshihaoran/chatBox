import { createSlice } from "@reduxjs/toolkit";

export const contentSlice = createSlice({
    name: 'content',
    initialState: {
        value: {
            msg: '',
            response: '',
            follow: [],
            message_id: ''
        }
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
        }
    }
})

export const { setContent } = contentSlice.actions
export default contentSlice.reducer
export const selectContent = (state: { content: { value: { msg: string, response: string, follow: string[], message_id: string }; }; }) => state.content.value
