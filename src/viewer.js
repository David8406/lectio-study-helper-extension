import { TextLayer } from "pdfjs-dist";
import { loadPdf } from "./pdfText.js";
import "./viewer.css";

const MAX_SCALE = 1.5;

function showMessage(text) {
    const message = document.createElement("p");
    message.className = "message";
    message.textContent = text;
    document.getElementById("pages").append(message);
}

async function showPdf() {
    const fileUrl = new URLSearchParams(location.search).get("file");
    document.title = decodeURIComponent(fileUrl.split("/").pop());

    let pdf;
    try {
        pdf = await loadPdf(fileUrl);
    } catch (error) {
        console.error(error);
        const fileAccess = await chrome.extension.isAllowedFileSchemeAccess();
        if (fileUrl.startsWith("file:") && !fileAccess) {
            showMessage("Lectio can't open downloaded PDFs yet. Go to chrome://extensions, click \"Details\" on Lectio, turn on \"Allow access to file URLs\", then open the PDF in Lectio again.");
        } else {
            showMessage("Lectio couldn't open this PDF.");
        }
        return;
    }
    const ratio = window.devicePixelRatio;

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        const page = await pdf.getPage(pageNumber);
        const pageWidth = page.getViewport({ scale: 1 }).width;
        const scale = Math.min(MAX_SCALE, (window.innerWidth - 48) / pageWidth);
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement("canvas");
        canvas.width = Math.floor(viewport.width * ratio);
        canvas.height = Math.floor(viewport.height * ratio);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        const textLayerDiv = document.createElement("div");
        textLayerDiv.className = "textLayer";

        const pageDiv = document.createElement("div");
        pageDiv.className = "page";
        pageDiv.style.setProperty("--total-scale-factor", scale);
        pageDiv.append(canvas, textLayerDiv);
        document.getElementById("pages").append(pageDiv);

        await page.render({ canvas, viewport, transform: [ratio, 0, 0, ratio, 0, 0] }).promise;

        const textContent = await page.getTextContent();
        await new TextLayer({ textContentSource: textContent, container: textLayerDiv, viewport }).render();
    }

    const script = document.createElement("script");
    script.src = "/content.js";
    document.body.append(script);
}

showPdf();
