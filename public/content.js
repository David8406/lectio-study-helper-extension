console.log("Lectio content script loaded");

//TODO Make it work for the specific word selected before, not only for the first word found
function highlightText(text) {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);

    while (walker.nextNode()) {
        const node = walker.currentNode;
        const index = node.textContent.indexOf(text);

        if (index !== -1) {
            const range = document.createRange();
            range.setStart(node, index);
            range.setEnd(node, index + text.length);

            const mark = document.createElement("mark");
            mark.className = "lectio-highlight";
            range.surroundContents(mark);
            return;
        }
    }
}

async function restoreHighlights(){
    const stored = await chrome.storage.local.get("highlights");
    const highlights = stored.highlights || {};
    const highlightList = highlights[location.href] || [];
    for (const text of highlightList) {
        highlightText(text);
    }
}

document.addEventListener("mouseup", async () => {

    const data = await chrome.storage.local.get("highlightEnabled");
    if (data.highlightEnabled === false) return;

    const selection = window.getSelection();
    const selectionText = selection.toString().trim();
    if (selectionText === "") return;

    const existing = selection.anchorNode.parentElement.closest(".lectio-highlight");
    if (existing) {
        const removedText = existing.textContent;

        existing.replaceWith(...existing.childNodes);
        selection.removeAllRanges();

        const stored = await chrome.storage.local.get("highlights");
        const highlights = stored.highlights || {};
        const url = location.href;

        if (highlights[url]) {
            highlights[url] = highlights[url].filter((text) => text !== removedText);
            await chrome.storage.local.set({ highlights });
        }
        return;
    }

    const range = selection.getRangeAt(0);
    const mark = document.createElement("mark");
    mark.className = "lectio-highlight";

    try {
        range.surroundContents(mark);
        const stored = await chrome.storage.local.get("highlights");
        const highlights = stored.highlights || {};
        const url = location.href;

        if (!highlights[url]) highlights[url] = [];
        highlights[url].push(selectionText);

        await chrome.storage.local.set({highlights});

    } catch (err) {
        console.log("Lectio: can't highlight across different elements yet");
    }

    selection.removeAllRanges();
});

restoreHighlights();