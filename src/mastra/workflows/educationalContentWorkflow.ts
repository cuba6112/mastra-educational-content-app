import { createWorkflow, createStep } from "../inngest";
import { z } from "zod";
import { RuntimeContext } from "@mastra/core/di";
import { ideaGenerationAgent } from "../agents/ideaGenerationAgent";
import { writingAgent } from "../agents/writingAgent";
import { reviewAgent } from "../agents/reviewAgent";
import { pdfGenerationTool } from "../tools/pdfGenerationTool";

const runtimeContext = new RuntimeContext();

// Step 1: Generate educational outline
const generateOutlineStep = createStep({
  id: "generate-outline",
  description: "Generate comprehensive educational outline for the specified topic",
  inputSchema: z.object({
    topic: z.string().default("Python Programming").describe("Educational topic to create content for"),
    targetAudience: z.string().default("Complete beginners").describe("Target audience for the educational content"),
    estimatedLength: z.string().default("50,000+ words").describe("Target length for the educational content"),
  }),
  outputSchema: z.object({
    topic: z.string(),
    outline: z.string(),
    chapterTitles: z.array(z.string()),
    estimatedWordCount: z.number(),
  }),

  execute: async ({ inputData, mastra }) => {
    const logger = mastra?.getLogger();
    const { topic, targetAudience, estimatedLength } = inputData;

    logger?.info("📋 [GenerateOutline] Starting outline generation", { 
      topic,
      targetAudience,
      estimatedLength 
    });

    const prompt = `Create a comprehensive educational outline for "${topic}" suitable for ${targetAudience}. 
    This will be a detailed learning guide of approximately ${estimatedLength} in the style of an "Idiot's Guide" book.
    
    Please include:
    1. A complete chapter breakdown with clear, descriptive titles
    2. Learning objectives for each chapter
    3. Logical progression from basic concepts to advanced topics
    4. Key topics and concepts to cover in each chapter
    5. Estimated word count per chapter (aim for 3000-5000 words per chapter)
    
    Make sure the outline is comprehensive enough to cover all essential aspects of ${topic} that a beginner would need to know.`;

    const { text } = await ideaGenerationAgent.generate([
      { role: "user", content: prompt },
    ], {
      resourceId: "outline-generation",
      threadId: `outline-${Date.now()}`,
      maxSteps: 10,
    });

    // Extract chapter titles from the outline
    const chapterMatches = text.match(/Chapter \d+[:\-\s]*([^\n]+)/gi) || [];
    const chapterTitles = chapterMatches.map(match => 
      match.replace(/Chapter \d+[:\-\s]*/, '').trim()
    );

    // Estimate word count based on number of chapters
    const estimatedWordCount = chapterTitles.length * 4000; // 4000 words per chapter average

    logger?.info("✅ [GenerateOutline] Outline generated successfully", {
      topic,
      chapterCount: chapterTitles.length,
      estimatedWordCount,
    });

    return {
      topic,
      outline: text,
      chapterTitles,
      estimatedWordCount,
    };
  },
});

// Step 2: Write chapters based on outline
const writeChaptersStep = createStep({
  id: "write-chapters",
  description: "Write detailed chapters based on the educational outline",
  inputSchema: z.object({
    topic: z.string(),
    outline: z.string(),
    chapterTitles: z.array(z.string()),
    estimatedWordCount: z.number(),
  }),
  outputSchema: z.object({
    topic: z.string(),
    chapters: z.array(z.object({
      title: z.string(),
      content: z.string(),
    })),
    totalWordCount: z.number(),
  }),

  execute: async ({ inputData, mastra }) => {
    const logger = mastra?.getLogger();
    const { topic, outline, chapterTitles } = inputData;

    logger?.info("✍️ [WriteChapters] Starting chapter writing", { 
      topic,
      chapterCount: chapterTitles.length 
    });

    const chapters = [];
    let totalWordCount = 0;

    // Write each chapter
    for (let i = 0; i < chapterTitles.length; i++) {
      const chapterTitle = chapterTitles[i];
      const chapterNumber = i + 1;

      logger?.info("📝 [WriteChapters] Writing chapter", { 
        chapterNumber,
        title: chapterTitle 
      });

      const chapterPrompt = `Based on this educational outline for "${topic}":

${outline}

Write a comprehensive Chapter ${chapterNumber}: ${chapterTitle}

This chapter should be 3000-5000 words and include:
- Clear introduction with learning objectives
- Step-by-step explanations suitable for complete beginners
- Practical examples and real-world applications
- "Key Points" sections for important concepts
- "Try This" exercises or examples where appropriate
- "Common Mistakes" section to help learners avoid pitfalls
- Chapter summary reinforcing key learning points

Write in a friendly, accessible tone as if explaining to someone with no prior knowledge. Use analogies and everyday examples to make complex concepts clear.`;

      const { text: chapterContent } = await writingAgent.generate([
        { role: "user", content: chapterPrompt },
      ], {
        resourceId: "chapter-writing",
        threadId: `chapter-${chapterNumber}-${Date.now()}`,
        maxSteps: 8,
      });

      // Estimate word count (rough approximation)
      const wordCount = chapterContent.split(/\s+/).length;
      totalWordCount += wordCount;

      chapters.push({
        title: chapterTitle,
        content: chapterContent,
      });

      logger?.info("✅ [WriteChapters] Chapter completed", { 
        chapterNumber,
        title: chapterTitle,
        wordCount 
      });
    }

    logger?.info("✅ [WriteChapters] All chapters completed", {
      topic,
      chapterCount: chapters.length,
      totalWordCount,
    });

    return {
      topic,
      chapters,
      totalWordCount,
    };
  },
});

