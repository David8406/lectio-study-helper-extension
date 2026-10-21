import { useState } from "react";

function App() {
    const [message, setMessage] = useState("");
    return (
        <div>
            <h1>Hello!</h1>
            <button onClick={() => setMessage("It works, with React!!! ⚛️")}>Click me</button>
            <p>{message}</p>
        </div>
    );
}

export default App;