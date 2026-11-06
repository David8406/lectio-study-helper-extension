import { describe, test, expect } from "vitest";
import { countWords, readingMinutes } from "./words.js";

describe("countWords", () => {
    test("counts the words in a sentence", () => {
        expect(countWords("The dog is a domesticated descendant of the wolf")).toBe(9);
    });

    test("ignores extra spaces and new lines", () => {
        expect(countWords("  files\n\n databases   distributed databases ")).toBe(4);
    });

    test("an empty page has 0 words", () => {
        expect(countWords("")).toBe(0);
        expect(countWords("   \n  ")).toBe(0);
    });
});

describe("readingMinutes", () => {
    test("120 words take 1 minute", () => {
        expect(readingMinutes(120)).toBe(1);
    });

    test("rounds up, so 121 words take 2 minutes", () => {
        expect(readingMinutes(121)).toBe(2);
    });

    test("the 40-page lecture (2,838 words) takes 24 minutes", () => {
        expect(readingMinutes(2838)).toBe(24);
    });
});
