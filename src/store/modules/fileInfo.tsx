import { createSlice } from "@reduxjs/toolkit";

export const fileInfoSlice = createSlice({
    name: 'fileInfo',
    initialState: {
        value: {
            file_id: null,
            fileName: '',
            fileType: '',
            fileBase: '',
        }
    },
    reducers: {
        setFileInfo: (state, action) => {
            state.value = { ...state.value, ...action.payload };
        }
    }
})

export const { setFileInfo } = fileInfoSlice.actions
export default fileInfoSlice.reducer
export const selectFileInfo = (state: { fileInfo: { value: { file_id: null, fileName: string, fileType: string, fileBase: string }; }; }) => state.fileInfo.value