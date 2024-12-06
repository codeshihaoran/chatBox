import React, { useEffect } from "react";
import { ChatEventType, RoleType } from "@coze/api";
import { Flex, Layout } from "antd";
const { Header, Sider, Content, Footer } = Layout

import { botId, client } from "../index";
import Navbar from "@/components/navbar";
import Main from "@/components/main";
import Bottom from "@/components/bottom";


const Home: React.FC = () => {
    useEffect(() => {
        const getConversationId = async () => {
            try {
                const stream = await client.chat.stream({
                    bot_id: botId!,
                    additional_messages: [{
                        role: RoleType.User,
                        content: '你好',
                        content_type: 'text',
                    }],
                });
                let hasId = false
                for await (const part of stream) {
                    if (part.event === ChatEventType.CONVERSATION_MESSAGE_COMPLETED && !hasId) {
                        const conversationId = part.data.conversation_id;
                        if (conversationId) {
                            localStorage.setItem("conversation_id", conversationId)
                            hasId = true
                        }
                    }
                }
            } catch (err) {
                console.log(err);
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