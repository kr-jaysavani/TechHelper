import fs from "fs"
import { embed } from "ai";
import { mistral } from "@ai-sdk/mistral";
import { qdrant, collectionName } from "./qdrant_client";
import { getDocument, PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist";
import { TextContent } from "pdfjs-dist/types/src/display/api";
import { jina } from "jina-ai-provider"

export async function embed_pdf(path: string) {
    const collections = await qdrant.getCollections();
    const exists = collections.collections.some(
        (col) => col.name === collectionName
    );

    if (!exists) {
        console.log("Creating Qdrant collection:", collectionName);

        await qdrant.createCollection(collectionName, {
            vectors: {
                size: 768,
                distance: "Cosine"
            },
        });
    } else {
        console.log("Using existing collection:", collectionName);
    }

    const pdfText = await extractTextFromPDF(path);
    const chunks = chunkTextWithOverlap(pdfText);
    console.log(`Chunked into ${chunks.length} chunks.`);

    for( let i=0 ; i < chunks.length ; i++ ) {
        await ingestChunk(chunks[i], i);
        console.warn(`Chunk ${i} ingested...`)
    }

    console.log("PDF embedded + stored in Qdrant");
}

async function ingestChunk(chunk: string, idx: number) {
    const e = await embed({
        model: jina.textEmbeddingModel("jina-embeddings-v2-base-en"),
        value: chunk
    });

    await qdrant.upsert(collectionName, {
        points: [
            {
                id: idx,
                vector: e.embedding,
                payload: { text: chunk }
            }
        ]
    });
}

async function extractTextFromPDF(pdfPath: string): Promise<string> {
    if (!fs.existsSync(pdfPath)) {
        throw new Error(`Error: PDF file not found at ${pdfPath}`);
    }

    // Read the PDF file into a Buffer, then convert to Uint8Array
    const data = new Uint8Array(fs.readFileSync(pdfPath));

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