import { useState } from "react";
import RegisterForm from "./RegisterForm.jsx";

function LoginForm({ onLoggedIn }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loginMessage, setLoginMessage] = useState("");

    const [showRegister, setShowRegister] = useState(false);
    const [needsVerify, setNeedsVerify] = useState(false);

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
                setNeedsVerify(false);
                await chrome.storage.local.set({token: data.token, email});
                setPassword("");
                onLoggedIn(email);
            }
            else {
                setLoginMessage(data.error);
                setNeedsVerify(response.status === 403);
            }
        } catch (error) {
            setLoginMessage("Server is offline");
        }
    }

    async function handleResend() {
        try {
            const response = await fetch("http://localhost:3000/resend-verification", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await response.json();
            setLoginMessage(data.message || data.error);
        } catch (error) {
            setLoginMessage("Server is offline");
        }
    }

    async function handleForgotPassword() {
        if (!email) {
            setLoginMessage("Type your email first, then click Forgot password.");
            return;
        }
        try {
            const response = await fetch("http://localhost:3000/forgot-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await response.json();
            setLoginMessage(data.message || data.error);
        } catch (error) {
            setLoginMessage("Server is offline");
        }
    }

    if (showRegister) {
        return (
            <RegisterForm
                onRegistered={() => {
                    setShowRegister(false);
                    setLoginMessage("Account created! Check your email (also the Spam folder) to verify it.");
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
            <button onClick={handleForgotPassword}>Forgot password?</button>
            {loginMessage && <p>{loginMessage}</p>}
            {needsVerify && <button onClick={handleResend}>Resend email</button>}
        </div>
    );
}

export default LoginForm;