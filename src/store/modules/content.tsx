import { createSlice } from "@reduxjs/toolkit";

export const contentSlice = createSlice({
    name: 'content',
    initialState: {
        value: {
            msg: '',
            response: ''
        }
    },
    reducers: {
        setContent: (state, action) => {
            state.value = { ...state.value, ...action.payload };
        }
    }
})

export const { setContent } = contentSlice.actions
export default contentSlice.reducer
export const selectContent = (state: { content: { value: { msg: string, response: string }; }; }) => state.content.value