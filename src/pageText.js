import { getPdfText } from "./pdfText.js";

function readPageText() {
    return (document.querySelector("main") || document.body).innerText;
}

export async function getPageText() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    try {
        if (tab.url.toLowerCase().endsWith(".pdf")) {
            const text = await getPdfText(tab.url);
            if (text.trim() === "") return { tab, problem: "This PDF has no text (it's probably scanned)" };
            return { tab, text };
        }
        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: readPageText,
        });
        return { tab, text: results[0].result };
    } catch (error) {
        console.error(error);
        const fileAccess = await chrome.extension.isAllowedFileSchemeAccess();
        if (!fileAccess) {
            return { tab, problem: "Can't read this page. If it's a downloaded PDF, turn on \"Allow access to file URLs\" for Lectio." };
        }
        return { tab, problem: "Not available on this page" };
    }
}
