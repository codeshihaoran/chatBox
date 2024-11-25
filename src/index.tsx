import React from "react";
import { createRoot } from 'react-dom/client'
import { CozeAPI, COZE_CN_BASE_URL } from "@coze/api";
import App from "@/App";

const root = document.getElementById('root')

if (root) {
    createRoot(root).render(
        <App></App>
    )
}
export const client = new CozeAPI({
    token: process.env.REACT_APP_TOKEN!,
    allowPersonalAccessTokenInBrowser: true,
    baseURL: COZE_CN_BASE_URL,
})
export const botId = process.env.REACT_APP_BOT_ID