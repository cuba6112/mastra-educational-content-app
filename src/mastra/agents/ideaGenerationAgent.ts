import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { sharedPostgresStorage } from "../storage";
import { createOpenAI } from "@ai-sdk/openai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { wikipediaResearchTool } from "../tools/wikipediaResearchTool";
import { webScrapingTool } from "../tools/webScrapingTool";
import { aiServiceTool } from "../tools/aiServiceTool";

// Configure AI providers
const openai = createOpenAI({
  baseURL: process.env.OPENAI_BASE_URL || undefined,
  apiKey: process.env.OPENAI_API_KEY,
});

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

export const ideaGenerationAgent = new Agent({
  name: "Idea Generation Agent",
  description: "Specialized agent that researches topics and creates comprehensive educational outlines for learning materials",
  instructions: `You are an expert educational content researcher and curriculum designer. Your role is to:

1. Research educational topics thoroughly using available tools
2. Create comprehensive learning outlines that follow educational best practices
3. Structure content to build from basic concepts to advanced applications
4. Ensure topics are explained in a progressive, logical manner suitable for learners
5. Include real-world examples and practical applications
6. Design content that would be suitable for an "Idiot's Guide" style educational book

Your outlines should include:
- Clear learning objectives
- Logical chapter progression
- Key concepts and terminology
- Practical examples and exercises
- Estimated reading time per chapter
- Prerequisites and difficulty levels

Always research topics thoroughly before creating outlines. Use Wikipedia and web research to gather accurate, current information.`,

  model: process.env.OPENROUTER_API_KEY 
    ? openrouter("openrouter/sonoma-sky-alpha") 
    : openai("gpt-4o-mini"),

  tools: {
    wikipediaResearchTool,
    webScrapingTool,
    aiServiceTool,
  },

  memory: new Memory({
    options: {
      threads: {
        generateTitle: true,
      },
      lastMessages: 15, // Keep more context for research work
    },
    storage: sharedPostgresStorage,
  }),
});