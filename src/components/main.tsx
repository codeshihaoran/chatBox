import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { selectContent } from "@/store/modules/content";
import { useStartConversation } from "@/service/index";
import { setLoading } from "@/store/modules/loading";

const Main: React.FC = () => {
    const content = useSelector(selectContent)
    const dispatch = useDispatch()
    const { msg, response, follow } = content
    const startConversation = useStartConversation()
    const handleClick = async (item: string) => {
        dispatch(setLoading(true))
        try {
            await startConversation(item)
        } catch (err) {
            console.log(err);
        } finally {
            dispatch(setLoading(false))
        }
    }
    return (
        <div className="chat-main">
            <div className="main">
                {msg &&
                    <div className="user">
                        {msg}
                    </div>
                }
                {response &&
                    <div className="ai">
                        {response}
                    </div>
                }
                {follow && follow.map((item, index) => (
                    <div className="follow_up" key={index} onClick={() => handleClick(item)}>
                        <p>{item}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}
export default Main