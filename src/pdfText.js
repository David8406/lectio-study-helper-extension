import * as pdfjsLib from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

export function loadPdf(url) {
    return pdfjsLib.getDocument({ url }).promise;
}

export async function getPdfText(url) {
    const pdf = await loadPdf(url);
    let text = "";
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        const page = await pdf.getPage(pageNumber);
        const content = await page.getTextContent();
        text += content.items.map((item) => item.str).join(" ") + "\n";
    }
    return text;
}