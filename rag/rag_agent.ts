import { embed, generateText, ModelMessage } from "ai";
import { qdrant } from "./qdrant_client";
import { openai } from "@ai-sdk/openai";
import { jina } from "jina-ai-provider";
import dotenv from "dotenv"
import { google } from "@ai-sdk/google";
import { chunkTextWithOverlap, extractTextFromPDF, ingestChunk } from "./utils";

dotenv.config()

export interface Response {
    success: Boolean,
    message: string
}

export async function rag_retrieve(messages: ModelMessage[]) {
    // 1. Extract latest user query
    try {
        const userMsg = [...messages].reverse()
            .find(m => m.role === "user");

        let query = "";

        if (typeof userMsg?.content === "string") {
            query = userMsg.content;
        } else if (Array.isArray(userMsg?.content)) {
            query = userMsg.content
                .filter(c => c.type === "text")
                .map(c => c.text)
                .join("\n");
        }

        query = query.trim();
        console.log("🚀 ~ rag_retrieve ~ query:", query)

        const collections = (await qdrant.getCollections()).collections;

        const result = await generateText({
            model: google("gemini-2.5-flash"),
            prompt: `
                You are provided with the list of collections and a user query.
                Your task is to analyze the user query and then classify it into the appropriate collection and then return only that collection.
                Collection names are precise, So It might possible that user query niche is not related to any of the collections, in that case just return empty string.
    
                For e.g, If the query is related to router and if there is some collection that is related to router ( for e.g router_manual or ....) return that collection name.
                Collections: ${collections.map((c) => c.name)}
                User query: ${query}
            `
        })

        let relevant_collection = "";
        if (result.content && result.content[0]) {
            const first = result.content[0] as any;
            if (typeof first === "string") {
                relevant_collection = first;
            } else if (first.text) {
                relevant_collection = String(first.text);
            } else if (first.content && typeof first.content === "string") {
                relevant_collection = first.content;
            }
        }

        console.log("🚀 ~ rag_retrieve ~ relevant_collection:", relevant_collection)

        if (!relevant_collection || relevant_collection.length === 0 || !collections.some((c) => c.name === relevant_collection)) return "";

        // 2. Embed
        const { embedding } = await embed({
            model: jina.textEmbeddingModel("jina-embeddings-v2-base-en"),
            value: query,
        });

        // 3. Qdrant search with threshold
        const hits = await qdrant.search(relevant_collection, {
            vector: embedding,
            limit: 3,
            score_threshold: 0.75,
            with_payload: true,
        });

      
        // 4. Join context text
        const context = hits
            .map(h => h.payload?.text ?? "")
            .filter(Boolean)
            .join("\n");

        return context;
    } catch (error) {
        console.error(`Something wen wrong while retrieving context...\n ${error}`);
        return "";
    }
}


export async function delete_collection(collection_name: string): Promise<Response> {

    try {
        if (!(await qdrant.collectionExists(collection_name)))
            return {
                success: false,
                message: "No such collection name exists..."
            };

        await qdrant.deleteCollection(collection_name);
        return {
            success: true,
            message: `${collection_name} deleted successfully...`
        }
    } catch (error) {
        console.error("Error: ", error);
        return {
            success: false,
            message: "Something went wrong while deleting the collection..."
        };
    }
}

export async function embed_pdf(file: File, collection_name: string): Promise<Response> {
    try {
        const collections = await qdrant.getCollections();
        console.log("🚀 ~ embed_pdf ~ collections:", collections)
        const exists = collections.collections.some(
            (col) => col.name === collection_name
        );

        if (!exists) {
            console.log("Creating Qdrant collection:", collection_name);

            await qdrant.createCollection(collection_name, {
                vectors: {
                    size: 768,
                    distance: "Cosine"
                },
            });
        } else {
            console.log("Using existing collection:", collection_name);
        }

        const pdfText = await extractTextFromPDF(file);
        const chunks = chunkTextWithOverlap(pdfText);
        console.log(`Chunked into ${chunks.length} chunks.`);

        for (let i = 0; i < chunks.length; i++) {
            await ingestChunk(chunks[i], i, collection_name);
            console.warn(`Chunk ${i} ingested...`)
        }
        console.warn("PDF embedded and stored in qdrantDB successfully...");
        return {
            success: true,
            message: `Embedding success...`
        };
    } catch (error) {
        console.error("Error: ", error);
        return {
            success: false,
            message: `Embedding failed...${error}`
        };
    }
}

export async function get_collections() {
    try {
        return (await qdrant.getCollections()).collections;
    } catch (error) {
        console.error("Error: ", error)
    }
}

export async function main(query: string) {

    // const context = await rag_retrieve(query)

    const { text } = await generateText({
        model: openai("gpt-4o-mini"),
        prompt: `You are the Troubleshoot Agent.

            Your purpose:
            Help the user diagnose and fix technical problems across a wide range of domains:
            - Internet/Router/WiFi issues
            - Mobile device problems
            - Computer errors (Windows, macOS, Linux)
            - Hardware malfunctions
            - Software crashes and configuration issues
            - Network connectivity failures
            - Cloud services or account issues
            - Smart home devices
            - Any general tech troubleshooting

            Core Operating Principle:
            1. Always check the retrieved internal context first:
            - user-provided logs
            - device information
            - past conversation context
            - configuration details
            - system history
            - database/vector search results
            - stored knowledge or memory

            2. If the context contains relevant information → use it to give a complete answer.

            3. ONLY if the context is missing, incomplete, or insufficient:
            → call the 'web_search' tool with a specific and minimal query that targets missing information.

            4. Never hallucinate unknown facts. If neither context nor web search provides an answer, reply:
            “I don't know based on the available information.”

            5. Always think like a senior technician:
            - identify likely root causes
            - ask for missing but essential details
            - offer quick diagnostic checks
            - avoid unnecessary steps
            - provide step-by-step instructions tailored to the user's device/OS/environment

            Behavior Rules:
            - Be clear, calm, and helpful — no jargon unless needed.
            - Prioritize safety (e.g., no unsafe hardware instructions).
            - When listing steps, start with the simplest and least intrusive.
            - If the problem could have multiple causes, give structured branches:
            *“If A happens → do X. If B happens → do Y.”*

            Tool Use:
            - Internal context is always first priority.
            - use web_search only when context is not sufficient.

            Decision Framework:
            1. Do I have enough context to solve it → answer directly.
            2. If not, what exact missing piece do I need → search only that.
            3. Combine findings carefully.
            4. Never fabricate or guess beyond confidence.
            5. If still uncertain → say “I'm not sure.”

            Goal:
            Provide accurate, safe, and practical troubleshooting guidance for any general technical issue.
            
            Context: 
            
            question: ${query}`,
        temperature: 0.2,
        tools: {
            // web_search: openai.tools.webSearch({})
        }
    });

    console.log("ANSWER:", text);
    return text;
}