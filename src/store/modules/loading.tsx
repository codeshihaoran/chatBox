import { createSlice } from "@reduxjs/toolkit";

export const loadingSlice = createSlice({
    name: 'loading',
    initialState: {
        value: false
    },
    reducers: {
        setLoading: (state, actions) => {
            state.value = actions.payload
        }
    }
})
export const { setLoading } = loadingSlice.actions
export const selectLoading = (state: { loading: { value: boolean } }) => state.loading.value
export default loadingSlice.reducer