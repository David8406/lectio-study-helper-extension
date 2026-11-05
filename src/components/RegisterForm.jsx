import { useState } from "react";

function RegisterForm({ onRegistered, onCancel }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirm, setPasswordConfirm] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleRegister(){
        if (password !== passwordConfirm) {
            setMessage("Passwords do not match");
            return;
        }

        setLoading(true);
        try {
            const response = await fetch("http://localhost:3000/register", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({ email, password, passwordConfirm }),
            });
            const data = await response.json();
            if (response.ok) onRegistered();
            else setMessage(data.error);
        } catch (error) {
            setMessage("Server is offline");
        }
        setLoading(false);
    }

    return (
        <div>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
            <input type="password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} placeholder="Confirm password" />
            <button onClick={handleRegister} disabled={loading}>
                {loading ? "Creating account..." : "Create account"}
            </button>
            <button className="secondary" onClick={onCancel}>Back to login</button>
            {message && <p>{message}</p>}
        </div>
    );
}

export default RegisterForm;
