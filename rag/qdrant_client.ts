import { QdrantClient } from "@qdrant/js-client-rest";

export const collectionName = "router_manual"

export const qdrant = new QdrantClient({
    url: process.env.QDRANT_URL!,
    apiKey: process.env.QDRANT_API_KEY!,
});
