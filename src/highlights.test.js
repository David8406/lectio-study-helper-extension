import { describe, test, expect, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const contentScript = readFileSync(new URL("../public/content.js", import.meta.url), "utf8");

const PAGE = `
    <p>The dog is a domesticated descendant of the <a href="/wiki/Wolf">wolf</a>.</p>
    <p>A wolf is wild. The <b>wolf</b> howls.</p>
`;
const DOG = "https://en.wikipedia.org/wiki/Dog";

let storage;

beforeEach(() => {
    storage = {};
});

function fakeChrome() {
    return {
        storage: {
            local: {
                get: async (key) => (key in storage ? { [key]: structuredClone(storage[key]) } : {}),
                set: async (items) => {
                    Object.assign(storage, structuredClone(items));
                },
            },
        },
    };
}

function wait() {
    return new Promise((resolve) => setTimeout(resolve, 10));
}

async function openPage(url = DOG) {
    const dom = new JSDOM(PAGE, { url, runScripts: "outside-only" });
    dom.window.chrome = fakeChrome();
    dom.window.console.log = () => {};
    dom.window.eval(contentScript);
    await wait();
    return dom.window;
}

async function select(window, startNode, startOffset, endNode, endOffset) {
    const range = window.document.createRange();
    range.setStart(startNode, startOffset);
    range.setEnd(endNode, endOffset);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
    window.document.dispatchEvent(new window.MouseEvent("mouseup"));
    await wait();
}

async function selectBoldWolf(window) {
    const boldWolf = window.document.querySelector("b").firstChild;
    await select(window, boldWolf, 0, boldWolf, 4);
}

async function selectAcrossLink(window) {
    const paragraph = window.document.querySelector("p");
    await select(window, paragraph.firstChild, 13, paragraph.querySelector("a").firstChild, 4);
}

function marks(window) {
    return [...window.document.querySelectorAll(".lectio-highlight")].map((mark) => mark.textContent);
}

describe("highlights", () => {
    test("highlighting the 3rd 'wolf' saves occurrence 2", async () => {
        const window = await openPage();
        await selectBoldWolf(window);

        const saved = storage.highlights[DOG];
        expect(saved).toHaveLength(1);
        expect(saved[0].text).toBe("wolf");
        expect(saved[0].occurrence).toBe(2);
    });

    test("after a reload, the 3rd 'wolf' comes back on the 3rd copy", async () => {
        await selectBoldWolf(await openPage());

        const window = await openPage();
        const mark = window.document.querySelector(".lectio-highlight");
        expect(mark.parentElement.tagName).toBe("B");
    });

    test("a highlight across a link comes back after a reload, in 2 pieces", async () => {
        await selectAcrossLink(await openPage());

        const window = await openPage();
        expect(marks(window)).toEqual(["domesticated descendant of the ", "wolf"]);
    });

    test("clicking a highlight removes all its pieces", async () => {
        const window = await openPage();
        await selectAcrossLink(window);

        const firstPiece = window.document.querySelector(".lectio-highlight");
        firstPiece.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
        await wait();

        expect(marks(window)).toEqual([]);
        expect(storage.highlights[DOG]).toEqual([]);
    });

    test("with the highlighter OFF, selecting does nothing", async () => {
        storage.highlightEnabled = false;
        const window = await openPage();
        await selectBoldWolf(window);

        expect(marks(window)).toEqual([]);
        expect(storage.highlights).toBeUndefined();
    });

    test("the part after # is ignored, so Dog and Dog#Behavior share highlights", async () => {
        await selectBoldWolf(await openPage(DOG + "#Behavior"));

        expect(Object.keys(storage.highlights)).toEqual([DOG]);
    });

    test("old highlights saved as plain text still come back", async () => {
        storage.highlights = { [DOG]: ["wolf"] };

        const window = await openPage();
        expect(marks(window)).toEqual(["wolf"]);
    });

    test("in Lectio's PDF viewer, highlights are saved under the PDF's address", async () => {
        const pdf = "file:///Users/davidmarian/Downloads/Curs%205.pdf";
        await selectBoldWolf(await openPage("chrome-extension://abc/viewer.html?file=" + encodeURIComponent(pdf)));

        expect(Object.keys(storage.highlights)).toEqual([pdf]);
    });
});
