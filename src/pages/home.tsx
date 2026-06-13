import React, { ReactNode, useEffect, useState } from "react";
import { Flex, Layout, message, Menu, Button, Input } from "antd";
import { useDispatch, useSelector } from "react-redux";
const { Header, Sider, Content, Footer } = Layout

import { token } from "../index";
import { addConversationContent, selectConversation, setCurrentConversationId, selectConversationId, deleteConversationContent } from "@/store/modules/conversation";
import { selectConversationInfo } from "@/store/modules/conversationInfo";
import { selectContent } from "@/store/modules/content";


import Navbar from "@/components/navbar";
import Main from "@/components/main";
import Bottom from "@/components/bottom";
import axios from "axios";
import { FormOutlined, GithubOutlined, MessageOutlined, SearchOutlined } from "@ant-design/icons";

import { Coze } from '@lobehub/icons';
interface MenuItems {
    key: string,
    id: string,
    label: ReactNode
}

const Home: React.FC = () => {
    const dispatch = useDispatch()
    const [collapsed, setCollapsed] = useState(false)
    const conversationContent = useSelector(selectConversation)
    const currentConversationId = useSelector(selectConversationId)
    console.log(currentConversationId);


    const conversationInfo = useSelector(selectConversationInfo);
    const content = useSelector(selectContent);
    const currentConv = conversationContent.find(c => c.conversation_id === currentConversationId);
    const isEmptyConversation = currentConv && !currentConv.value && conversationInfo.conversationInfo.length === 0 && !content.msg && !content.response;

    const [selectKeys, setSelectKeys] = useState("")
    const [searchVisible, setSearchVisible] = useState(false)
    const [searchText, setSearchText] = useState("")
    const menuItems: MenuItems[] = conversationContent
        .filter(item => {
            if (!searchVisible || !searchText) return true
            return item.value && item.value.toLowerCase().includes(searchText.toLowerCase())
        })
        .map((item, index) => ({
            key: index.toString(),
            id: item.conversation_id,
            label: <span style={{ color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '120px', display: 'block', textAlign: 'left' }}>{item.value ? item.value.substring(0, 20) + (item.value.length > 20 ? '...' : '') : '\u65b0\u5bf9\u8bdd'}</span>,
            icon: <MessageOutlined style={{ color: '#B0B0B0' }} />
        }))
    useEffect(() => {
        const handleCopyClick = async (e: MouseEvent) => {
            const target = e.target as HTMLElement;

            if (target && target.classList.contains('hljs-btn')) {
                const codeBlock = target.closest('pre > code');
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

        document.addEventListener('click', handleCopyClick)
        return () => {
            document.removeEventListener('click', handleCopyClick)
        }
    }, [])
    useEffect(() => {
        if (!currentConversationId) return
        menuItems.forEach(item => {
            if (item.id === currentConversationId) {
                setSelectKeys(item.key)
            }
        })
    }, [currentConversationId, searchVisible, searchText])
    useEffect(() => {
        const getConversationId = async () => {
            const prevConversation = conversationContent[0]
            if (prevConversation) {
                return
            }
            const response = await axios.post('https://api.coze.cn/v1/conversation/create', {}, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            })
            const { data } = response
            if (data.code === 0) {
                console.log(data.data.id);
                dispatch(addConversationContent({ conversation_id: data.data.id, value: '' }))
                dispatch(setCurrentConversationId(data.data.id))
            }
        }
        getConversationId()
    }, [])
    const handleChangeClick = (data: boolean) => {
        setCollapsed(data)
    }
    const handleSelectClick = (e: any) => {
        setSelectKeys(e.key)
        menuItems.forEach(item => {
            if (item.key === e.key) {
                dispatch(setCurrentConversationId(item.id))
            }
        })
    }

    const handleCreateClick = async () => {
        console.log(currentConversationId);

        const prevConversationId = conversationContent[0].conversation_id

        const msgList = await axios.post('https://api.coze.cn/v1/conversation/message/list',
            {},
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                params: { conversation_id: prevConversationId }
            }
        )
        const { data } = msgList
        if (data.data.length === 0) {
            return
        }
        try {

            const response = await axios.post('https://api.coze.cn/v1/conversation/create', {}, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            })
            const { data } = response
            if (data.code === 0) {
                dispatch(addConversationContent({ conversation_id: data.data.id, value: '' }))
                dispatch(setCurrentConversationId(data.data.id))
            }
        } catch (err) {
            console.log(err);
        }

    }
    return (
        <Flex gap="middle" wrap>
            <Layout className="layout">
                <Sider
                    className="sider"
                    trigger={null}
                    collapsed={collapsed}
                    style={{
                        background: '#121212',
                        position: 'relative',
                        height: '100vh',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                    }}
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
                            onClick={() => {
                                setSearchVisible(prev => !prev)
                                setSearchText("")
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

                            onClick={handleCreateClick}
                        ></Button>

                    </div>
                    {!collapsed && searchVisible && (
                        <div style={{ padding: '0 8px', marginBottom: 8 }}>
                            <Input
                                placeholder="请输入内容..."
                                value={searchText}
                                onChange={e => setSearchText(e.target.value)}
                                style={{
                                    background: '#888',
                                    border: '1px solid #333',
                                    color: '#fff',
                                    borderRadius: 6,
                                    width: '100%',
                                }}
                                autoFocus
                                allowClear
                            />
                        </div>
                    )}
                    {!collapsed && <div className="top-doc">
                        <a href="https://www.coze.cn/open/docs/guides">
                            <Coze size={20} style={{ color: '#B0B0B0' }} />
                            <span className="top-doc-span">探索 Coze</span>
                        </a>
                    </div>}
                    <Menu
                        mode="inline"
                        style={{
                            background: '#121212',
                            color: '#ffffff',
                            overflowY: 'auto',
                            flex: 1,
                            minHeight: 0
                        }}
                        onClick={handleSelectClick}
                        items={menuItems}
                        selectedKeys={[selectKeys]}
                    />
                   <div className="sider-bottom" style={{
                       width: '100%',
                        padding: '16px 0',
                        background: '#121212',
                        display: 'flex',
                        justifyContent: 'center',
                        borderTop: '1px solid #333'
                    }}>
                        <Button
                            icon={<GithubOutlined style={{ fontSize: '30px' }} />}
                            onClick={() => window.open('https://github.com/codeshihaoran/chatBox', '_blank')}
                        ></Button>
                    </div>
                </Sider>

                <Layout style={{ background: '#1B1B1B', color: '#ffffff' }}>
                    <Header className="header" style={{ background: '#1B1B1B' }}>
                        <Navbar
                            sendStatusToHome={handleChangeClick}
                            status={collapsed}
                        />
                    </Header>
                    {isEmptyConversation ? (
                        <Content className="content" style={{
                            background: '#1B1B1B',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            overflow: 'hidden'
                        }}>
                            <div className="empty-chat-prompt">你在忙什么？有什么问题需要解决吗？</div>
                            <Bottom />
                        </Content>
                    ) : (
                        <>
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
                        </>
                    )}
                </Layout>
            </Layout>
        </Flex>
    )
}
export default Home


