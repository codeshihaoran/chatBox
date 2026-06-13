import React, { useEffect, useState } from "react";
import { useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import 'highlight.js/styles/atom-one-dark.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faRedo } from '@fortawesome/free-solid-svg-icons';
import { selectContent } from "@/store/modules/content";
import { useStartConversation } from "@/service/index";
import { setLoading } from "@/store/modules/loading";
import { selectLoading } from "@/store/modules/loading";
import { selectConversationInfo, setConversationInfo } from "@/store/modules/conversationInfo";
import { selectConversationId } from "@/store/modules/conversation";
import { setContent } from "@/store/modules/content";
import { useMarked } from "./marked";
import { message, Spin } from "antd";
import { Modal } from "antd";
import { client, botId, token } from '../index'
import { ChatEventType, RoleType } from "@coze/api";
import axios from "axios";
import { selectSentFiles, selectCurrentSessionId } from "@/store/modules/sentFileInfo";


const Main: React.FC = () => {
    // UX10: 格式化时间
    const getCurrentTime = (): string => {
        const d = new Date();
        const h = d.getHours().toString().padStart(2, '0');
        const m = d.getMinutes().toString().padStart(2, '0');
        `${h}:${m}`;
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

    const { msg, response, follow, message_id } = content;
    const startConversation = useStartConversation();
    const startMarked = useMarked()

    const sentFiles = useSelector(selectSentFiles);
    const currentSessionId = useSelector(selectCurrentSessionId);
    const loading = useSelector(selectLoading);

    useEffect(() => {
        let cancelled = false;
        const getHistoryInfo = async () => {
            try {
                // B7: 切换会话时清空 Redux content 状态
                dispatch(setContent({ msg: '', response: '', follow: [], message_id: '' }));
                dispatch(setLoading(true));
                setError('');

                const response = await axios.post('https://api.coze.cn/v1/conversation/message/list',
                    {},
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
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
                    dispatch(setLoading(false));
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
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [conversationInfo, markRes, localFollow])

    const handleClick = async (item: string) => {
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
        // UX9: 重新生成前确认
        Modal.confirm({
            title: '重新生成',
            content: '重新生成将删除当前回复并重新请求 AI，是否继续？',
            onOk: async () => {
                dispatch(setLoading(true));
        try {
            // 本地清空
            setMarkRes('')
            setLocalFollow([])

            await axios.post('https://api.coze.cn/v1/conversation/message/delete', {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    params: { conversation_id: currentConversationId, message_id }
                }
            )

            const response = await axios.post('https://api.coze.cn/v1/conversation/message/list',
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    params: { conversation_id: currentConversationId }
                }
            )

            const userMsgId = response.data.data[0].id

            await axios.post('https://api.coze.cn/v1/conversation/message/delete', {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    params: { conversation_id: currentConversationId, message_id: userMsgId }
                }
            )
            const stream = await client.chat.stream({
                bot_id: botId!,
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
            for await (const part of stream) {
                if (part.event === ChatEventType.CONVERSATION_CHAT_FAILED) {
                    console.error('Chat failed:', part.data);
                    hasError = true;
                    message.error('重新生成失败，请稍后重试');
                    break;
                }
                if (part.event === ChatEventType.ERROR) {
                    console.error('Stream error:', part.data);
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
            if (hasError) {
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
{loading && conversationInfo.length === 0 && !msg && !markRes && !error && (
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
                        {sentFiles
                            .filter(file => file.session_id === item.meta_id)
                            .map(file => (
                                file.fileType === 'image' ? (
                                    <div key={file.file_id} className="uploaded-image">
                                        <img src={file.fileBase} alt={file.fileName} style={{ maxWidth: '400px', maxHeight: 'none' }} />
                                    </div>
                                ) : (
                                    <div key={file.file_id} className="uploaded-file">
                                        <a href="#">?? {file.fileName}</a>
                                    </div>
                                )
                            ))
                        }
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
                    {sentFiles
                        .filter(file => file.session_id === currentSessionId)
                        .map(file => (
                            file.fileType === 'image' ? (
                                <div key={file.file_id} className="uploaded-image">
                                    <img src={file.fileBase} alt={file.fileName} style={{ maxWidth: '400px', maxHeight: 'none' }} />
                                </div>
                            ) : (
                                <div key={file.file_id} className="uploaded-file">
                                    <a href="#">?? {file.fileName}</a>
                                </div>
                            )
                        ))
                    }
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
                            <FontAwesomeIcon icon={faCopy} style={{ color: "#B0B0B0", fontSize: "14px" }} />
                        </button>
                        <button onClick={handleRegenerate}>
                            <FontAwesomeIcon icon={faRedo} style={{ color: "#B0B0B0", fontSize: "14px" }} />
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
