import React from "react";


interface ChildComponentProps {
    msgBody: {
        msg: string,
        response: string
    }
}
const Main: React.FC<ChildComponentProps> = ({ msgBody }) => {

    return (
        <div className="chat-main">
            <div className="main">
                {msgBody.msg && <div className="user">
                    {msgBody.msg}
                </div>}
                {msgBody.response && <div className="ai">
                    {msgBody.response}
                </div>}

            </div>
        </div>
    )
}
export default Main