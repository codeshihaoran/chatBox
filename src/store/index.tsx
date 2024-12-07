import { configureStore } from "@reduxjs/toolkit";
import contentReducer from '@/store/modules/content'
import loadingReducer from '@/store/modules/loading'
import fileInfoReducer from '@/store/modules/fileInfo'
import conversationReducer from '@/store/modules/conversation'
import conversationInfoReducer from '@/store/modules/conversationInfo'
export default configureStore({
    reducer: {
        content: contentReducer,
        loading: loadingReducer,
        fileInfo: fileInfoReducer,
        conversation: conversationReducer,
        conversationInfo: conversationInfoReducer
    }
})