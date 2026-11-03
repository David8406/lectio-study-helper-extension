import { useState } from "react";

function ServerStatus() {
    const [serverMessage, setServerMessage] = useState("");

    async function checkServer(){
        try {
            const response = await fetch("http://localhost:3000/");
            const data = await response.json();
            setServerMessage(data.message);
        } catch (err) {
            setServerMessage("Server is offline");
        }
    }

    return (
        <div>
            <button onClick={checkServer}>Check server</button>
            {serverMessage && <p>{serverMessage}</p>}
        </div>
    );
}

export default ServerStatus;
