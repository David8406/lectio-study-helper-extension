import { describe, test, expect } from "vitest";
import { getPdfUrl, isViewer } from "./pageText.js";

globalThis.chrome = { runtime: { getURL: (path) => "chrome-extension://abc/" + path } };

const pdf = "file:///Users/davidmarian/Downloads/Curs%205.pdf";
const viewer = "chrome-extension://abc/viewer.html?file=" + encodeURIComponent(pdf);

describe("getPdfUrl", () => {
    test("a normal page is not a PDF", () => {
        expect(getPdfUrl("https://en.wikipedia.org/wiki/Dog")).toBe(null);
    });

    test("a PDF opened in Chrome gives its own address", () => {
        expect(getPdfUrl(pdf)).toBe(pdf);
    });

    test("works with .PDF in capital letters", () => {
        expect(getPdfUrl("https://example.com/NOTES.PDF")).toBe("https://example.com/NOTES.PDF");
    });

    test("inside Lectio's viewer it gives the real PDF address", () => {
        expect(getPdfUrl(viewer)).toBe(pdf);
    });
});

describe("isViewer", () => {
    test("knows Lectio's viewer", () => {
        expect(isViewer(viewer)).toBe(true);
    });

    test("a PDF in Chrome's own viewer is not Lectio's viewer", () => {
        expect(isViewer(pdf)).toBe(false);
    });
});
