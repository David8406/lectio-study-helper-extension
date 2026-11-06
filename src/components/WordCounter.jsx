import { useState, useEffect } from "react";
import { getPageText } from "../pageText.js";
import { countWords, readingMinutes } from "../words.js";

function WordCounter() {
    const [count, setCount] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadCount() {
            const { text, problem } = await getPageText();
            if (problem) setError(problem);
            else setCount(countWords(text));
        }
        loadCount();
    }, []);

    let text = "Counting...";
    if (error) text = error;
    else if (count !== null) text = `${count.toLocaleString()} words · ${readingMinutes(count)} min read`;

    return (
        <div className="row">
            <span>This page</span>
            <span className="value">{text}</span>
        </div>
    );
}

export default WordCounter;
