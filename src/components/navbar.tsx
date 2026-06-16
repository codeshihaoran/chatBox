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

        </div>
    )
}
export default Navbar