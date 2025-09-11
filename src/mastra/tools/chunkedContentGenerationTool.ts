import { createTool } from "@mastra/core/tools";
import type { IMastraLogger } from "@mastra/core/logger";
import { z } from "zod";

interface ContentChunk {
  sectionTitle: string;
  content: string;
  wordCount: number;
  chunkIndex: number;
}

interface ChunkGenerationConfig {
  topic: string;
  chapterTitle: string;
  chapterNumber: number;
  sectionTitles: string[];
  targetWordsPerSection: number;
  context: string;
  retryAttempts?: number;
}

const generateContentChunk = async ({
  config,
  sectionIndex,
  logger,
}: {
  config: ChunkGenerationConfig;
  sectionIndex: number;
  logger?: IMastraLogger;
}): Promise<ContentChunk> => {
  const { topic, chapterTitle, chapterNumber, sectionTitles, targetWordsPerSection, context } = config;
  const sectionTitle = sectionTitles[sectionIndex];
  const maxRetries = config.retryAttempts || 3;

  logger?.info("📝 [ChunkedGeneration] Starting content chunk generation", {
    topic,
    chapterNumber,
    chapterTitle,
    sectionTitle,
    sectionIndex,
    targetWords: targetWordsPerSection
  });

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger?.info("🔄 [ChunkedGeneration] Attempt", { attempt, maxRetries });

      const prompt = `You are writing a comprehensive educational guide on "${topic}".

CHAPTER CONTEXT:
Chapter ${chapterNumber}: ${chapterTitle}

SECTION TO WRITE:
${sectionTitle}

OVERALL BOOK CONTEXT:
${context}

SECTION OUTLINE:
${sectionTitles.map((title, idx) => `${idx + 1}. ${title}`).join('\n')}

CURRENT SECTION: ${sectionIndex + 1}. ${sectionTitle}

INSTRUCTIONS:
- Write EXACTLY this section in ${targetWordsPerSection} words (${targetWordsPerSection - 50} to ${targetWordsPerSection + 50} words acceptable)
- Write in a friendly, accessible "Idiot's Guide" style suitable for complete beginners
- Use clear examples and analogies
- Include practical tips and "Key Points" where appropriate
- If this is the first section, include a brief chapter introduction
- If this is the last section, include a chapter summary
- Build logically on previous sections but make this section standalone
- Use formatting like headings, bullet points, and emphasis where helpful

Write the content for "${sectionTitle}" now:`;

      // For this example, I'll simulate AI generation
      // In production, this would call your actual AI service
      const response = await simulateAIGeneration(prompt, targetWordsPerSection, logger);
      
      const wordCount = response.split(/\s+/).length;
      
      logger?.info("✅ [ChunkedGeneration] Content chunk generated successfully", {
        sectionTitle,
        wordCount,
        targetWords: targetWordsPerSection,
        withinRange: Math.abs(wordCount - targetWordsPerSection) <= 100
      });

      return {
        sectionTitle,
        content: response,
        wordCount,
        chunkIndex: sectionIndex,
      };

    } catch (error) {
      logger?.error("❌ [ChunkedGeneration] Error generating content chunk", {
        sectionTitle,
        attempt,
        error: error instanceof Error ? error.message : String(error),
      });

      if (attempt === maxRetries) {
        throw new Error(`Failed to generate content for section "${sectionTitle}" after ${maxRetries} attempts: ${error instanceof Error ? error.message : String(error)}`);
      }

      // Exponential backoff
      const backoffMs = Math.min(1000 * Math.pow(2, attempt - 1), 30000);
      logger?.info("⏳ [ChunkedGeneration] Backing off before retry", { backoffMs });
      await new Promise(resolve => setTimeout(resolve, backoffMs));
    }
  }

  throw new Error(`Failed to generate content for section "${sectionTitle}"`);
};

// Simulate AI generation for testing - replace with actual AI service call
const simulateAIGeneration = async (prompt: string, targetWords: number, logger?: IMastraLogger): Promise<string> => {
  logger?.info("🤖 [SimulatedAI] Generating content", { targetWords });
  
  // Simulate some processing time
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  // Generate placeholder content with approximately the right word count
  const wordsNeeded = targetWords;
  const sentences = [];
  let currentWordCount = 0;
  
  while (currentWordCount < wordsNeeded) {
    const sentenceLength = 15 + Math.floor(Math.random() * 20); // 15-35 words per sentence
    const sentence = generatePlaceholderSentence(sentenceLength);
    sentences.push(sentence);
    currentWordCount += sentenceLength;
  }
  
  return sentences.join(' ');
};

const generatePlaceholderSentence = (wordCount: number): string => {
  const words = [
    'educational', 'content', 'learning', 'understanding', 'concepts', 'principles', 'methods',
    'techniques', 'approaches', 'strategies', 'implementation', 'practical', 'theoretical',
    'fundamental', 'advanced', 'comprehensive', 'detailed', 'effective', 'important',
    'essential', 'critical', 'valuable', 'useful', 'relevant', 'significant', 'appropriate'
  ];
  
  const sentence = [];
  for (let i = 0; i < wordCount; i++) {
    sentence.push(words[Math.floor(Math.random() * words.length)]);
  }
  
  return sentence.join(' ') + '.';
};

export const chunkedContentGenerationTool = createTool({
  id: "chunked-content-generation-tool",
  description: `Generates educational content in manageable chunks with retry logic and progress tracking`,
  inputSchema: z.object({
    topic: z.string().describe("The main educational topic"),
    chapterTitle: z.string().describe("Title of the chapter being written"),
    chapterNumber: z.number().describe("Chapter number"),
    sectionTitles: z.array(z.string()).describe("Array of section titles within the chapter"),
    targetWordsPerSection: z.number().default(600).describe("Target word count per section"),
    context: z.string().describe("Overall context and outline for the educational content"),
    sectionIndex: z.number().describe("Index of the section to generate (0-based)"),
    retryAttempts: z.number().default(3).describe("Number of retry attempts for failed generations"),
  }),
  outputSchema: z.object({
    sectionTitle: z.string(),
    content: z.string(),
    wordCount: z.number(),
    chunkIndex: z.number(),
    generatedAt: z.string(),
  }),
  execute: async ({ context, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info("🔧 [ChunkedGeneration] Starting execution", {
      topic: context.topic,
      chapterTitle: context.chapterTitle,
      sectionIndex: context.sectionIndex,
    });

    const config: ChunkGenerationConfig = {
      topic: context.topic,
      chapterTitle: context.chapterTitle,
      chapterNumber: context.chapterNumber,
      sectionTitles: context.sectionTitles,
      targetWordsPerSection: context.targetWordsPerSection,
      context: context.context,
      retryAttempts: context.retryAttempts,
    };

    const result = await generateContentChunk({
      config,
      sectionIndex: context.sectionIndex,
      logger,
    });

    logger?.info("✅ [ChunkedGeneration] Completed successfully", {
      sectionTitle: result.sectionTitle,
      wordCount: result.wordCount,
      chunkIndex: result.chunkIndex,
    });

    return {
      ...result,
      generatedAt: new Date().toISOString(),
    };
  },
});