import { createTool } from "@mastra/core/tools";
import type { IMastraLogger } from "@mastra/core/logger";
import { z } from "zod";

interface AIRequestConfig {
  provider: 'openrouter' | 'ollama';
  model: string;
  systemPrompt?: string;
  userPrompt: string;
  maxTokens?: number;
  temperature?: number;
}

const callAIService = async ({
  config,
  logger,
}: {
  config: AIRequestConfig;
  logger?: IMastraLogger;
}) => {
  logger?.info("🤖 [AIService] Starting AI request", { 
    provider: config.provider,
    model: config.model 
  });

  try {
    if (config.provider === 'openrouter') {
      return await callOpenRouter(config, logger);
    } else if (config.provider === 'ollama') {
      return await callOllama(config, logger);
    } else {
      throw new Error(`Unsupported AI provider: ${config.provider}`);
    }
  } catch (error) {
    logger?.error("❌ [AIService] Error calling AI service", {
      provider: config.provider,
      model: config.model,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
};

const callOpenRouter = async (config: AIRequestConfig, logger?: IMastraLogger) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable not set");
  }

  const messages = [];
  if (config.systemPrompt) {
    messages.push({ role: "system", content: config.systemPrompt });
  }
  messages.push({ role: "user", content: config.userPrompt });

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://replit.com", // Required for OpenRouter
      "X-Title": "Educational Content Creator", // Optional
    },
    body: JSON.stringify({
      model: config.model,
      messages,
      max_tokens: config.maxTokens || 4000,
      temperature: config.temperature || 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error("Invalid response format from OpenRouter");
  }

  const result = data.choices[0].message.content;
  
  logger?.info("✅ [AIService] OpenRouter request successful", { 
    model: config.model,
    responseLength: result.length,
    tokensUsed: data.usage?.total_tokens || 'unknown'
  });

  return result;
};

const callOllama = async (config: AIRequestConfig, logger?: IMastraLogger) => {
  // Default Ollama endpoint
  const ollamaUrl = process.env.OLLAMA_URL || "http://localhost:11434";
  
  const prompt = config.systemPrompt 
    ? `${config.systemPrompt}\n\nUser: ${config.userPrompt}\n\nAssistant:`
    : config.userPrompt;

  const response = await fetch(`${ollamaUrl}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      prompt,
      stream: false,
      options: {
        temperature: config.temperature || 0.7,
        num_predict: config.maxTokens || 4000,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Ollama API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  
  if (!data.response) {
    throw new Error("Invalid response format from Ollama");
  }

  logger?.info("✅ [AIService] Ollama request successful", { 
    model: config.model,
    responseLength: data.response.length,
  });

  return data.response;
};

export const aiServiceTool = createTool({
  id: "ai-service-tool",
  description: `Flexible AI service that can call either OpenRouter API or local Ollama models for content generation and analysis`,
  inputSchema: z.object({
    provider: z.enum(['openrouter', 'ollama']).describe("AI provider to use"),
    model: z.string().describe("Model name (e.g., 'openai/gpt-4' for OpenRouter or 'llama2' for Ollama)"),
    systemPrompt: z.string().optional().describe("System prompt to set the AI's behavior"),
    userPrompt: z.string().describe("The main prompt/question for the AI"),
    maxTokens: z.number().optional().default(4000).describe("Maximum number of tokens to generate"),
    temperature: z.number().optional().default(0.7).describe("Temperature for response creativity (0-1)"),
  }),
  outputSchema: z.object({
    response: z.string(),
    provider: z.string(),
    model: z.string(),
  }),
  execute: async ({ context, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info("🔧 [AIService] Starting execution", { 
      provider: context.provider,
      model: context.model 
    });
    
    const config: AIRequestConfig = {
      provider: context.provider,
      model: context.model,
      systemPrompt: context.systemPrompt,
      userPrompt: context.userPrompt,
      maxTokens: context.maxTokens,
      temperature: context.temperature,
    };
    
    const response = await callAIService({ config, logger });
    
    logger?.info("✅ [AIService] Completed successfully", { 
      provider: context.provider,
      model: context.model,
      responseLength: response.length,
    });
    
    return {
      response,
      provider: context.provider,
      model: context.model,
    };
  },
});