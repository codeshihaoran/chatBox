import React, { useState } from "react";

import '@/app.less'


const App = () => {
    const [count, setCount] = useState(1)
    function handleClick() {
        setCount(c => c + 1)
    }
    return (
        <div className="box">
            <button onClick={handleClick}>
                {count}
            </button>
        </div>
    )
}

export default App