import React, { useState } from "react";

import { Flex, Layout } from "antd";
const { Header, Sider, Content, Footer } = Layout

import Navbar from "@/components/navbar";
import Main from "@/components/main";
import Bottom from "@/components/bottom";


const Home: React.FC = () => {
    const [messageBody, setMessageBody] = useState({
        msg: "",
        response: "",
    })
    const handleReceiveData = (data: { msg: string; response: string }) => {
        setMessageBody(data)
    }
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
                        <Main msgBody={messageBody} />
                    </Content>
                    <Footer className="footer">
                        <Bottom sendDataToHome={handleReceiveData} />
                    </Footer>
                </Layout>
            </Layout>
        </Flex>
    )
}
export default Home