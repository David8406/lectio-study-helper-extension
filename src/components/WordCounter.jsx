import { useState, useEffect } from "react";

function countWords() {
    const pageText = document.body.innerText.trim();
    if (pageText === "") return 0;
    const words = pageText.split(/\s+/);
    return words.length;
}

function WordCounter() {
    const [count, setCount] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadCount() {
            try {
                const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                const results = await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: countWords,
                });
                setCount(results[0].result);
            } catch (err) {
                setError("Not available on this page");
            }
        }
        loadCount();
    }, []);

    let text = "Counting...";
    if (error) text = error;
    else if (count !== null) text = `${count.toLocaleString()} words · ${Math.ceil(count / 200)} min read`;

    return (
        <div className="row">
            <span>This page</span>
            <span className="value">{text}</span>
        </div>
    );
}

export default WordCounter;
