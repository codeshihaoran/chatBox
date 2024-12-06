import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import 'highlight.js/styles/default.css';
import { token } from "../index";

import aiImage from '@/assets/imgs/ai.jpg';
import { selectContent } from "@/store/modules/content";
import { useStartConversation } from "@/service/index";
import { setLoading } from "@/store/modules/loading";
import { selectConversation } from "@/store/modules/conversation";
import { useMarked } from "./marked";
import axios from "axios";

type Message = {
    userContent: string;
    assistantContent: string;
};

const Main: React.FC = () => {
    const content = useSelector(selectContent);
    const dispatch = useDispatch();
    const [markRes, setMarkRes] = useState('');
    const { msg, response, follow } = content;
    const startConversation = useStartConversation();
    const { conversation_id } = useSelector(selectConversation)

    const [markContent, setMarkContent] = useState<Message[]>([]);
    const startMarked = useMarked()

    useEffect(() => {
        const getMessageList = async () => {
            if (conversation_id) {
                try {
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
                    const { data } = response
                    if (data.code === 0) {
                        data.data.reverse()
                        const newData = []
                        for (let i = 0; i < data.data.length - 2; i += 2) {
                            const userMessage = data.data[i]
                            const assistantMessage = data.data[i + 1]
                            const aiContent = await startMarked(assistantMessage.content)
                            const newItem = {
                                userContent: userMessage?.content || '',
                                assistantContent: aiContent || ''
                            };
                            newData.push(newItem)
                        }
                        setMarkContent(newData)
                    }
                } catch {

                }
            }
        }
        getMessageList()
    }, [msg])
    useEffect(() => {
        const processResponse = async () => {
            const resMarked = await startMarked(response)
            setMarkRes(resMarked);
        };

        processResponse();
    }, [response]);

    const handleClick = async (item: string) => {
        dispatch(setLoading(true));
        try {
            await startConversation(item);
        } catch (err) {
            console.log(err);
        } finally {
            dispatch(setLoading(false));
        }
    };
    return (
        <div className="chat-main">
            {/* 历史记录区域 */}
            {markContent && markContent.map((item, index) => (
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
            {/* 流式输出区域 */}
            <div className="main">
                {msg && <div className="user">{msg}</div>}
                {markRes && (
                    <div className="ai">
                        <img src={aiImage} alt="" />
                        <div className="test" dangerouslySetInnerHTML={{ __html: markRes }} />
                    </div>
                )}
                {follow.length > 0 && follow.map((item, index) => (
                    <div className="follow_up" key={index} onClick={() => handleClick(item)}>
                        <p><a href="#">{item}</a></p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Main;