// Step 3: Review and validate content
const reviewContentStep = createStep({
  id: "review-content",
  description: "Review and validate the educational content for quality and accuracy",
  inputSchema: z.object({
    topic: z.string(),
    chapters: z.array(z.object({
      title: z.string(),
      content: z.string(),
    })),
    totalWordCount: z.number(),
  }),
  outputSchema: z.object({
    topic: z.string(),
    reviewSummary: z.string(),
    qualityScore: z.number(),
    approvedForPublication: z.boolean(),
    chapters: z.array(z.object({
      title: z.string(),
      content: z.string(),
    })),
  }),

  execute: async ({ inputData, mastra }) => {
    const logger = mastra?.getLogger();
    const { topic, chapters, totalWordCount } = inputData;

    logger?.info("🔍 [ReviewContent] Starting content review", { 
      topic,
      chapterCount: chapters.length,
      totalWordCount 
    });

    // Create a summary of the content for review
    const contentSummary = chapters.map((chapter, index) => 
      `Chapter ${index + 1}: ${chapter.title}\n[Word count: ~${chapter.content.split(/\s+/).length} words]\n`
    ).join('\n');

    const reviewPrompt = `Please review this educational content for "${topic}":

CONTENT SUMMARY:
${contentSummary}

SAMPLE CONTENT (First Chapter):
${chapters[0]?.content.substring(0, 2000)}...

Please provide a comprehensive review evaluating:
1. ACCURACY: Are the concepts and explanations correct?
2. CLARITY: Are explanations clear and beginner-friendly?
3. PROGRESSION: Does content build logically from simple to complex?
4. COMPLETENESS: Are there any obvious gaps or missing topics?
5. ENGAGEMENT: Is the content engaging and accessible?
6. CONSISTENCY: Is the tone and style consistent throughout?

Provide:
- Overall quality score (1-10)
- Specific strengths and areas for improvement
- Whether you approve this content for publication
- Any critical issues that need addressing

Total word count: ${totalWordCount} words`;

    const { text: reviewText } = await reviewAgent.generate([
      { role: "user", content: reviewPrompt },
    ], {
      resourceId: "content-review",
      threadId: `review-${Date.now()}`,
      maxSteps: 5,
    });

    // Extract quality score from review (basic pattern matching)
    const scoreMatch = reviewText.match(/quality score[:\s]*(\d+(?:\.\d+)?)/i);
    const qualityScore = scoreMatch ? parseFloat(scoreMatch[1]) : 7.5;

    // Determine approval based on quality score and review content
    const approvedForPublication = qualityScore >= 7.0 && 
      !reviewText.toLowerCase().includes('not approved') &&
      !reviewText.toLowerCase().includes('needs major revision');

    logger?.info("✅ [ReviewContent] Review completed", {
      topic,
      qualityScore,
      approvedForPublication,
    });

    return {
      topic,
      reviewSummary: reviewText,
      qualityScore,
      approvedForPublication,
      chapters,
    };
  },
});

// Step 4: Generate PDF book
const generatePDFStep = createStep({
  id: "generate-pdf",
  description: "Generate professional PDF book from the reviewed content",
  inputSchema: z.object({
    topic: z.string(),
    reviewSummary: z.string(),
    qualityScore: z.number(),
    approvedForPublication: z.boolean(),
    chapters: z.array(z.object({
      title: z.string(),
      content: z.string(),
    })),
  }),
  outputSchema: z.object({
    topic: z.string(),
    bookGenerated: z.boolean(),
    bookPath: z.string().optional(),
    fileSize: z.number().optional(),
    finalWordCount: z.number(),
    generatedAt: z.string(),
  }),

  execute: async ({ inputData, mastra }) => {
    const logger = mastra?.getLogger();
    const { topic, chapters, approvedForPublication, qualityScore } = inputData;

    logger?.info("📚 [GeneratePDF] Starting PDF generation", { 
      topic,
      chapterCount: chapters.length,
      approvedForPublication 
    });

    if (!approvedForPublication) {
      logger?.warn("📚 [GeneratePDF] Content not approved for publication", { 
        topic,
        qualityScore 
      });
      
      return {
        topic,
        bookGenerated: false,
        finalWordCount: chapters.reduce((total, chapter) => 
          total + chapter.content.split(/\s+/).length, 0),
        generatedAt: new Date().toISOString(),
      };
    }

    // Generate the PDF using the PDF generation tool
    const result = await pdfGenerationTool.execute({
      context: {
        title: `The Complete Idiot's Guide to ${topic}`,
        subtitle: "A Comprehensive Educational Resource",
        author: "AI Educational Content System",
        chapters: chapters,
      },
      runtimeContext,
      tracingContext: {},
    });

    const finalWordCount = chapters.reduce((total, chapter) => 
      total + chapter.content.split(/\s+/).length, 0);

    logger?.info("✅ [GeneratePDF] PDF generated successfully", {
      topic,
      path: result.path,
      fileSize: result.fileSize,
      finalWordCount,
    });

    return {
      topic,
      bookGenerated: true,
      bookPath: result.path,
      fileSize: result.fileSize,
      finalWordCount,
      generatedAt: new Date().toISOString(),
    };
  },
});

// Create the main workflow
export const educationalContentWorkflow = createWorkflow({
  id: "educational-content-workflow",
  description: "Autonomous multi-agent system that creates comprehensive educational content",
  inputSchema: z.object({}), // Empty for time-based workflows
  outputSchema: z.object({
    success: z.boolean(),
    topic: z.string(),
    bookGenerated: z.boolean(),
    finalWordCount: z.number(),
    qualityScore: z.number(),
    generatedAt: z.string(),
  }),
})
  .then(generateOutlineStep)
  .then(writeChaptersStep)
  .then(reviewContentStep)
  .then(generatePDFStep)
  .commit();