import { createTool } from "@mastra/core/tools";
import type { IMastraLogger } from "@mastra/core/logger";
import { z } from "zod";

const searchWikipedia = async ({
  topic,
  logger,
}: {
  topic: string;
  logger?: IMastraLogger;
}) => {
  logger?.info("🔍 [WikipediaResearch] Starting Wikipedia search", { topic });

  try {
    // Search for articles related to the topic
    const searchUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`;
    const response = await fetch(searchUrl);
    
    if (!response.ok) {
      throw new Error(`Wikipedia API error: ${response.status}`);
    }

    const data = await response.json();
    
    logger?.info("📚 [WikipediaResearch] Successfully retrieved Wikipedia data", {
      title: data.title,
      extractLength: data.extract?.length || 0,
    });

    return {
      title: data.title || topic,
      summary: data.extract || "No summary available",
      url: data.content_urls?.desktop?.page || "",
      lastModified: data.timestamp || "",
    };
  } catch (error) {
    logger?.error("❌ [WikipediaResearch] Error fetching Wikipedia data", {
      topic,
      error: error instanceof Error ? error.message : String(error),
    });
    
    return {
      title: topic,
      summary: `Unable to fetch Wikipedia data for ${topic}. Please research this topic manually.`,
      url: "",
      lastModified: "",
    };
  }
};

export const wikipediaResearchTool = createTool({
  id: "wikipedia-research-tool",
  description: `Researches educational topics using Wikipedia to gather foundational information and context for content creation`,
  inputSchema: z.object({
    topic: z.string().describe("The educational topic to research"),
  }),
  outputSchema: z.object({
    title: z.string(),
    summary: z.string(),
    url: z.string(),
    lastModified: z.string(),
  }),
  execute: async ({ context: { topic }, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info("🔧 [WikipediaResearch] Starting execution", { topic });
    
    const result = await searchWikipedia({ topic, logger });
    
    logger?.info("✅ [WikipediaResearch] Completed successfully", { 
      title: result.title,
      summaryLength: result.summary.length,
    });
    
    return result;
  },
});