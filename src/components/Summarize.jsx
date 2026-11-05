import { useState, useEffect } from "react";
import { getPageText } from "../pageText.js";

const MAX_CHARS = 20000;

function Summarize({ onUnauthorized }) {
    const [summary, setSummary] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        async function loadSavedSummary() {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const { lastSummary } = await chrome.storage.local.get("lastSummary");
            if (lastSummary && lastSummary.url === tab.url) setSummary(lastSummary.text);
        }
        loadSavedSummary();
    }, []);

    async function handleSummarize() {
        setSummary("");
        setMessage("");
        setLoading(true);
        try {
            const { tab, text, problem } = await getPageText();
            if (problem) {
                setMessage(problem);
                setLoading(false);
                return;
            }
            const textToSend = text.slice(0, MAX_CHARS);

            const { token } = await chrome.storage.local.get("token");

            const response = await fetch("http://localhost:3000/summary", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({ text: textToSend }),
            });
            const data = await response.json();

            if (response.ok) {
                setSummary(data.summary);
                await chrome.storage.local.set({ lastSummary: { url: tab.url, text: data.summary } });
                if (text.length > MAX_CHARS) setMessage("This page is long, so the summary covers its first part.");
            }
            else if (response.status === 401) onUnauthorized();
            else setMessage(data.error);
        } catch (error) {
            console.error(error);
            setMessage("Can't summarize this page, or the server is offline.");
        }
        setLoading(false);
    }

    const points = summary
        .split("\n")
        .map((line) => line.replaceAll("**", "").replace(/^[-*•]\s*/, "").trim())
        .filter((line) => line !== "");

    return (
        <div>
            <button onClick={handleSummarize} disabled={loading}>
                {loading ? "Summarizing..." : "Summarize page"}
            </button>
            {message && <p>{message}</p>}
            {points.length > 0 && (
                <ul className="summary">
                    {points.map((point, index) => <li key={index}>{point}</li>)}
                </ul>
            )}
        </div>
    );
}

export default Summarize;
