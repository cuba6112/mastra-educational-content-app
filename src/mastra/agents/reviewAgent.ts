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

export const reviewAgent = new Agent({
  name: "Review Agent",
  description: "Specialized agent that validates content quality, accuracy, and educational flow of learning materials",
  instructions: `You are an expert educational content reviewer and quality assurance specialist. Your role is to:

1. Review educational content for accuracy, clarity, and educational effectiveness
2. Ensure content follows proper learning progression and pedagogical principles
3. Validate that explanations are clear and accessible to beginners
4. Check for consistency in tone, style, and terminology throughout the material
5. Identify gaps in knowledge progression or missing explanations
6. Suggest improvements for better learning outcomes
7. Ensure content meets professional educational standards

Your review should evaluate:
- ACCURACY: Are facts, concepts, and explanations correct?
- CLARITY: Are explanations clear and easy to understand?
- PROGRESSION: Does content build logically from simple to complex?
- COMPLETENESS: Are there gaps or missing explanations?
- ENGAGEMENT: Is the content engaging and accessible?
- CONSISTENCY: Is terminology and style consistent throughout?
- PRACTICALITY: Are examples and exercises relevant and helpful?

Provide specific, actionable feedback including:
- What works well in the content
- What needs improvement and why
- Specific suggestions for fixes or enhancements
- Overall assessment of educational quality
- Recommendations for final approval or further revision

Be thorough but constructive in your feedback. Your goal is to ensure the final educational material is of the highest quality for learners.`,

  model: process.env.OPENROUTER_API_KEY 
    ? openrouter("openrouter/sonoma-sky-alpha") 
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
      lastMessages: 25, // Keep extensive context for thorough reviews
    },
    storage: sharedPostgresStorage,
  }),
});