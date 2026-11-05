import { useState, useEffect } from "react";
import { isViewer } from "../pageText.js";

function OpenInLectio() {
    const [pdfUrl, setPdfUrl] = useState("");

    useEffect(() => {
        async function checkTab() {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab.url.toLowerCase().endsWith(".pdf") && !isViewer(tab.url)) setPdfUrl(tab.url);
        }
        checkTab();
    }, []);

    function handleOpen() {
        chrome.tabs.create({ url: chrome.runtime.getURL("viewer.html?file=" + encodeURIComponent(pdfUrl)) });
    }

    if (!pdfUrl) return null;

    return (
        <div className="row">
            <span>Highlight this PDF</span>
            <button onClick={handleOpen}>Open in Lectio</button>
        </div>
    );
}

export default OpenInLectio;
