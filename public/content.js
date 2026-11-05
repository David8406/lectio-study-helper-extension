console.log("Lectio content script loaded");

function getPageUrl() {
    return location.href.split("#")[0];
}

function getTextNodes() {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    return nodes;
}

function wrapRange(range, id) {
    const { startContainer, startOffset, endContainer, endOffset } = range;
    const nodes = getTextNodes().filter((node) => range.intersectsNode(node));

    for (const node of nodes) {
        const start = node === startContainer ? startOffset : 0;
        const end = node === endContainer ? endOffset : node.textContent.length;
        if (node.textContent.slice(start, end).trim() === "") continue;

        const piece = document.createRange();
        piece.setStart(node, start);
        piece.setEnd(node, end);

        const mark = document.createElement("mark");
        mark.className = "lectio-highlight";
        mark.dataset.id = id;
        piece.surroundContents(mark);
    }
}

function getOccurrence(range, text) {
    const before = document.createRange();
    before.setStart(document.body, 0);
    before.setEnd(range.startContainer, range.startOffset);
    const start = before.toString().length;

    const pageText = getTextNodes().map((node) => node.textContent).join("");
    let occurrence = 0;
    let index = pageText.indexOf(text);
    while (index !== -1 && index < start) {
        occurrence++;
        index = pageText.indexOf(text, index + 1);
    }
    return occurrence;
}

function findRange(text, occurrence) {
    const nodes = getTextNodes();
    const pageText = nodes.map((node) => node.textContent).join("");

    let index = -1;
    for (let i = 0; i <= occurrence; i++) {
        index = pageText.indexOf(text, index + 1);
        if (index === -1) return null;
    }
    const end = index + text.length;

    const range = document.createRange();
    let position = 0;
    for (const node of nodes) {
        const length = node.textContent.length;
        if (index >= position && index < position + length) range.setStart(node, index - position);
        if (end > position && end <= position + length) {
            range.setEnd(node, end - position);
            return range;
        }
        position += length;
    }
    return null;
}

async function loadHighlights() {
    const stored = await chrome.storage.local.get("highlights");
    const highlights = stored.highlights || {};
    const url = getPageUrl();
    const list = (highlights[url] || []).map((item, index) =>
        typeof item === "string" ? { id: `old-${index}`, text: item, occurrence: 0 } : item
    );
    return { highlights, url, list };
}

async function restoreHighlights() {
    const { list } = await loadHighlights();
    for (const highlight of list) {
        const range = findRange(highlight.text, highlight.occurrence);
        if (range) wrapRange(range, highlight.id);
    }
}

async function removeHighlight(id) {
    document.querySelectorAll(`.lectio-highlight[data-id="${id}"]`).forEach((mark) => mark.replaceWith(...mark.childNodes));
    const { highlights, url, list } = await loadHighlights();
    highlights[url] = list.filter((highlight) => highlight.id !== id);
    await chrome.storage.local.set({ highlights });
}

document.addEventListener("mouseup", async () => {

    const data = await chrome.storage.local.get("highlightEnabled");
    if (data.highlightEnabled === false) return;

    const selection = window.getSelection();
    const selectionText = selection.toString().trim();
    if (selectionText === "") return;

    const existing = selection.anchorNode.parentElement.closest(".lectio-highlight");
    if (existing) {
        selection.removeAllRanges();
        await removeHighlight(existing.dataset.id);
        return;
    }

    const range = selection.getRangeAt(0);
    const text = range.toString();
    const id = Date.now().toString();

    try {
        const occurrence = getOccurrence(range, text);
        wrapRange(range, id);
        const { highlights, url, list } = await loadHighlights();
        list.push({ id, text, occurrence });
        highlights[url] = list;
        await chrome.storage.local.set({ highlights });
    } catch (err) {
        console.error(err);
    }

    selection.removeAllRanges();
});

document.addEventListener("click", async (event) => {
    const mark = event.target.closest(".lectio-highlight");
    if (!mark || event.target.closest("a")) return;
    if (window.getSelection().toString().trim() !== "") return;

    const data = await chrome.storage.local.get("highlightEnabled");
    if (data.highlightEnabled === false) return;

    await removeHighlight(mark.dataset.id);
});

restoreHighlights();