console.log("Lectio content script loaded");

document.addEventListener("mouseup", async () => {

    const data = await chrome.storage.local.get("highlightEnabled");
    if (data.highlightEnabled === false) return;

    const selection = window.getSelection();
    const selectionText = selection.toString().trim();
    if (selectionText === "") return;

    const existing = selection.anchorNode.parentElement.closest(".lectio-highlight");
    if (existing) {
        existing.replaceWith(...existing.childNodes);
        selection.removeAllRanges();
        return;
    }

    const range = selection.getRangeAt(0);
    const mark = document.createElement("mark");
    mark.className = "lectio-highlight";

    try {
        range.surroundContents(mark);
    } catch (err) {
        console.log("Lectio: can't highlight across different elements yet");
    }

    selection.removeAllRanges();
});
