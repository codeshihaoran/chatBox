import React from "react";
import { Button, Dropdown, Modal } from "antd";
import type { MenuProps } from "antd";
import {
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    UserOutlined,
    CheckCircleOutlined,
    KeyOutlined,
    DeleteOutlined,
} from '@ant-design/icons'
import { clearUserConfig } from "@/utils/userConfig";


interface NavbarProps {
    sendStatusToHome: (data: boolean) => void,
    status: boolean,
    isLoggedIn: boolean,
    onOpenConfig: () => void,
}

const Navbar: React.FC<NavbarProps> = ({ sendStatusToHome, status, isLoggedIn, onOpenConfig }) => {

    // 清除配置：清除 localStorage 后刷新页面回到初始状态
    const handleClearConfig = () => {
        Modal.confirm({
            title: '清除配置',
            content: '清除配置将同时清除所有聊天记录，重置到初始状态。此操作不可恢复，是否继续？',
            okText: '确认清除',
            cancelText: '取消',
            okButtonProps: { danger: true },
            onOk: () => {
                clearUserConfig();
                localStorage.removeItem('conversationContent');
                localStorage.removeItem('currentConversationId');
                localStorage.removeItem('sentFiles');
                window.location.reload();
            },
        });
    };

    // 根据登录状态动态生成下拉菜单项
    const menuItems: MenuProps['items'] = isLoggedIn
        ? [
            {
                key: 'status',
                label: '已配置 API',
                disabled: true,
            },
            { type: 'divider' },
            {
                key: 'clear',
                label: '清除配置',
                danger: true,
                icon: <DeleteOutlined />,
            },
        ]
        : [
            {
                key: 'config',
                label: '配置 API Key',
                icon: <KeyOutlined />,
            },
        ];

    const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
        if (key === 'config') {
            onOpenConfig();
        } else if (key === 'clear') {
            handleClearConfig();
        }
    };

    return (
        <div className="chat-navbar">
            <div className="chat-navbar-left">
                <Button
                    type="text"
                    className="collapsed-btn"
                    icon={status
                        ? <MenuUnfoldOutlined style={{ color: "#B0B0B0", fontSize: "2rem" }} />
                        : <MenuFoldOutlined style={{ color: "#B0B0B0", fontSize: "2rem" }} />}
                    onClick={() => sendStatusToHome(!status)}
                    style={{
                        width: '4.8rem',
                        height: '4.8rem',
                    }}
                >
                </Button>
            </div>
            <div className="chat-navbar-right">
                <Dropdown
                    menu={{ items: menuItems, onClick: handleMenuClick }}
                    trigger={['click']}
                    placement="bottomRight"
                >
                    <Button
                        type="text"
                        className="user-config-btn"
                        icon={
                            isLoggedIn
                                ? <CheckCircleOutlined style={{ color: "#52c41a", fontSize: "2rem" }} />
                                : <UserOutlined style={{ color: "#B0B0B0", fontSize: "2rem" }} />
                        }
                        style={{
                            width: '4.8rem',
                            height: '4.8rem',
                        }}
                    >
                    </Button>
                </Dropdown>
            </div>
        </div>
    )
}
export default Navbar