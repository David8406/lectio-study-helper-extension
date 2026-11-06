console.log("Lectio content script loaded");

let menu = null;

function getPageUrl() {
    if (location.protocol === "chrome-extension:") {
        return new URLSearchParams(location.search).get("file");
    }
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

function addMenuStyles() {
    const style = document.createElement("style");
    style.textContent = `
        .lectio-menu {
            position: absolute;
            z-index: 2147483647;
            max-width: 320px;
            padding: 8px;
            background: white;
            color: #1f2937;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            font: 14px/1.5 system-ui, sans-serif;
            text-align: left;
        }
        .lectio-menu button {
            margin: 0 6px 0 0;
            padding: 6px 12px;
            border: none;
            border-radius: 6px;
            background: #4f46e5;
            color: white;
            font: inherit;
            text-transform: none;
            cursor: pointer;
        }
        .lectio-menu button:disabled {
            background: #d1d5db;
            cursor: not-allowed;
        }
        .lectio-menu .lectio-remove {
            background: #e5e7eb;
            color: #6b7280;
        }
        .lectio-menu p {
            margin: 8px 0 0;
            font: inherit;
            color: inherit;
        }
    `;
    document.head.append(style);
}

function closeMenu() {
    if (menu) menu.remove();
    menu = null;
}

function openMenu(mark) {
    closeMenu();
    const id = mark.dataset.id;

    const box = document.createElement("div");
    box.className = "lectio-menu";

    const explainButton = document.createElement("button");
    explainButton.textContent = "Explain";

    const removeButton = document.createElement("button");
    removeButton.className = "lectio-remove";
    removeButton.textContent = "Remove";

    explainButton.addEventListener("click", async () => {
        explainButton.disabled = true;
        explainButton.textContent = "Explaining...";
        const answer = document.createElement("p");
        try {
            const { list } = await loadHighlights();
            const text = list.find((highlight) => highlight.id === id).text;
            const language = document.documentElement.lang || navigator.language;
            const response = await chrome.runtime.sendMessage({ type: "explain", text, language });
            answer.textContent = response.explanation || response.error;
        } catch (error) {
            console.error(error);
            answer.textContent = "Something went wrong, reload the page and try again";
        }
        explainButton.remove();
        box.append(answer);
    });

    removeButton.addEventListener("click", async () => {
        closeMenu();
        await removeHighlight(id);
    });

    box.append(explainButton, removeButton);
    const rect = mark.getBoundingClientRect();
    box.style.top = `${rect.bottom + window.scrollY + 6}px`;
    box.style.left = `${Math.min(rect.left, window.innerWidth - 340) + window.scrollX}px`;
    document.body.append(box);
    menu = box;
}

document.addEventListener("mouseup", async () => {

    const data = await chrome.storage.local.get("highlightEnabled");
    if (data.highlightEnabled === false) return;

    const selection = window.getSelection();
    const selectionText = selection.toString().trim();
    if (selectionText === "") return;
    if (selection.anchorNode.parentElement.closest(".lectio-menu")) return;

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
    if (event.target.closest(".lectio-menu")) return;
    closeMenu();

    const mark = event.target.closest(".lectio-highlight");
    if (!mark || event.target.closest("a")) return;
    if (window.getSelection().toString().trim() !== "") return;

    const data = await chrome.storage.local.get("highlightEnabled");
    if (data.highlightEnabled === false) return;

    openMenu(mark);
});

addMenuStyles();
restoreHighlights();