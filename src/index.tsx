import React from "react";
import { createRoot } from 'react-dom/client'
import store from "./store";
import { Provider } from "react-redux";
import { CozeAPI, COZE_CN_BASE_URL } from "@coze/api";
import App from "@/App";
import { getUserConfig } from "@/utils/userConfig";

const root = document.getElementById('root')

if (root) {
    createRoot(root).render(
        <Provider store={store}>
            <App></App>
        </Provider>
    )
}

/** 获取当前有效的 API Token（用户必须配置，无默认回退） */
export function getToken(): string {
  const config = getUserConfig();
  if (config?.isVerified && config.apiKey) return config.apiKey;
  return '';
}

/** 获取当前有效的 Bot ID（用户必须配置，无默认回退） */
export function getBotId(): string {
  const config = getUserConfig();
  if (config?.isVerified && config.botId) return config.botId;
  return '';
}

/** 创建 Coze API 客户端实例 */
export function createClient(apiKey?: string): CozeAPI {
  return new CozeAPI({
    token: apiKey || getToken(),
    allowPersonalAccessTokenInBrowser: true,
    baseURL: COZE_CN_BASE_URL,
    axiosOptions: {
      timeout: 60000,
    },
  });
}

export type { UserConfigData } from "@/utils/userConfig";
