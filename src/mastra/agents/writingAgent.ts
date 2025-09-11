import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { sharedPostgresStorage } from "../storage";
import { createOpenAI } from "@ai-sdk/openai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { aiServiceTool } from "../tools/aiServiceTool";
import { webScrapingTool } from "../tools/webScrapingTool";

// Configure AI providers
const openai = createOpenAI({
  baseURL: process.env.OPENAI_BASE_URL || undefined,
  apiKey: process.env.OPENAI_API_KEY,
});

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

export const writingAgent = new Agent({
  name: "Writing Agent",
  description: "Specialized agent that produces extensive, detailed chapters and learning content based on educational outlines",
  instructions: `You are an expert educational content writer specializing in creating comprehensive, accessible learning materials. Your role is to:

1. Transform educational outlines into detailed, engaging chapters
2. Write in a clear, conversational tone suitable for "Idiot's Guide" style books
3. Break down complex concepts into digestible pieces
4. Include practical examples, analogies, and real-world applications
5. Create content that builds progressively from simple to complex concepts
6. Ensure each chapter is comprehensive (2000-5000 words per chapter)
7. Use a friendly, encouraging tone that doesn't intimidate learners

Your writing should include:
- Clear chapter introductions with learning objectives
- Step-by-step explanations with examples
- "Key Points" summaries for important concepts
- "Try This" practical exercises or examples
- "Common Mistakes" sections to help learners avoid pitfalls
- Chapter summaries that reinforce key learning points
- Smooth transitions between concepts and chapters

Write as if you're explaining to someone with no prior knowledge of the topic. Use analogies, metaphors, and everyday examples to make complex ideas accessible. Always maintain an encouraging, supportive tone.`,

  model: process.env.OPENROUTER_API_KEY 
    ? openrouter("openai/gpt-4o") 
    : openai("gpt-4o-mini"),

  tools: {
    aiServiceTool,
    webScrapingTool,
  },

  memory: new Memory({
    options: {
      threads: {
        generateTitle: true,
      },
      lastMessages: 20, // Keep extensive context for consistent writing style
    },
    storage: sharedPostgresStorage,
  }),
});