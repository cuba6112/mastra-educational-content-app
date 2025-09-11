import { createWorkflow, createStep } from "../inngest";
import { z } from "zod";
import { RuntimeContext } from "@mastra/core/di";
import { ideaGenerationAgent } from "../agents/ideaGenerationAgent";
import { writingAgent } from "../agents/writingAgent";
import { reviewAgent } from "../agents/reviewAgent";
import { pdfGenerationTool } from "../tools/pdfGenerationTool";
import { chunkedContentGenerationTool } from "../tools/chunkedContentGenerationTool";
import { progressTrackingTool } from "../tools/progressTrackingTool";

const runtimeContext = new RuntimeContext();

// Step 1: Initialize progress tracking and generate outline
const initializeAndPlanStep = createStep({
  id: "initialize-and-plan",
  description: "Initialize progress tracking and generate comprehensive educational outline",
  inputSchema: z.object({
    topic: z.string().default("Advanced JavaScript Programming").describe("Educational topic to create content for"),
    targetAudience: z.string().default("Intermediate developers").describe("Target audience for the educational content"),
    targetWordCount: z.number().default(60000).describe("Target total word count for the content"),
  }),
  outputSchema: z.object({
    workflowId: z.string(),
    topic: z.string(),
    outline: z.string(),
    chapters: z.array(z.object({
      number: z.number(),
      title: z.string(),
      sections: z.array(z.string()),
      targetWordCount: z.number(),
    })),
    totalSections: z.number(),
    progressInitialized: z.boolean(),
  }),

  execute: async ({ inputData, mastra }) => {
    const logger = mastra?.getLogger();
    const { topic, targetAudience, targetWordCount } = inputData;
    const workflowId = `edu-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    logger?.info("🚀 [InitializePlan] Starting workflow initialization", { 
      workflowId,
      topic,
      targetWordCount 
    });

    // Generate comprehensive outline
    const outlinePrompt = `Create a comprehensive educational outline for "${topic}" for ${targetAudience}.
    
    This will be a detailed learning guide of ${targetWordCount ? targetWordCount.toLocaleString() : '60,000'} words total.
    
    Structure this as 8-12 chapters, each with 4-6 sections. Each section should be approximately 600-800 words.
    
    Format your response as:
    
    CHAPTER OUTLINE:
    
    Chapter 1: [Title]
    - Section 1.1: [Title]
    - Section 1.2: [Title]
    - Section 1.3: [Title]
    - Section 1.4: [Title]
    
    Chapter 2: [Title]
    - Section 2.1: [Title]
    - Section 2.2: [Title]
    - Section 2.3: [Title]
    - Section 2.4: [Title]
    
    Continue for all chapters...
    
    Include clear, descriptive titles that build from basic concepts to advanced applications.`;

    const { text: outlineText } = await ideaGenerationAgent.generate([
      { role: "user", content: outlinePrompt },
    ], {
      resourceId: "outline-generation",
      threadId: workflowId,
      maxSteps: 10,
    });

    // Parse the outline into structured data
    const chapters = parseOutlineIntoChapters(outlineText, targetWordCount);
    const totalSections = chapters.reduce((sum, chapter) => sum + chapter.sections.length, 0);

    logger?.info("📋 [InitializePlan] Outline generated", {
      workflowId,
      chapterCount: chapters.length,
      totalSections,
    });

    // Initialize progress tracking
    const progressResult = await progressTrackingTool.execute({
      context: {
        action: 'initialize',
        workflowId,
        topic,
        totalChapters: chapters.length,
        totalSections,
        targetWordCount,
      },
      runtimeContext,
      tracingContext: {},
    });

    logger?.info("✅ [InitializePlan] Initialization completed", {
      workflowId,
      progressInitialized: progressResult.success,
    });

    return {
      workflowId,
      topic,
      outline: outlineText,
      chapters,
      totalSections,
      progressInitialized: progressResult.success,
    };
  },
});

// Step 2: Generate content for all chapters using chunked approach
const generateAllContentStep = createStep({
  id: "generate-all-content",
  description: "Generate all educational content using chunked, resumable approach",
  inputSchema: z.object({
    workflowId: z.string(),
    topic: z.string(),
    outline: z.string(),
    chapters: z.array(z.object({
      number: z.number(),
      title: z.string(),
      sections: z.array(z.string()),
      targetWordCount: z.number(),
    })),
    totalSections: z.number(),
    progressInitialized: z.boolean(),
  }),
  outputSchema: z.object({
    workflowId: z.string(),
    topic: z.string(),
    generatedChapters: z.array(z.object({
      number: z.number(),
      title: z.string(),
      content: z.string(),
      wordCount: z.number(),
      sections: z.array(z.object({
        title: z.string(),
        content: z.string(),
        wordCount: z.number(),
      })),
    })),
    totalWordCount: z.number(),
    allContentGenerated: z.boolean(),
  }),

  execute: async ({ inputData, mastra }) => {
    const logger = mastra?.getLogger();
    const { workflowId, topic, outline, chapters } = inputData;

    logger?.info("✍️ [GenerateContent] Starting chunked content generation", { 
      workflowId,
      chapterCount: chapters.length 
    });

    const generatedChapters = [];
    let totalWordCount = 0;
    let completedSections = 0;

    // Generate content for each chapter
    for (const chapter of chapters) {
      logger?.info("📝 [GenerateContent] Starting chapter", { 
        chapterNumber: chapter.number,
        title: chapter.title,
        sectionCount: chapter.sections.length
      });

      // Update progress
      await progressTrackingTool.execute({
        context: {
          action: 'update',
          workflowId,
          currentStep: `Generating Chapter ${chapter.number}: ${chapter.title}`,
          completedSections,
        },
        runtimeContext,
        tracingContext: {},
      });

      const targetWordsPerSection = Math.floor(chapter.targetWordCount / chapter.sections.length);
      const chapterSections = [];
      let chapterWordCount = 0;

      // Generate each section of the chapter
      for (let sectionIndex = 0; sectionIndex < chapter.sections.length; sectionIndex++) {
        const sectionTitle = chapter.sections[sectionIndex];
        
        logger?.info("📄 [GenerateContent] Generating section", {
          chapterNumber: chapter.number,
          sectionIndex,
          sectionTitle,
          targetWords: targetWordsPerSection
        });

        try {
          const sectionResult = await chunkedContentGenerationTool.execute({
            context: {
              topic,
              chapterTitle: chapter.title,
              chapterNumber: chapter.number,
              sectionTitles: chapter.sections,
              targetWordsPerSection,
              context: outline,
              sectionIndex,
              retryAttempts: 3,
              workflowId,
            },
            runtimeContext,
            tracingContext: {},
          });

          chapterSections.push({
            title: sectionResult.sectionTitle,
            content: sectionResult.content,
            wordCount: sectionResult.wordCount,
          });

          chapterWordCount += sectionResult.wordCount;
          completedSections++;

          logger?.info("✅ [GenerateContent] Section completed", {
            sectionTitle,
            wordCount: sectionResult.wordCount,
            completedSections,
          });

          // Update progress after each section
          await progressTrackingTool.execute({
            context: {
              action: 'update',
              workflowId,
              completedSections,
              totalWordsGenerated: totalWordCount + chapterWordCount,
            },
            runtimeContext,
            tracingContext: {},
          });

        } catch (error) {
          logger?.error("❌ [GenerateContent] Section generation failed", {
            chapterNumber: chapter.number,
            sectionIndex,
            sectionTitle,
            error: error instanceof Error ? error.message : String(error),
          });

          // Record error in progress tracking
          await progressTrackingTool.execute({
            context: {
              action: 'update',
              workflowId,
              error: `Failed to generate section "${sectionTitle}": ${error instanceof Error ? error.message : String(error)}`,
            },
            runtimeContext,
            tracingContext: {},
          });

          throw error;
        }
      }

      // Combine all sections into chapter content
      const chapterContent = chapterSections.map(section => 
        `## ${section.title}\n\n${section.content}`
      ).join('\n\n');

      generatedChapters.push({
        number: chapter.number,
        title: chapter.title,
        content: chapterContent,
        wordCount: chapterWordCount,
        sections: chapterSections,
      });

      totalWordCount += chapterWordCount;

      // Update progress after completing chapter
      await progressTrackingTool.execute({
        context: {
          action: 'update',
          workflowId,
          completedChapters: generatedChapters.length,
          totalWordsGenerated: totalWordCount,
          chapterCompleted: {
            chapterNumber: chapter.number,
            title: chapter.title,
            wordCount: chapterWordCount,
          },
        },
        runtimeContext,
        tracingContext: {},
      });

      logger?.info("✅ [GenerateContent] Chapter completed", {
        chapterNumber: chapter.number,
        title: chapter.title,
        wordCount: chapterWordCount,
        totalWordCount,
      });
    }

    logger?.info("✅ [GenerateContent] All content generation completed", {
      workflowId,
      chapterCount: generatedChapters.length,
      totalWordCount,
    });

    return {
      workflowId,
      topic,
      generatedChapters,
      totalWordCount,
      allContentGenerated: true,
    };
  },
});

