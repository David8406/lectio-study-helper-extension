import { useState, useEffect } from "react";

function countWords() {
    const pageText = document.body.innerText.trim();
    if (pageText === "") return 0;
    const words = pageText.split(/\s+/);
    return words.length;
}

function App() {
    const [count, setCount] = useState(null);
    const [error, setError] = useState("");

    const [highlightEnable, setHighlightEnable] = useState(true);

    useEffect(() => {
        chrome.storage.local.get("highlightEnabled").then((data) => {
            if (data.highlightEnabled === false) setHighlightEnable(false);
        });
    }, []);

    function toggleHighlight(){
        const newValue = !highlightEnable;
        setHighlightEnable(newValue);
        chrome.storage.local.set({ highlightEnabled: newValue });
    }

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
            <button onClick={toggleHighlight}>Toggle highlight {highlightEnable ? "ON" : "OFF" }</button>
        </div>
    );
}

export default App;