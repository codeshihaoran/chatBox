import React from "react";

import { Flex, Layout } from "antd";
const { Header, Sider, Content, Footer } = Layout

import Navbar from "@/components/navbar";
import Main from "@/components/main";
import Bottom from "@/components/bottom";


const Home: React.FC = () => {
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