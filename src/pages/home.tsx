import React, { ReactNode, useEffect, useState, useCallback } from "react";
import { Flex, Layout, message, Menu, Button, Input } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { DeleteOutlined } from "@ant-design/icons";
const { Header, Sider, Content, Footer } = Layout

import { getToken } from "../index";
import { hasValidConfig } from "@/utils/userConfig";
import { addConversationContent, selectConversation, setCurrentConversationId, selectConversationId, deleteConversationContent } from "@/store/modules/conversation";
import { selectConversationInfo } from "@/store/modules/conversationInfo";
import { selectContent } from "@/store/modules/content";
import { selectIsLoggedIn } from "@/store/modules/userConfig";


import Navbar from "@/components/navbar";
import Main from "@/components/main";
import Bottom from "@/components/bottom";
import UserConfigModal from "@/components/userConfigModal";
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
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
    const conversationContent = useSelector(selectConversation)
    const currentConversationId = useSelector(selectConversationId)
    const isLoggedIn = useSelector(selectIsLoggedIn)

    const conversationInfo = useSelector(selectConversationInfo);
    const content = useSelector(selectContent);
    const currentConv = conversationContent.find(c => c.conversation_id === currentConversationId);
    const isEmptyConversation = currentConv && !currentConv.value && conversationInfo.conversationInfo.length === 0 && !content.msg && !content.response;

    const [selectKeys, setSelectKeys] = useState("")
    const [searchVisible, setSearchVisible] = useState(false)
    const [searchText, setSearchText] = useState("")

    // 用户配置弹窗状态
    const [configModalVisible, setConfigModalVisible] = useState(false);
    const [initialPromptShown, setInitialPromptShown] = useState(false);

    // 首次加载：如果用户未配置，弹出配置弹窗
    useEffect(() => {
        if (!isLoggedIn && !initialPromptShown) {
            setInitialPromptShown(true);
            // 延迟弹出，让页面先渲染
            const timer = setTimeout(() => {
                setConfigModalVisible(true);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [isLoggedIn, initialPromptShown]);

    // 响应式：检测屏幕宽度变化
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (mobile) {
                setCollapsed(true);
            }
        };
        window.addEventListener('resize', handleResize);
        // 初始检查
        if (window.innerWidth < 768) {
            setCollapsed(true);
        }
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const menuItems: MenuItems[] = conversationContent
        .filter(item => {
            if (!searchVisible || !searchText) return true
            return item.value && item.value.toLowerCase().includes(searchText.toLowerCase())
        })
        .map((item, index) => ({
            key: index.toString(),
            id: item.conversation_id,
            label: (
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        width: '100%'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <span style={{
                        color: '#ffffff',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '10rem',
                        display: 'block',
                        textAlign: 'left',
                        flex: 1
                    }}>
                        {item.value ? item.value.substring(0, 20) + (item.value.length > 20 ? '...' : '') : '新对话'}
                    </span>
                    <Button
                        type="text"
                        size="small"
                        icon={<DeleteOutlined style={{ color: '#B0B0B0', fontSize: '1.4rem' }} />}
                        style={{
                            marginLeft: '0.8rem',
                            minWidth: '2.4rem',
                            height: '2.4rem',
                            padding: 0
                        }}
                        disabled={conversationContent.length <= 1}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteConversation(item.conversation_id);
                        }}
                    />
                </div>
            ),
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
    // 创建真实会话（Coze API）
    const createRealConversation = async (): Promise<string | null> => {
        try {
            const response = await axios.post('https://api.coze.cn/v1/conversation/create', {}, {
                headers: {
                    Authorization: `Bearer ${getToken()}`,
                    'Content-Type': 'application/json',
                },
            })
            const { data } = response
            if (data.code === 0) {
                const id = data.data.id;
                dispatch(addConversationContent({ conversation_id: id, value: '' }))
                dispatch(setCurrentConversationId(id))
                return id
            }
        } catch (err) {
            console.log('创建会话失败:', err);
            message.error('创建会话失败，请检查网络后重试');
        }
        return null
    }

    useEffect(() => {
        const getConversationId = async () => {
            const convs = conversationContent;

            // 已有真实会话（非 placeholder）→ 无需操作
            if (convs.some(c => c.conversation_id !== 'placeholder')) return;

            // 已有 placeholder 且用户已配置 → 先创建真实会话再删除占位符
            if (convs.some(c => c.conversation_id === 'placeholder') && hasValidConfig()) {
                const realId = await createRealConversation();
                if (realId) {
                    dispatch(deleteConversationContent('placeholder'));
                }
                return;
            }

            // 没有任何会话时
            if (!hasValidConfig()) {
                // 用户未配置 → 创建占位会话展示空对话 UI
                dispatch(addConversationContent({ conversation_id: 'placeholder', value: '' }))
                dispatch(setCurrentConversationId('placeholder'))
                return
            }

            // 已配置 → 直接创建真实会话
            await createRealConversation()
        }
        getConversationId()
    }, [isLoggedIn])
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
        // 移动端选择会话后自动收起侧边栏
        if (isMobile) {
            setCollapsed(true);
        }
    }

    const handleDeleteConversation = (conversationId: string) => {
        if (conversationContent.length <= 1) return
        dispatch(deleteConversationContent(conversationId))
        message.success('对话已删除')
    }

    const handleCreateClick = async () => {
        console.log(currentConversationId);

        // 用户未配置时跳过（无 token，API 调用必然失败）
        if (!hasValidConfig()) {
            message.warning('请先配置 API Key 后再创建新对话');
            return;
        }

        const prevConversationId = conversationContent[0].conversation_id

        try {
            const msgList = await axios.post('https://api.coze.cn/v1/conversation/message/list',
                {},
                {
                    headers: {
                        Authorization: `Bearer ${getToken()}`,
                        'Content-Type': 'application/json',
                    },
                    params: { conversation_id: prevConversationId }
                }
            )
            const { data } = msgList
            if (data.data.length === 0) {
                return
            }

            const response = await axios.post('https://api.coze.cn/v1/conversation/create', {}, {
                headers: {
                    Authorization: `Bearer ${getToken()}`,
                    'Content-Type': 'application/json',
                },
            })
            const { data: createData } = response
            if (createData.code === 0) {
                dispatch(addConversationContent({ conversation_id: createData.data.id, value: '' }))
                dispatch(setCurrentConversationId(createData.data.id))
            }
        } catch (err) {
            console.log(err);
        }

    }

    // 打开配置弹窗
    const handleOpenConfig = () => {
        setConfigModalVisible(true);
    };

    // 关闭配置弹窗
    const handleCloseConfig = () => {
        setConfigModalVisible(false);
    };

    return (
        <Flex gap="middle" wrap>
            <Layout className="layout">
                <Sider
                    className="sider"
                    trigger={null}
                    collapsed={collapsed}
                    breakpoint="md"
                    collapsedWidth={isMobile ? 0 : 80}
                    onBreakpoint={(broken) => {
                        setIsMobile(broken);
                        if (broken) setCollapsed(true);
                    }}
                    style={{
                        background: '#121212',
                        position: isMobile ? 'fixed' : 'relative',
                        height: isMobile ? '100vh' : '100vh',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        zIndex: isMobile && !collapsed ? 1000 : 'auto',
                    }}
                >
                    {/* 移动端遮罩层 */}
                    {isMobile && !collapsed && (
                        <div
                            style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: 'rgba(0,0,0,0.5)',
                                zIndex: -1,
                            }}
                            onClick={() => setCollapsed(true)}
                        />
                    )}
                    <div className="sider-top">
                        <Button
                            type="text"
                            className="sider-btn"
                            icon={<SearchOutlined style={{ color: '#B0B0B0', fontSize: '2rem' }} />}
                            style={{
                                width: '4.8rem',
                                height: '4.8rem',
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
                            icon={<FormOutlined style={{ color: '#B0B0B0', fontSize: '2rem' }} />}
                            style={{
                                width: '4.8rem',
                                height: '4.8rem',
                                display: collapsed ? "none" : "block"
                            }}

                            onClick={handleCreateClick}
                        ></Button>

                    </div>
                    <div style={{
                        flex: 1,
                        minHeight: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        maxHeight: 'calc(100vh - 12.8rem)'
                    }}>
                        {!collapsed && searchVisible && (
                            <div style={{ padding: '0 0.8rem', marginBottom: '0.8rem' }}>
                                <Input
                                    placeholder="请输入内容..."
                                    value={searchText}
                                    onChange={e => setSearchText(e.target.value)}
                                    style={{
                                        background: '#888',
                                        border: '1px solid #333',
                                        color: '#fff',
                                        borderRadius: '0.6rem',
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
                    </div>
                    <div className="sider-bottom">
                        <Button
                            icon={<GithubOutlined style={{ fontSize: '3rem' }} />}
                            onClick={() => window.open('https://github.com/codeshihaoran/chatBox', '_blank')}
                        ></Button>
                    </div>
                </Sider>

                <Layout style={{
                    background: '#1B1B1B',
                    color: '#ffffff',
                    marginLeft: isMobile && !collapsed ? '200px' : 0,
                    transition: 'margin-left 0.2s',
                }}>
                    <Header className="header" style={{ background: '#1B1B1B' }}>
                        <Navbar
                            sendStatusToHome={handleChangeClick}
                            status={collapsed}
                            isLoggedIn={isLoggedIn}
                            onOpenConfig={handleOpenConfig}
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

            {/* 用户配置弹窗 */}
            <UserConfigModal
                visible={configModalVisible}
                onClose={handleCloseConfig}
            />
        </Flex>
    )
}
export default Home
