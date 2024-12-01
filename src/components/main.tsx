import React from "react";
import { useSelector } from "react-redux";
import { selectContent } from "@/store/modules/content";
const Main: React.FC = () => {
    const content = useSelector(selectContent)
    const { msg, response } = content
    return (
        <div className="chat-main">
            <div className="main">
                {msg && <div className="user">
                    {msg}
                </div>}
                {response && <div className="ai">
                    {response}
                </div>}

            </div>
        </div>
    )
}
export default Main