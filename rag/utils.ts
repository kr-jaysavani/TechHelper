import fs from "fs"
import { embed } from "ai";
import { qdrant } from "./qdrant_client";
import { getDocument, PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
import { jina } from "jina-ai-provider"
import { TextContent } from "pdfjs-dist/types/src/display/api";

export async function extractTextFromPDF(file: File): Promise<string> {
    // Read the PDF file into a Buffer, then convert to Uint8Array
    const arrayBuffer = await file.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);

    let pdfDocument: PDFDocumentProxy | null = null;
    let fullText = '';

    try {
        const loadingTask = getDocument({ data: data });
        pdfDocument = await loadingTask.promise;

        console.log(`Successfully loaded PDF with ${pdfDocument.numPages} pages.`);

        for (let i = 1; i <= pdfDocument.numPages; i++) {
            const page: PDFPageProxy = await pdfDocument.getPage(i);

            const textContent: TextContent = await page.getTextContent();

            const pageText: string = textContent.items
                .map(item => ('str' in item) ? item.str : '')
                .join(' ');

            fullText += `\n${pageText}\n`;
        }
        console.log("🚀 ~ extractTextFromPDF ~ fullText:", fullText)

        return fullText;

    } catch (error) {
        console.error("Failed to extract text from PDF:", error);
        // Re-throw the error for external handling
        throw error;
    }
}

export function chunkTextWithOverlap(text: string, maxLines = 5, overlapLines = 2): string[] {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const chunks: string[] = [];

    let start = 0;
    while (start < lines.length) {
        const end = Math.min(start + maxLines, lines.length);
        const piece = lines.slice(start, end).join(" ").trim();

        if (piece.length > 0) chunks.push(piece);

        if (end === lines.length) break;

        start = Math.max(0, end - overlapLines);
    }
    console.log(chunks)
    return chunks;
}

export async function ingestChunk(chunk: string, idx: number, collection_name: string) {
    const e = await embed({
        model: jina.textEmbeddingModel("jina-embeddings-v2-base-en"),
        value: chunk
    });

    await qdrant.upsert(collection_name, {
        points: [
            {
                id: idx,
                vector: e.embedding,
                payload: { text: chunk }
            }
        ]
    });
}