import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import 'highlight.js/styles/default.css';

import aiImage from '@/assets/imgs/ai.jpg';
import { selectContent } from "@/store/modules/content";
import { useStartConversation } from "@/service/index";
import { setLoading } from "@/store/modules/loading";
import { selectConversationInfo } from "@/store/modules/conversationInfo";
import { setContent } from "@/store/modules/content";
import { useMarked } from "./marked";

const Main: React.FC = () => {
    const content = useSelector(selectContent);
    const { conversationInfo } = useSelector(selectConversationInfo)
    const dispatch = useDispatch();

    const [markRes, setMarkRes] = useState('')
    const [localFollow, setLocalFollow] = useState<string[]>([])
    const [localMsg, setLocalMsg] = useState<string>('')

    const { msg, response, follow } = content;
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
    };
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
                {localMsg && <div className="user">{localMsg}</div>}
                {markRes && (
                    <div className="ai">
                        <img src={aiImage} alt="" />
                        <div className="test" dangerouslySetInnerHTML={{ __html: markRes }} />
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
