import React, { useEffect, useState, useMemo } from "react";
import { useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import 'highlight.js/styles/atom-one-dark.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faRedo } from '@fortawesome/free-solid-svg-icons';
import { selectContent, setContent, cacheStreamContent, restoreFromCache, clearStreamCache } from "@/store/modules/content";
import { useStartConversation } from "@/service/index";
import { setLoading, selectLoading } from "@/store/modules/loading";
import { selectConversationInfo, setConversationInfo } from "@/store/modules/conversationInfo";
import { selectConversationId } from "@/store/modules/conversation";
import { useMarked } from "./marked";
import { message, Spin } from "antd";
import { Modal } from "antd";
import { getToken, getBotId, createClient } from '../index'
import { hasValidConfig } from '@/utils/userConfig'
import { ChatEventType, RoleType } from "@coze/api";
import axios from "axios";
import { selectSentFiles, selectCurrentSessionId } from "@/store/modules/sentFileInfo";
import store from "@/store";


const Main: React.FC = () => {
    // UX10: 格式化时间
    const getCurrentTime = (): string => {
        const d = new Date();
        const h = d.getHours().toString().padStart(2, '0');
        const m = d.getMinutes().toString().padStart(2, '0');
        return `${h}:${m}`;
    };

    const currentConversationId = useSelector(selectConversationId)
    const content = useSelector(selectContent);
    const { conversationInfo } = useSelector(selectConversationInfo)
    const dispatch = useDispatch();
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const [markRes, setMarkRes] = useState('')
    const [localFollow, setLocalFollow] = useState<string[]>([])
    const [localMsg, setLocalMsg] = useState<string>('')
    const [error, setError] = useState<string>('')
    const [historyLoading, setHistoryLoading] = useState(false);

    const { msg, response, follow, message_id } = content;
    const startConversation = useStartConversation();
    const startMarked = useMarked()

    const sentFiles = useSelector(selectSentFiles);
    const currentSessionId = useSelector(selectCurrentSessionId);
    const loading = useSelector(selectLoading);

    // 预计算 sentFiles 按 session_id 索引，避免每次渲染重复 filter
    const sentFilesBySession = useMemo(() => {
        const map = new Map<string, typeof sentFiles>();
        sentFiles.forEach(file => {
            const existing = map.get(file.session_id);
            if (existing) {
                existing.push(file);
            } else {
                map.set(file.session_id, [file]);
            }
        });
        return map;
    }, [sentFiles]);
    const currentSessionFiles = useMemo(() =>
        sentFilesBySession.get(currentSessionId) || [],
        [sentFilesBySession, currentSessionId]
    );

    useEffect(() => {
        let cancelled = false;
        const getHistoryInfo = async () => {
            try {
                // B7: 切换会话时清空 Redux content 状态
                dispatch(setContent({ msg: '', response: '', follow: [], message_id: '' }));
                // 占位会话/空会话不做历史消息加载，直接展示空对话 UI
                if (!currentConversationId || currentConversationId === 'placeholder') {
                    setHistoryLoading(false);
                    setError('');
                    return;
                }
                setHistoryLoading(true);
                setError('');

                const response = await axios.post('https://api.coze.cn/v1/conversation/message/list',
                    {},
                    {
                        headers: {
                            Authorization: `Bearer ${getToken()}`,
                            'Content-Type': 'application/json',
                        },
                        params: { conversation_id: currentConversationId }
                    }
                )
                if (cancelled) return;
                const { data } = response
                if (data.code === 0) {
                    data.data.reverse()
                    const newData = []
                    for (let i = 0; i < data.data.length; i += 2) {
                        // B5: 使用可选链防止 meta_data 为 undefined 时报错
                        const metaInfo = data.data[i]?.meta_data
                        const userMessage = metaInfo?.content || ''
                        const metaId = metaInfo?.id || ''
                        const assistantMessage = data.data[i + 1]
                        const aiContent = assistantMessage ? await startMarked(assistantMessage.content) : ''
                        const newItem = {
                            userContent: userMessage || '',
                            assistantContent: aiContent || '',
                            meta_id: metaId,
                            timestamp: getCurrentTime()
                        };
                        newData.push(newItem)
                    }
                    if (!cancelled) {
                        dispatch(setConversationInfo(newData))
                    }
                }
            } catch (err) {
                // UX7: 添加错误处理 UI
                if (!cancelled) {
                    console.log(err);
                    setError('加载历史消息失败');
                    message.error('加载历史消息失败，请检查网络后重试');
                }
            } finally {
                if (!cancelled) {
                    setHistoryLoading(false);
                    // B8: 切换回已缓存的对话时，恢复之前缓存的部分流式响应内容
                    const cached = store.getState().content.streamCache[currentConversationId];
                    if (cached && cached.response) {
                        dispatch(restoreFromCache(currentConversationId));
                    }
                }
            }
        }
        getHistoryInfo()
        return () => { cancelled = true; }
    }, [currentConversationId])

    useEffect(() => {
        setMarkRes('')
        setLocalFollow([])
    }, [conversationInfo])

    useEffect(() => {
        setLocalMsg(msg)
    }, [msg])

    useEffect(() => {
        let cancelled = false;
        const processResponse = async () => {
            try {
                const resMarked = await startMarked(response)
                if (!cancelled) {
                    setMarkRes(resMarked)
                }
            } catch (err) {
                console.error('Error processing markdown response:', err);
                if (!cancelled) {
                    setMarkRes(response)
                }
            }
        }
        processResponse()
        return () => { cancelled = true; }
    }, [response])

    useEffect(() => {
        if (follow) {
            setLocalFollow(follow)
        }
    }, [follow])

    // UX6: 自动滚动到底部
    useEffect(() => {
        if (chatContainerRef.current) {
            const container = chatContainerRef.current.closest('.content') as HTMLElement;
            if (container) {
                container.scrollTop = container.scrollHeight;
            }
        }
    }, [conversationInfo, markRes, localFollow, localMsg, response])

    const handleClick = async (item: string) => {
        // 检查用户是否已配置 API Key
        if (!hasValidConfig()) {
            message.warning('请先配置 API Key 后再发送消息');
            return;
        }
        dispatch(setLoading(true));
        try {
            await startConversation(item);
        } catch (err) {
            // UX7: 错误处理 UI
            console.log(err);
            message.error('发送消息失败，请稍后重试');
            setError('发送消息失败');
        } finally {
            dispatch(setLoading(false));
        }
    }

    const handleCopyText = () => {
        navigator.clipboard.writeText(response).then(() => {
            message.success('复制成功')
        }).catch(() => {
            message.error('复制失败')
        })
    }

    const handleRegenerate = async () => {
        // 检查用户是否已配置 API Key
        if (!hasValidConfig()) {
            message.warning('请先配置 API Key 后再发送消息');
            return;
        }
        // UX9: 重新生成前确认
        Modal.confirm({
            title: '重新生成',
            content: '重新生成将删除当前回复并重新请求 AI，是否继续？',
            onOk: async () => {
                dispatch(setLoading(true));
                try {
                    // 保存旧消息 ID，用于流成功后清理
                    const oldAssistantMsgId = message_id;

                    // 获取旧 user message ID（流成功后清理用）
                    let oldUserMsgId = '';
                    try {
                        const listRes = await axios.post('https://api.coze.cn/v1/conversation/message/list',
                            {},
                            {
                                headers: {
                                    Authorization: `Bearer ${getToken()}`,
                                    'Content-Type': 'application/json',
                                },
                                params: { conversation_id: currentConversationId }
                            }
                        );
                        if (listRes.data.code === 0 && listRes.data.data.length > 0) {
                            oldUserMsgId = listRes.data.data[0].id;
                        }
                    } catch (e) {
                        console.error('获取旧消息ID失败:', e);
                    }

                    // 本地清空 UI
                    setMarkRes('')
                    setLocalFollow([])

                    // 先发起流请求（不删旧消息，防止流失败后对话为空）
                    const stream = await createClient().chat.stream({
                        bot_id: getBotId()!,
                        conversation_id: currentConversationId!,
                        additional_messages: [{
                            role: RoleType.User,
                            content: localMsg,
                            content_type: 'text',
                        }]
                    });

                    let completeResponse = '';
                    let followArr: string[] = [];
                    let messageId = ''
                    let hasError = false;
                    dispatch(setContent({ msg: localMsg, response: '', follow: [], message_id: '' }))
                    const regenerateId = currentConversationId;
                    for await (const part of stream) {
                        // B8: 检测对话是否已切换，避免重新生成的流式内容污染其他对话
                        const latestId = store.getState().conversation.value.currentConversationId;
                        if (latestId !== regenerateId) {
                            console.log('对话已切换，缓存重新生成的流式响应');
                            // B8: 缓存部分响应内容，切换回去时可恢复
                            dispatch(cacheStreamContent({
                                conversationId: regenerateId,
                                data: { msg: localMsg, response: completeResponse, follow: followArr, message_id: messageId }
                            }));
                            hasError = true;
                            break;
                        }

                        if (part.event === ChatEventType.CONVERSATION_CHAT_FAILED) {
                            console.error('Chat failed:', JSON.stringify(part.data, null, 2));
                            hasError = true;
                            message.error('重新生成失败，请稍后重试');
                            break;
                        }
                        if (part.event === ChatEventType.ERROR) {
                            console.error('Stream error:', JSON.stringify(part.data, null, 2));
                            hasError = true;
                            message.error('重新生成出错，请稍后重试');
                            break;
                        }
                        if (part.event === ChatEventType.CONVERSATION_MESSAGE_DELTA) {
                            completeResponse += part.data.content;
                            messageId = part.data.id;
                            dispatch(setContent({ msg: localMsg, response: completeResponse, follow: followArr, message_id: messageId }));
                        }
                        if (part.event === ChatEventType.CONVERSATION_MESSAGE_COMPLETED && part.data.type === "follow_up") {
                            followArr = [...followArr, part.data.content];
                            dispatch(setContent({ msg: localMsg, response: completeResponse, follow: followArr, message_id: messageId }));
                        }
                    }

                    if (!hasError) {
                        // B8: 重新生成流正常完成，清除缓存
                        dispatch(clearStreamCache(currentConversationId));
                        // 流请求成功，清理旧消息
                        try {
                            if (oldAssistantMsgId) {
                                await axios.post('https://api.coze.cn/v1/conversation/message/delete', {},
                                    {
                                        headers: {
                                            Authorization: `Bearer ${getToken()}`,
                                            'Content-Type': 'application/json',
                                        },
                                        params: { conversation_id: currentConversationId, message_id: oldAssistantMsgId }
                                    }
                                );
                            }
                            if (oldUserMsgId) {
                                await axios.post('https://api.coze.cn/v1/conversation/message/delete', {},
                                    {
                                        headers: {
                                            Authorization: `Bearer ${getToken()}`,
                                            'Content-Type': 'application/json',
                                        },
                                        params: { conversation_id: currentConversationId, message_id: oldUserMsgId }
                                    }
                                );
                            }
                        } catch (e) {
                            console.error('清理旧消息失败，不影响使用:', e);
                        }
                    } else {
                        setError('重新生成失败');
                    }

                } catch (err) {
                    // UX7: 错误处理 UI
                    console.log(err);
                    message.error('重新生成失败，请稍后重试');
                    setError('重新生成失败');
                } finally {
                    dispatch(setLoading(false));
                }
            }
        });
    }
    return (
        <div className="chat-main" ref={chatContainerRef}>
            {/* UX7: 错误状态显示 */}
            {error && (
                <div className="error-banner">
                    <span>{error}</span>
                    <button onClick={() => setError('')} className="error-dismiss">?</button>
                </div>
            )}
            {/* UX5: 加载状态 */}
            {historyLoading && conversationInfo.length === 0 && !msg && !markRes && !error && (
                <div className="loading-indicator">
                    <Spin tip="加载中..." />
                </div>
            )}
            {/* 历史记录区域 */}
            {conversationInfo && conversationInfo.map((item, index) => (
                <div className="main" key={index}>
                    {item.userContent && <div className="user">
                        {/* UX10: 消息时间戳 */}
                        {item.timestamp && <div className="message-time">{item.timestamp}</div>}
                        {(sentFilesBySession.get(item.meta_id) || []).map(file => (
                            file.fileType === 'image' ? (
                                <div key={file.file_id} className="uploaded-image">
                                    <img src={file.fileBase} alt={file.fileName} className="chat-image" />
                                </div>
                            ) : (
                                <div key={file.file_id} className="uploaded-file">
                                    <a href="#">📎 {file.fileName}</a>
                                </div>
                            )
                        ))}
                        {item.userContent}
                    </div>}
                    {item.assistantContent && (
                        <div className="ai">
                            {/* UX10: 消息时间戳 */}
                            {item.timestamp && <div className="message-time-left">{item.timestamp}</div>}
                            <div className="test" dangerouslySetInnerHTML={{ __html: item.assistantContent }} />
                        </div>
                    )}
                </div>
            ))}

            {/* 流式输出区域 */}
            <div className="main">
                {localMsg && <div className="user">
                    {/* UX10: 当前消息时间戳 */}
                    <div className="message-time">{getCurrentTime()}</div>
                    {currentSessionFiles.map(file => (
                        file.fileType === 'image' ? (
                            <div key={file.file_id} className="uploaded-image">
                                <img src={file.fileBase} alt={file.fileName} style={{ maxWidth: '100%', maxHeight: 'none' }} />
                            </div>
                        ) : (
                            <div key={file.file_id} className="uploaded-file">
                                <a href="#">📎 {file.fileName}</a>
                            </div>
                        )
                    ))}
                    {localMsg}
                </div>}
                <div className="ai">
                    {markRes ? (
                        <div>
                            <div className="test" dangerouslySetInnerHTML={{ __html: markRes }} /></div>) : (<div>
                                {msg ? <Spin /> : null}
                            </div>
                    )}
                </div>
                {markRes && (
                    <div className="icons">
                        <button className="copy-btn" onClick={handleCopyText}>
                            <FontAwesomeIcon icon={faCopy} style={{ color: "#B0B0B0", fontSize: "1.4rem" }} />
                        </button>
                        <button onClick={handleRegenerate}>
                            <FontAwesomeIcon icon={faRedo} style={{ color: "#B0B0B0", fontSize: "1.4rem" }} />
                        </button>
                    </div>
                )}
                {localFollow.length > 0 &&
                    localFollow.map((item, index) => (
                        <div className="follow_up" key={`follow-${index}`} onClick={() => handleClick(item)}>
                            <p>
                                <a href="#">{item}</a>
                            </p>
                        </div>
                    ))}
            </div>
        </div>
    );
};

export default Main;
