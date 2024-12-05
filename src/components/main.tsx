import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { marked } from "marked";
import hljs from "../highlight";
import 'highlight.js/styles/default.css';

import aiImage from '@/assets/imgs/ai.jpg';
import { selectContent } from "@/store/modules/content";
import { useStartConversation } from "@/service/index";
import { setLoading } from "@/store/modules/loading";
import { message } from "antd";

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

                // 代码块 language 和 copy 按钮
                const blockTopStyle = document.createElement("div")
                blockTopStyle.setAttribute('class', 'hljs-div')

                const blockSpan = document.createElement('span')
                blockSpan.textContent = language
                blockSpan.setAttribute('class', 'hljs-span')

                const blockBtn = document.createElement("button")
                blockBtn.setAttribute('class', 'hljs-btn')
                blockBtn.textContent = '复制'

                blockTopStyle.appendChild(blockSpan)
                blockTopStyle.appendChild(blockBtn)

                block.innerHTML = highlightedCode

                let fistChild = block.firstChild
                if (fistChild) {
                    block.insertBefore(blockTopStyle, fistChild)
                }

                block.classList.add('hljs');
            });

            setMarkRes(doc.body.innerHTML);
        };

        processResponse();
    }, [response]);
    useEffect(() => {
        const handleCopyClick = async (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            // 确保点击的是带 hljs-btn 按钮
            if (target && target.classList.contains('hljs-btn')) {
                const codeBlock = target.closest('pre > code');
                // 提取纯文本
                if (codeBlock) {
                    const pureText = Array.from(codeBlock.childNodes)
                        .filter(node => !(node as HTMLElement).classList?.contains('hljs-div'))
                        .map(node => node.textContent)
                        .join('')
                    try {
                        await navigator.clipboard.writeText(pureText);
                        message.success('代码已复制');
                    } catch {
                        message.error('复制失败');
                    }
                }
            }
        };
        // 添加用户点击页面监听器
        document.addEventListener('click', handleCopyClick);
        return () => {
            document.removeEventListener('click', handleCopyClick);
        };
    }, []);
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
