import React, { useEffect, useState } from "react";
import { Flex, Layout, message, Menu, Button } from "antd";
import { useDispatch } from "react-redux";
const { Header, Sider, Content, Footer } = Layout

import { token } from "../index";
import { setId } from "@/store/modules/conversation";

import Navbar from "@/components/navbar";
import Main from "@/components/main";
import Bottom from "@/components/bottom";
import axios from "axios";
import { UploadOutlined, UserOutlined, VideoCameraOutlined, FormOutlined, SearchOutlined } from "@ant-design/icons";


const Home: React.FC = () => {
    const dispatch = useDispatch()
    const [collapsed, setCollapsed] = useState(false)
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

    const handleChangeClick = (data: boolean) => {
        setCollapsed(data)
    }
    return (
        <Flex gap="middle" wrap>
            <Layout className="layout">
                <Sider
                    className="sider"
                    trigger={null}
                    collapsed={collapsed}
                    style={{ background: '#121212' }}
                >
                    <div className="sider-top">
                        <Button
                            type="text"
                            className="sider-btn"
                            icon={<SearchOutlined style={{ color: '#B0B0B0', fontSize: '20px' }} />}
                            style={{
                                width: 48,
                                height: 48,
                                display: collapsed ? "none" : "block"
                            }}
                        ></Button>
                        <Button
                            type="text"
                            className="sider-btn"
                            icon={<FormOutlined style={{ color: '#B0B0B0', fontSize: '20px' }} />}
                            style={{
                                width: 48,
                                height: 48,
                                display: collapsed ? "none" : "block"
                            }}
                        ></Button>
                    </div>
                    <Menu
                        mode="inline"
                        style={{
                            background: '#121212',
                            color: '#ffffff'
                        }}
                        items={[
                            {
                                key: '1',
                                icon: <UserOutlined style={{ color: '#ffffff' }} />,
                                label: <span style={{ color: '#ffffff' }}>nav 1</span>
                            },
                            {
                                key: '2',
                                icon: <VideoCameraOutlined style={{ color: '#ffffff' }} />,
                                label: <span style={{ color: '#ffffff' }}>nav 2</span>
                            },
                            {
                                key: '3',
                                icon: <UploadOutlined style={{ color: '#ffffff' }} />,
                                label: <span style={{ color: '#ffffff' }}>nav 3</span>
                            }
                        ]}
                    />
                </Sider>

                <Layout style={{ background: '#1B1B1B', color: '#ffffff' }}>
                    <Header className="header" style={{ background: '#1B1B1B' }}>
                        <Navbar
                            sendStatusToHome={handleChangeClick}
                            status={collapsed}
                        />
                    </Header>
                    <Content className="content" style={{ background: '#1B1B1B' }}>
                        <Main />
                    </Content>
                    <Footer className="footer"
                        style={{
                            background: "#1B1B1B",
                            color: "rgba(255,255,255,0.7)",
                        }}
                    >
                        <Bottom />
                    </Footer>
                </Layout>
            </Layout>
        </Flex>
    )
}
export default Home