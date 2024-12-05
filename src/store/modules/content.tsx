import { createSlice } from "@reduxjs/toolkit";

export const contentSlice = createSlice({
    name: 'content',
    initialState: {
        value: {
            msg: '',
            response: '',
            follow: []
        }
    },
    reducers: {
        setContent: (state, action) => {
            state.value.msg = action.payload.msg || state.value.msg;
            state.value.response = action.payload.response || state.value.response;
            state.value.follow = action.payload.follow || state.value.follow;
        }
    }
})

export const { setContent } = contentSlice.actions
export default contentSlice.reducer
export const selectContent = (state: { content: { value: { msg: string, response: string, follow: string[] }; }; }) => state.content.value