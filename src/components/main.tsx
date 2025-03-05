import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import 'highlight.js/styles/default.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faRedo } from '@fortawesome/free-solid-svg-icons';

import { selectUploadFileInfo } from "@/store/modules/fileInfo";
import aiImage from '@/assets/imgs/ai.jpg';
import { selectContent } from "@/store/modules/content";
import { useStartConversation } from "@/service/index";
import { setLoading } from "@/store/modules/loading";
import { selectConversationInfo } from "@/store/modules/conversationInfo";
import { selectConversation } from "@/store/modules/conversation";
import { setContent } from "@/store/modules/content";
import { useMarked } from "./marked";
import { message } from "antd";
import { client, botId, token } from '../index'
import { ChatEventType, RoleType, ContentType } from "@coze/api";
import axios from "axios";

const Main: React.FC = () => {
    const fileInfo = useSelector(selectUploadFileInfo)
    // console.log(fileInfo.fileName);

    const { conversation_id } = useSelector(selectConversation)
    const content = useSelector(selectContent);
    const { conversationInfo } = useSelector(selectConversationInfo)
    const dispatch = useDispatch();

    const [markRes, setMarkRes] = useState('')
    const [localFollow, setLocalFollow] = useState<string[]>([])
    const [localMsg, setLocalMsg] = useState<string>('')

    const { msg, response, follow, message_id } = content;
    const startConversation = useStartConversation();
    const startMarked = useMarked()

    useEffect(() => {
        setMarkRes('')
        setLocalFollow([])
        setLocalMsg('')
    }, [conversationInfo])

    useEffect(() => {
        setLocalMsg(msg)
    }, [msg])

    useEffect(() => {
        const processResponse = async () => {
            const resMarked = await startMarked(response)
            setMarkRes(resMarked)
        }
        processResponse()
    }, [response])

    useEffect(() => {
        if (follow) {
            setLocalFollow(follow)
        }
    }, [follow])

    const handleClick = async (item: string) => {
        dispatch(setLoading(true));
        try {
            await startConversation(item);
        } catch (err) {
            console.log(err);
        } finally {
            dispatch(setLoading(false));
        }
    }

    const handleCopyText = () => {
        navigator.clipboard.writeText(response)
        message.success('复制成功')
    }

    const handleRegenerate = async () => {
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
                    params: { conversation_id, message_id }
                }
            )

            const response = await axios.post('https://api.coze.cn/v1/conversation/message/list',
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    params: { conversation_id }
                }
            )

            const userMsgId = response.data.data[0].id

            await axios.post('https://api.coze.cn/v1/conversation/message/delete', {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    params: { conversation_id, message_id: userMsgId }
                }
            )
            const stream = await client.chat.stream({
                bot_id: botId!,
                conversation_id: conversation_id!,
                additional_messages: [{
                    role: RoleType.User,
                    content: localMsg,
                    content_type: 'text',
                }]
            });

            let completeResponse = '';
            let followArr: string[] = [];
            let messageId = ''
            for await (const part of stream) {
                if (part.event === ChatEventType.CONVERSATION_MESSAGE_DELTA) {
                    completeResponse += part.data.content;
                    messageId = part.data.id
                }
                if (part.event === ChatEventType.CONVERSATION_MESSAGE_COMPLETED && part.data.type === "follow_up") {
                    followArr = [...followArr, part.data.content];
                }

                dispatch(setContent({ msg: localMsg, response: completeResponse, follow: followArr, message_id: messageId }));
            }

        } catch {

        }

    }
    return (
        <div className="chat-main">
            {/* 历史记录区域 */}
            {conversationInfo && conversationInfo.map((item, index) => (
                <div className="main" key={index}>
                    {item.userContent && <div className="user">{item.userContent}</div>}
                    {item.assistantContent && (
                        <div className="ai">
                            <img src={aiImage} alt="" />
                            <div className="test" dangerouslySetInnerHTML={{ __html: item.assistantContent }} />
                        </div>
                    )}
                </div>
            ))}
            {/* 流式输出区域以及渲染follow区域 */}
            <div className="main">
                {localMsg && <div className="user">
                    {fileInfo.map(item => (
                        item.fileType === 'image' ? (<div className="uploaded-image">
                            <img src={item.fileBase} alt={item.fileName} style={{ maxWidth: '200px' }} />
                        </div>) : (<div className="uploaded-file">
                            <a href="#">📎 {item.fileName}</a>
                        </div>)
                    ))}
                    {localMsg}
                </div>}
                {markRes && (
                    <div className="ai">
                        <img src={aiImage} alt="" />
                        <div className="test" dangerouslySetInnerHTML={{ __html: markRes }} />
                    </div>
                )}
                {markRes && (
                    <div className="icons">
                        <button className="copy-btn" onClick={handleCopyText}>
                            <FontAwesomeIcon icon={faCopy} style={{ fontSize: "14px" }} />
                        </button>
                        <button onClick={handleRegenerate}>
                            <FontAwesomeIcon icon={faRedo} style={{ fontSize: "14px" }} />
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
