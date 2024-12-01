import { configureStore } from "@reduxjs/toolkit";
import contentReducer from './modules/content'
export default configureStore({
    reducer: {
        content: contentReducer
    }
})