// Step 3: Review generated content
const reviewContentStep = createStep({
  id: "review-content-improved",
  description: "Review and validate the generated educational content",
  inputSchema: z.object({
    workflowId: z.string(),
    topic: z.string(),
    generatedChapters: z.array(z.object({
      number: z.number(),
      title: z.string(),
      content: z.string(),
      wordCount: z.number(),
      sections: z.array(z.object({
        title: z.string(),
        content: z.string(),
        wordCount: z.number(),
      })),
    })),
    totalWordCount: z.number(),
    allContentGenerated: z.boolean(),
  }),
  outputSchema: z.object({
    workflowId: z.string(),
    topic: z.string(),
    reviewSummary: z.string(),
    qualityScore: z.number(),
    approvedForPublication: z.boolean(),
    finalChapters: z.array(z.object({
      title: z.string(),
      content: z.string(),
    })),
    finalWordCount: z.number(),
  }),

  execute: async ({ inputData, mastra }) => {
    const logger = mastra?.getLogger();
    const { workflowId, topic, generatedChapters, totalWordCount } = inputData;

    logger?.info("🔍 [ReviewContent] Starting content review", { 
      workflowId,
      chapterCount: generatedChapters.length,
      totalWordCount 
    });

    // Update progress
    await progressTrackingTool.execute({
      context: {
        action: 'update',
        workflowId,
        currentStep: 'Reviewing generated content',
      },
      runtimeContext,
      tracingContext: {},
    });

    // Create summary for review
    const contentSummary = generatedChapters.map(chapter => 
      `Chapter ${chapter.number}: ${chapter.title} (${chapter.wordCount} words, ${chapter.sections.length} sections)`
    ).join('\n');

    // Sample content for review (first chapter content, truncated)
    const sampleContent = generatedChapters[0]?.content.substring(0, 3000) || "";

    const reviewPrompt = `Review this educational content for "${topic}":

CONTENT SUMMARY:
${contentSummary}

TOTAL WORD COUNT: ${totalWordCount ? totalWordCount.toLocaleString() : '0'} words

SAMPLE CONTENT (First Chapter):
${sampleContent}...

Evaluate:
1. ACCURACY: Are concepts correct and well-explained?
2. CLARITY: Is content clear and appropriate for the target audience?
3. PROGRESSION: Does content build logically?
4. COMPLETENESS: Are there gaps or missing topics?
5. ENGAGEMENT: Is content engaging and accessible?
6. CONSISTENCY: Is tone and style consistent?

Provide:
- Overall quality score (1-10)
- Strengths and improvements needed
- Approval recommendation (approve/needs revision)
- Word count assessment (is ${totalWordCount ? totalWordCount.toLocaleString() : '0'} words appropriate?)`;

    const { text: reviewText } = await reviewAgent.generate([
      { role: "user", content: reviewPrompt },
    ], {
      resourceId: "content-review",
      threadId: `review-${workflowId}`,
      maxSteps: 8,
    });

    // Extract quality score
    const scoreMatch = reviewText.match(/quality score[:\s]*(\d+(?:\.\d+)?)/i);
    const qualityScore = scoreMatch ? parseFloat(scoreMatch[1]) : 7.5;

    // Determine approval
    const approvedForPublication = qualityScore >= 7.0 && 
      !reviewText.toLowerCase().includes('not approved') &&
      !reviewText.toLowerCase().includes('needs major revision');

    // Prepare final chapters for PDF generation
    const finalChapters = generatedChapters.map(chapter => ({
      title: chapter.title,
      content: chapter.content,
    }));

    logger?.info("✅ [ReviewContent] Review completed", {
      workflowId,
      qualityScore,
      approvedForPublication,
      finalWordCount: totalWordCount,
    });

    return {
      workflowId,
      topic,
      reviewSummary: reviewText,
      qualityScore,
      approvedForPublication,
      finalChapters,
      finalWordCount: totalWordCount,
    };
  },
});

