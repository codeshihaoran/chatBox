import { CozeAPI, COZE_CN_BASE_URL, RoleType } from "@coze/api";

const STORAGE_KEY = 'chat-userConfig';

export interface UserConfigData {
  apiKey: string;
  botId: string;
  isVerified: boolean;
}

export function saveUserConfig(config: UserConfigData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function getUserConfig(): UserConfigData | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function clearUserConfig(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function hasValidConfig(): boolean {
  const config = getUserConfig();
  return !!(config && config.isVerified && config.apiKey && config.botId);
}

/**
 * Validate Coze Personal Access Token format.
 * Coze PAT starts with "pat_", is at least 50 characters long,
 * and contains only alphanumeric chars, underscores and hyphens after the prefix.
 */
export function validateApiKey(key: string): { valid: boolean; error?: string } {
  const trimmed = key.trim();
  if (!trimmed) {
    return { valid: false, error: 'API Key 不能为空' };
  }
  if (!trimmed.startsWith('pat_')) {
    return { valid: false, error: 'API Key 格式不正确，应以 pat_ 开头' };
  }
  if (trimmed.length < 50) {
    return { valid: false, error: 'API Key 长度不正确（Coze PAT 长度通常在 50 位以上）' };
  }
  const afterPrefix = trimmed.substring(4);
  if (!/^[a-zA-Z0-9_\-]+$/.test(afterPrefix)) {
    return { valid: false, error: 'API Key 包含无效字符' };
  }
  return { valid: true };
}

/**
 * Validate Bot ID format.
 * Coze Bot ID is a numeric string with at least 10 digits.
 */
export function validateBotId(id: string): { valid: boolean; error?: string } {
  const trimmed = id.trim();
  if (!trimmed) {
    return { valid: false, error: 'Bot ID 不能为空' };
  }
  if (!/^\d+$/.test(trimmed)) {
    return { valid: false, error: 'Bot ID 应为纯数字' };
  }
  if (trimmed.length < 10) {
    return { valid: false, error: 'Bot ID 长度不正确' };
  }
  return { valid: true };
}

/**
 * Test connection by sending a real request through the Coze API SDK.
 *
 * 方案说明（伪请求测试）：
 * 仅仅校验格式是不够的（如 bot_id 少填一位数字格式校验仍会通过），
 * 必须通过官方 SDK 发起一次真实的 API 调用来验证配置的有效性。
 *
 * SDK 的 client.chat.create() 使用 POST /v3/chat（非流式），Coze 服务端会：
 *   1. 验证 API Key 鉴权
 *   2. 验证 Bot ID 是否存在且可用
 *   3. 让 Bot 处理 "." 消息并返回完整响应
 *
 * 测试成功后，响应内容仅用于验证，不会渲染给用户。
 * 使用 auto_save: false 确保不会在 Coze 侧保存测试数据。
 *
 * 关键修复说明：
 * 之前使用 fetch POST /v1/chat 失败，因为 Coze 的聊天接口是 v3 版本。
 * 现在使用官方 SDK（与项目中的实际对话相同的底层调用），保障请求格式完全正确。
 */
export async function testConnection(
  apiKey: string,
  botId: string
): Promise<{ success: boolean; error?: string }> {
  // 使用 Coze 官方 SDK 创建客户端（30s 超时防止测试挂起）
  const client = new CozeAPI({
    token: apiKey,
    allowPersonalAccessTokenInBrowser: true,
    baseURL: COZE_CN_BASE_URL,
    axiosOptions: { timeout: 30000 },
  });

  try {
    // Step 1: 创建测试会话 —— 验证 API Key 鉴权是否通过
    const convRes = await fetch('https://api.coze.cn/v1/conversation/create', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    const convData = await convRes.json();

    if (convData.code !== 0) {
      if (convData.code === 4000 || convData.code === 4100 || convData.code === 4200) {
        return { success: false, error: 'API Key 无效或已过期，请检查后重试' };
      }
      return { success: false, error: convData.msg || 'API Key 验证失败' };
    }

    const conversationId = convData.data.id;

    // Step 2: 通过 SDK 发起非流式对话请求（POST /v3/chat）
    // 使用官方 SDK 确保请求格式与项目中的实际对话完全一致
    // 发送一条 "." 极简文本消息让 Bot 处理
    // 响应仅用于验证配置有效性，不会渲染给用户
    await client.chat.create({
      bot_id: botId,
      conversation_id: conversationId,
      additional_messages: [
        {
          role: RoleType.User,
          content: '.',
          content_type: 'text',
        },
      ],
      auto_save: false,
    });

    // SDK 没有抛出异常 → API Key 和 Bot ID 均有效，测试通过
    return { success: true };
  } catch (err: any) {
    // 优先从 SDK 的错误对象中提取响应数据
    const errData = err?.response?.data || {};
    const errMsg = (err?.message || '').toLowerCase();
    const errCode = errData.code || err?.code || 0;

    // 鉴权相关错误
    if (errCode === 4000 || errCode === 4100 || errCode === 4200 ||
        errMsg.includes('token') || errMsg.includes('auth') ||
        errMsg.includes('unauthorized') || errMsg.includes('permission')) {
      return { success: false, error: 'API Key 无效或已过期，请检查后重试' };
    }

    // Bot ID 相关错误
    if (errCode === 5000 || errMsg.includes('bot') || errMsg.includes('bot_id') ||
        errData.msg?.includes('bot') || errData.msg?.includes('Bot')) {
      return { success: false, error: 'Bot ID 无效或该 Bot 不可用，请检查后重试' };
    }

    // 网络或超时错误
    if (errMsg.includes('timeout') || errMsg.includes('network') || errMsg.includes('econnaborted')) {
      return { success: false, error: '网络连接超时，请检查网络设置后重试' };
    }

    return { success: false, error: errData.msg || err.message || '连接测试失败，请检查配置信息' };
  }
}
