import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { marked } from "marked";
import hljs from "../highlight";
import 'highlight.js/styles/default.css';

import aiImage from '@/assets/imgs/ai.jpg';
import { selectContent } from "@/store/modules/content";
import { useStartConversation } from "@/service/index";
import { setLoading } from "@/store/modules/loading";

const Main: React.FC = () => {
    const content = useSelector(selectContent);
    const dispatch = useDispatch();
    const [markRes, setMarkRes] = useState('');
    const { msg, response, follow } = content;
    const startConversation = useStartConversation();

    useEffect(() => {
        const processResponse = async () => {
            const markResponse = await marked(response);
            const parser = new DOMParser();
            const doc = parser.parseFromString(markResponse, 'text/html');
            const codeBlocks = doc.querySelectorAll('pre > code');
            codeBlocks.forEach((block) => {
                const codeContent = block.textContent || '';
                const languageMatch = block.className.match(/language-(\w+)/);
                const language = languageMatch ? languageMatch[1] : 'plaintext'
                const highlightedCode = hljs.highlight(codeContent, { language }).value;
                block.innerHTML = highlightedCode;
                block.classList.add('hljs');
            });

            setMarkRes(doc.body.innerHTML);
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
