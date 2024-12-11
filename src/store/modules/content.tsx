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
        setContent: (state, action) => {
            state.value.msg = action.payload.msg || state.value.msg;
            state.value.response = action.payload.response || state.value.response;
            state.value.follow = action.payload.follow || state.value.follow;
            state.value.message_id = action.payload.message_id || state.value.message_id;
        }
    }
})

export const { setContent } = contentSlice.actions
export default contentSlice.reducer
export const selectContent = (state: { content: { value: { msg: string, response: string, follow: string[], message_id: string }; }; }) => state.content.value