// Step 4: Generate final PDF
const generateFinalPDFStep = createStep({
  id: "generate-final-pdf",
  description: "Generate the final PDF book from reviewed content",
  inputSchema: z.object({
    workflowId: z.string(),
    topic: z.string(),
    reviewSummary: z.string(),
    qualityScore: z.number(),
    approvedForPublication: z.boolean(),
    finalChapters: z.array(z.object({
      title: z.string(),
      content: z.string(),
    })),
    finalWordCount: z.number(),
  }),
  outputSchema: z.object({
    workflowId: z.string(),
    topic: z.string(),
    bookGenerated: z.boolean(),
    bookPath: z.string().optional(),
    fileSize: z.number().optional(),
    finalWordCount: z.number(),
    qualityScore: z.number(),
    completedAt: z.string(),
  }),

  execute: async ({ inputData, mastra }) => {
    const logger = mastra?.getLogger();
    const { workflowId, topic, finalChapters, approvedForPublication, qualityScore, finalWordCount } = inputData;

    logger?.info("📚 [GeneratePDF] Starting final PDF generation", { 
      workflowId,
      chapterCount: finalChapters.length,
      approvedForPublication 
    });

    // Update progress
    await progressTrackingTool.execute({
      context: {
        action: 'update',
        workflowId,
        currentStep: 'Generating final PDF',
      },
      runtimeContext,
      tracingContext: {},
    });

    if (!approvedForPublication) {
      logger?.warn("📚 [GeneratePDF] Content not approved for publication", { 
        workflowId,
        qualityScore 
      });

      await progressTrackingTool.execute({
        context: {
          action: 'fail',
          workflowId,
          error: `Content not approved for publication (quality score: ${qualityScore})`,
        },
        runtimeContext,
        tracingContext: {},
      });
      
      return {
        workflowId,
        topic,
        bookGenerated: false,
        finalWordCount,
        qualityScore,
        completedAt: new Date().toISOString(),
      };
    }

    try {
      // Generate the PDF
      const pdfResult = await pdfGenerationTool.execute({
        context: {
          title: `The Complete Guide to ${topic}`,
          subtitle: "A Comprehensive Educational Resource",
          author: "AI Educational Content System",
          chapters: finalChapters,
        },
        runtimeContext,
        tracingContext: {},
      });

      // Mark workflow as completed
      await progressTrackingTool.execute({
        context: {
          action: 'complete',
          workflowId,
        },
        runtimeContext,
        tracingContext: {},
      });

      logger?.info("✅ [GeneratePDF] PDF generated successfully", {
        workflowId,
        path: pdfResult.path,
        fileSize: pdfResult.fileSize,
        finalWordCount,
      });

      return {
        workflowId,
        topic,
        bookGenerated: true,
        bookPath: pdfResult.path,
        fileSize: pdfResult.fileSize,
        finalWordCount,
        qualityScore,
        completedAt: new Date().toISOString(),
      };

    } catch (error) {
      logger?.error("❌ [GeneratePDF] PDF generation failed", {
        workflowId,
        error: error instanceof Error ? error.message : String(error),
      });

      await progressTrackingTool.execute({
        context: {
          action: 'fail',
          workflowId,
          error: `PDF generation failed: ${error instanceof Error ? error.message : String(error)}`,
        },
        runtimeContext,
        tracingContext: {},
      });

      throw error;
    }
  },
});

