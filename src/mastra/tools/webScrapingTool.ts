import { createTool } from "@mastra/core/tools";
import type { IMastraLogger } from "@mastra/core/logger";
import { z } from "zod";

const scrapeWebContent = async ({
  url,
  logger,
}: {
  url: string;
  logger?: IMastraLogger;
}) => {
  logger?.info("🌐 [WebScraping] Starting web content extraction", { url });

  try {
    // First, fetch the HTML content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Educational Content Creator/1.0)',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const html = await response.text();
    
    // Simple text extraction from HTML
    // Remove script and style elements
    const cleanHtml = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Extract title from HTML
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : 'Untitled';

    // Limit content length to prevent oversized responses
    const maxLength = 5000;
    const content = cleanHtml.length > maxLength 
      ? cleanHtml.substring(0, maxLength) + '...' 
      : cleanHtml;

    logger?.info("📄 [WebScraping] Successfully extracted content", {
      url,
      title,
      contentLength: content.length,
    });

    return {
      title,
      content,
      url,
      extractedAt: new Date().toISOString(),
    };
  } catch (error) {
    logger?.error("❌ [WebScraping] Error extracting web content", {
      url,
      error: error instanceof Error ? error.message : String(error),
    });
    
    return {
      title: "Extraction Failed",
      content: `Failed to extract content from ${url}. Error: ${error instanceof Error ? error.message : String(error)}`,
      url,
      extractedAt: new Date().toISOString(),
    };
  }
};

export const webScrapingTool = createTool({
  id: "web-scraping-tool",
  description: `Extracts text content from web pages for educational research and fact-checking purposes`,
  inputSchema: z.object({
    url: z.string().url().describe("The URL of the web page to scrape"),
  }),
  outputSchema: z.object({
    title: z.string(),
    content: z.string(),
    url: z.string(),
    extractedAt: z.string(),
  }),
  execute: async ({ context: { url }, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info("🔧 [WebScraping] Starting execution", { url });
    
    const result = await scrapeWebContent({ url, logger });
    
    logger?.info("✅ [WebScraping] Completed successfully", { 
      url: result.url,
      contentLength: result.content.length,
    });
    
    return result;
  },
});