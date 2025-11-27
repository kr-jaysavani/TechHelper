// lib/ai/tools/web-search.ts
import { tool } from "ai";
import { z } from "zod";

export const webSearch = tool({
  description: "Search the web for current information. Use this when you need recent events, news, current data, or fact-checking.",
  inputSchema: z.object({
    query: z.string().describe("The search query (1-6 words for best results)"),
  }),
  execute: async (input) => {
    try {
      const response = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: {
          "X-API-KEY": process.env.SERPER_API_KEY || "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          q: input.query,
          num: 5, // Number of results
        }),
      });

      if (!response.ok) {
        return {
          error: `Search failed with status: ${response.status}`,
          query: input.query,
        };
      }

      const data = await response.json();
      console.log("🚀 ~ data:", data)
      
      const results = data.organic?.slice(0, 5).map((result: any) => ({
        title: result.title,
        snippet: result.snippet,
        link: result.link,
      })) || [];

      if (results.length === 0) {
        return {
          error: "No results found",
          query: input.query,
        };
      }

      return {
        query: input.query,
        results,
        searchTime: new Date().toISOString(),
      };
    } catch (error) {
      console.error("Web search error:", error);
      return {
        error: error instanceof Error ? error.message : "🚀 Failed to perform web search",
        query: input.query,
      };
    }
  },
});