// Helper function to parse outline into structured chapters
function parseOutlineIntoChapters(outlineText: string, targetWordCount: number): Array<{
  number: number;
  title: string;
  sections: string[];
  targetWordCount: number;
}> {
  const chapters: Array<{
    number: number;
    title: string;
    sections: string[];
    targetWordCount: number;
  }> = [];
  const lines = outlineText.split('\n');
  let currentChapter: {
    number: number;
    title: string;
    sections: string[];
    targetWordCount: number;
  } | null = null;
  let chapterNumber = 1;

  // Calculate target words per chapter
  const estimatedChapters = 10; // Default estimate
  const wordsPerChapter = Math.floor(targetWordCount / estimatedChapters);

  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Match chapter lines (e.g., "Chapter 1: Title" or "1. Title")
    const chapterMatch = trimmedLine.match(/^(?:Chapter\s+)?(\d+)[:\.\s]+(.+)$/i);
    if (chapterMatch && !trimmedLine.startsWith('-')) {
      if (currentChapter) {
        chapters.push(currentChapter);
      }
      
      currentChapter = {
        number: chapterNumber++,
        title: chapterMatch[2].trim(),
        sections: [],
        targetWordCount: wordsPerChapter,
      };
    }
    
    // Match section lines (e.g., "- Section 1.1: Title" or "  - Title")
    const sectionMatch = trimmedLine.match(/^[-•]\s*(?:Section\s+\d+\.\d+:\s*)?(.+)$/);
    if (sectionMatch && currentChapter) {
      currentChapter.sections.push(sectionMatch[1].trim());
    }
  }
  
  if (currentChapter) {
    chapters.push(currentChapter);
  }

  // If no chapters were parsed, create a default structure
  if (chapters.length === 0) {
    for (let i = 1; i <= 8; i++) {
      chapters.push({
        number: i,
        title: `Chapter ${i}`,
        sections: [`Introduction`, `Core Concepts`, `Practical Examples`, `Advanced Topics`, `Summary`],
        targetWordCount: wordsPerChapter,
      });
    }
  }

  return chapters;
}

// Create the improved workflow
export const improvedEducationalContentWorkflow = createWorkflow({
  id: "improved-educational-content-workflow",
  description: "Improved autonomous system that creates comprehensive educational content with chunked generation and progress tracking",
  inputSchema: z.object({}), // Empty for time-based workflows
  outputSchema: z.object({
    success: z.boolean(),
    workflowId: z.string(),
    topic: z.string(),
    bookGenerated: z.boolean(),
    finalWordCount: z.number(),
    qualityScore: z.number(),
    completedAt: z.string(),
    bookPath: z.string().optional(),
  }),
})
  .then(initializeAndPlanStep)
  .then(generateAllContentStep)
  .then(reviewContentStep)
  .then(generateFinalPDFStep)
  .commit();