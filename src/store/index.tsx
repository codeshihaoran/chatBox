import { configureStore } from "@reduxjs/toolkit";
import contentReducer from '@/store/modules/content'
import loadingReducer from '@/store/modules/loading'
export default configureStore({
    reducer: {
        content: contentReducer,
        loading: loadingReducer
    }
})