import React, { useEffect } from "react";
import { Flex, Layout, message } from "antd";
import { useDispatch } from "react-redux";
const { Header, Sider, Content, Footer } = Layout

import { token } from "../index";
import { setId } from "@/store/modules/conversation";

import Navbar from "@/components/navbar";
import Main from "@/components/main";
import Bottom from "@/components/bottom";
import axios from "axios";


const Home: React.FC = () => {
    const dispatch = useDispatch()
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
        document.addEventListener('click', handleCopyClick)
        return () => {
            document.removeEventListener('click', handleCopyClick)
        }
    }, [])
    useEffect(() => {
        const getConversationId = async () => {
            const response = await axios.post('https://api.coze.cn/v1/conversation/create', {}, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            })
            const { data } = response
            if (data.code === 0) {
                dispatch(setId(data.data.id))
            }
        }
        getConversationId()
    }, [])
    return (
        <Flex gap="middle" wrap>
            <Layout className="layout">
                <Sider className="sider">
                    Sider
                </Sider>
                <Layout>
                    <Header className="header">
                        <Navbar />
                    </Header>
                    <Content className="content">
                        <Main />
                    </Content>
                    <Footer className="footer">
                        <Bottom />
                    </Footer>
                </Layout>
            </Layout>
        </Flex>
    )
}
export default Home