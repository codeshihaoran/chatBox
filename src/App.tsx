import React from "react";
import '@/app.less'
import { Flex, Layout } from "antd";
const { Header, Footer, Sider, Content } = Layout

import Navbar from "./components/navbar";
import Main from "./components/main";
import Foot from "./components/footer";

const App: React.FC = () => {
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
                        <Foot />
                    </Footer>
                </Layout>
            </Layout>
        </Flex>
    )
}

export default App