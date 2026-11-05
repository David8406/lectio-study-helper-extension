import { useState, useEffect } from "react";
import Header from "./components/Header.jsx";
import WordCounter from "./components/WordCounter.jsx";
import HighlightToggle from "./components/HighlightToggle.jsx";
import Summarize from "./components/Summarize.jsx";
import LoginForm from "./components/LoginForm.jsx";

function App() {
    const [loggedInEmail, setLoggedInEmail] = useState(null);
    const [screen, setScreen] = useState("main"); // "main" or "login"

    useEffect(() => {
        chrome.storage.local.get(["token", "email"]).then((data) => {
            if (data.token) setLoggedInEmail(data.email);
        });
    }, []);

    async function handleLogout() {
        await chrome.storage.local.remove(["token", "email"]);
        setLoggedInEmail(null);
    }

    function handleLoggedIn(email) {
        setLoggedInEmail(email);
        setScreen("main");
    }

    return (
        <div>
            <Header
                loggedInEmail={loggedInEmail}
                onLoginClick={() => setScreen("login")}
                onLogout={handleLogout}
            />
            {screen === "login" ? (
                <div>
                    <button onClick={() => setScreen("main")}>← Back</button>
                    <LoginForm onLoggedIn={handleLoggedIn} />
                </div>
            ) : (
                <div>
                    <WordCounter />
                    <HighlightToggle />
                    {loggedInEmail && <Summarize onUnauthorized={handleLogout} />}
                </div>
            )}
        </div>
    );
}

export default App;