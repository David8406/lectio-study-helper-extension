export const WORDS_PER_MINUTE = 120;

export function countWords(text) {
    const trimmed = text.trim();
    if (trimmed === "") return 0;
    return trimmed.split(/\s+/).length;
}

export function readingMinutes(wordCount) {
    return Math.ceil(wordCount / WORDS_PER_MINUTE);
}
