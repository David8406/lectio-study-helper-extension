import { useState, useEffect } from "react";
import Header from "./components/Header.jsx";
import WordCounter from "./components/WordCounter.jsx";
import HighlightToggle from "./components/HighlightToggle.jsx";
import OpenInLectio from "./components/OpenInLectio.jsx";
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
                    <button className="secondary" onClick={() => setScreen("main")}>← Back</button>
                    <LoginForm onLoggedIn={handleLoggedIn} />
                </div>
            ) : (
                <div>
                    <section className="card">
                        <h2>Page tools</h2>
                        <WordCounter />
                        <HighlightToggle />
                        <OpenInLectio />
                    </section>
                    <section className="card">
                        <h2>AI summary</h2>
                        {loggedInEmail ? (
                            <Summarize onUnauthorized={handleLogout} />
                        ) : (
                            <button className="locked" onClick={() => setScreen("login")}>
                                Log in to summarize
                            </button>
                        )}
                    </section>
                </div>
            )}
        </div>
    );
}

export default App;