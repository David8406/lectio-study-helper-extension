import { useState } from "react";

function countWords() {
    const pageText = document.body.innerText.trim();
    if (pageText === "") return 0;
    const words = pageText.split(/\s+/);
    return words.length;
}

function App() {
    const [count, setCount] = useState(null);
    const [error, setError] = useState("");

    async function handleClick() {
        setError("");
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: countWords,
            });
            setCount(results[0].result);
        } catch (err) {
            setCount(null);
            setError("Can't count words on this page.");
        }
    }

    return (
        <div>
            <h1>Word counter</h1>
            <button onClick={handleClick}>Count words</button>
            {count !== null && <p>{count} words</p>}
            {error && <p>{error}</p>}
        </div>
    );
}

export default App;