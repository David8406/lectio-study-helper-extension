import { useState, useEffect } from "react";
import RegisterForm from "./RegisterForm.jsx";
import Summarize from "./Summarize.jsx";

function LoginForm() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loginMessage, setLoginMessage] = useState("");

    const [loggedInEmail, setLoggedInEmail] = useState(null);
    const [showRegister, setShowRegister] = useState(false);

    useEffect(() => {
        chrome.storage.local.get(["token", "email"]).then((data) => {
            if (data.token) setLoggedInEmail(data.email);
        });
    }, []);

    async function handleLogin(){
        try {
            const response = await fetch("http://localhost:3000/login", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({email: email, password: password}),
            });
            const data = await response.json();
            if (response.ok){
                setLoginMessage("");
                await chrome.storage.local.set({token: data.token, email});
                setLoggedInEmail(email);
                setPassword("");
            }
            else setLoginMessage(data.error);
        } catch (error) {
            setLoginMessage("Server is offline");
        }
    }

    async function handleLogout(){
        await chrome.storage.local.remove(["token", "email"]);
        setLoggedInEmail(null);
    }

    if (loggedInEmail) {
        return (
            <div>
                <p>Logged in as {loggedInEmail}</p>
                <Summarize onUnauthorized={handleLogout} />
                <button onClick={handleLogout}>Log out</button>
            </div>
        );
    }

    if (showRegister) {
        return (
            <RegisterForm
                onRegistered={() => {
                    setShowRegister(false);
                    setLoginMessage("Account created! Please log in.");
                }}
                onCancel={() => setShowRegister(false)}
            />
        );
    }

    return (
        <div>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
            <button onClick={handleLogin}>Login</button>
            <button onClick={() => setShowRegister(true)}>Create account</button>
            {loginMessage && <p>{loginMessage}</p>}
        </div>
    );
}

export default LoginForm;