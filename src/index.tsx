import React from "react";
import { createRoot } from 'react-dom/client'
import store from "./store";
import { Provider } from "react-redux";
import { CozeAPI, COZE_CN_BASE_URL } from "@coze/api";
import App from "@/App";

const root = document.getElementById('root')

if (root) {
    createRoot(root).render(
        <Provider store={store}>
            <App></App>
        </Provider>
    )
}
// 设置 60s 超时，防止请求长时间挂起导致 loading 状态永久持续
export const client = new CozeAPI({
    token: process.env.REACT_APP_TOKEN!,
    allowPersonalAccessTokenInBrowser: true,
    baseURL: COZE_CN_BASE_URL,
    axiosOptions: {
        timeout: 60000,
    },
})
export const botId = process.env.REACT_APP_BOT_ID
export const token = process.env.REACT_APP_TOKEN
