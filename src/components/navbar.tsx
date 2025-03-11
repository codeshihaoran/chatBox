import React from "react";
import { Button } from "antd";
import {
    MenuFoldOutlined,
    MenuUnfoldOutlined
} from '@ant-design/icons'


interface NavbarProps {
    sendStatusToHome: (data: boolean) => void,
    status: boolean
}
const Navbar: React.FC<NavbarProps> = ({ sendStatusToHome, status }) => {
    return (
        <div className="chat-navbar">
            <div className="chat-navbar-btn">
                <Button
                    type="text"
                    icon={status
                        ? <MenuUnfoldOutlined style={{ color: "#B0B0B0", fontSize: "18px" }} />
                        : <MenuFoldOutlined style={{ color: "#B0B0B0", fontSize: "18px" }} />}
                    onClick={() => sendStatusToHome(!status)}
                    style={{
                        fontSize: '16px',
                        width: 64,
                        height: 64
                    }}
                >
                </Button>
            </div>

        </div>
    )
}
export default Navbar