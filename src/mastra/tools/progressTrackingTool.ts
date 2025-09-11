import { createTool } from "@mastra/core/tools";
import type { IMastraLogger } from "@mastra/core/logger";
import { z } from "zod";
import { writeFileSync, readFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

interface ProgressData {
  workflowId: string;
  topic: string;
  startTime: string;
  currentStep: string;
  completedChapters: number;
  totalChapters: number;
  completedSections: number;
  totalSections: number;
  totalWordsGenerated: number;
  targetWordCount: number;
  lastUpdate: string;
  status: 'in_progress' | 'completed' | 'failed' | 'paused';
  errors: string[];
  completedChapterDetails: Array<{
    chapterNumber: number;
    title: string;
    wordCount: number;
    completedAt: string;
  }>;
}

const getProgressFilePath = (workflowId: string): string => {
  const progressDir = join(process.cwd(), 'workflow_progress');
  mkdirSync(progressDir, { recursive: true });
  return join(progressDir, `${workflowId}_progress.json`);
};

const loadProgress = (workflowId: string): ProgressData | null => {
  const progressPath = getProgressFilePath(workflowId);
  
  if (!existsSync(progressPath)) {
    return null;
  }
  
  try {
    const data = readFileSync(progressPath, 'utf8');
    return JSON.parse(data) as ProgressData;
  } catch (error) {
    return null;
  }
};

const saveProgress = (workflowId: string, progress: ProgressData): void => {
  const progressPath = getProgressFilePath(workflowId);
  writeFileSync(progressPath, JSON.stringify(progress, null, 2), 'utf8');
};

export const progressTrackingTool = createTool({
  id: "progress-tracking-tool",
  description: `Tracks and persists progress for long-running educational content generation workflows`,
  inputSchema: z.object({
    action: z.enum(['initialize', 'update', 'get', 'complete', 'fail']).describe("Action to perform"),
    workflowId: z.string().describe("Unique identifier for the workflow run"),
    
    // For initialization
    topic: z.string().optional().describe("Educational topic (required for initialization)"),
    totalChapters: z.number().optional().describe("Total number of chapters (required for initialization)"),
    totalSections: z.number().optional().describe("Total number of sections across all chapters"),
    targetWordCount: z.number().optional().describe("Target total word count"),
    
    // For updates
    currentStep: z.string().optional().describe("Current step being executed"),
    completedChapters: z.number().optional().describe("Number of completed chapters"),
    completedSections: z.number().optional().describe("Number of completed sections"),
    totalWordsGenerated: z.number().optional().describe("Total words generated so far"),
    chapterCompleted: z.object({
      chapterNumber: z.number(),
      title: z.string(),
      wordCount: z.number(),
    }).optional().describe("Details of a completed chapter"),
    
    // For errors
    error: z.string().optional().describe("Error message to record"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    progress: z.object({
      workflowId: z.string(),
      topic: z.string(),
      currentStep: z.string(),
      completedChapters: z.number(),
      totalChapters: z.number(),
      completedSections: z.number(),
      totalSections: z.number(),
      totalWordsGenerated: z.number(),
      targetWordCount: z.number(),
      progressPercentage: z.number(),
      estimatedTimeRemaining: z.string(),
      status: z.string(),
      lastUpdate: z.string(),
    }).optional(),
    message: z.string().optional(),
  }),
  execute: async ({ context, mastra }) => {
    const logger = mastra?.getLogger();
    const { action, workflowId } = context;
    
    logger?.info("📊 [ProgressTracking] Starting execution", { action, workflowId });

    try {
      if (action === 'initialize') {
        if (!context.topic || !context.totalChapters || !context.totalSections || !context.targetWordCount) {
          throw new Error("Topic, totalChapters, totalSections, and targetWordCount are required for initialization");
        }

        const progress: ProgressData = {
          workflowId,
          topic: context.topic,
          startTime: new Date().toISOString(),
          currentStep: 'Initializing',
          completedChapters: 0,
          totalChapters: context.totalChapters,
          completedSections: 0,
          totalSections: context.totalSections,
          totalWordsGenerated: 0,
          targetWordCount: context.targetWordCount,
          lastUpdate: new Date().toISOString(),
          status: 'in_progress',
          errors: [],
          completedChapterDetails: [],
        };

        saveProgress(workflowId, progress);
        
        logger?.info("✅ [ProgressTracking] Progress initialized", { 
          workflowId, 
          topic: context.topic,
          totalChapters: context.totalChapters 
        });

        return {
          success: true,
          progress: {
            workflowId: progress.workflowId,
            topic: progress.topic,
            currentStep: progress.currentStep,
            completedChapters: progress.completedChapters,
            totalChapters: progress.totalChapters,
            completedSections: progress.completedSections,
            totalSections: progress.totalSections,
            totalWordsGenerated: progress.totalWordsGenerated,
            targetWordCount: progress.targetWordCount,
            progressPercentage: 0,
            estimatedTimeRemaining: "Calculating...",
            status: progress.status,
            lastUpdate: progress.lastUpdate,
          },
          message: "Progress tracking initialized"
        };
      }

      // Load existing progress
      const progress = loadProgress(workflowId);
      if (!progress) {
        throw new Error(`No progress found for workflow ${workflowId}`);
      }

      if (action === 'update') {
        // Update progress fields
        if (context.currentStep) progress.currentStep = context.currentStep;
        if (context.completedChapters !== undefined) progress.completedChapters = context.completedChapters;
        if (context.completedSections !== undefined) progress.completedSections = context.completedSections;
        if (context.totalWordsGenerated !== undefined) progress.totalWordsGenerated = context.totalWordsGenerated;
        if (context.error) progress.errors.push(`${new Date().toISOString()}: ${context.error}`);
        
        if (context.chapterCompleted) {
          progress.completedChapterDetails.push({
            ...context.chapterCompleted,
            completedAt: new Date().toISOString(),
          });
        }

        progress.lastUpdate = new Date().toISOString();
        saveProgress(workflowId, progress);

        logger?.info("📈 [ProgressTracking] Progress updated", {
          workflowId,
          completedChapters: progress.completedChapters,
          totalWordsGenerated: progress.totalWordsGenerated,
        });

      } else if (action === 'complete') {
        progress.status = 'completed';
        progress.currentStep = 'Completed';
        progress.lastUpdate = new Date().toISOString();
        saveProgress(workflowId, progress);

        logger?.info("🎉 [ProgressTracking] Workflow completed", { workflowId });

      } else if (action === 'fail') {
        progress.status = 'failed';
        progress.currentStep = 'Failed';
        if (context.error) progress.errors.push(`${new Date().toISOString()}: ${context.error}`);
        progress.lastUpdate = new Date().toISOString();
        saveProgress(workflowId, progress);

        logger?.error("❌ [ProgressTracking] Workflow failed", { workflowId, error: context.error });
      }

      // Calculate progress percentage and estimated time
      const sectionProgress = progress.totalSections > 0 ? (progress.completedSections / progress.totalSections) * 100 : 0;
      const wordProgress = progress.targetWordCount > 0 ? (progress.totalWordsGenerated / progress.targetWordCount) * 100 : 0;
      const progressPercentage = Math.round(Math.max(sectionProgress, wordProgress));

      // Estimate time remaining based on completed sections
      let estimatedTimeRemaining = "Calculating...";
      if (progress.completedSections > 0) {
        const startTime = new Date(progress.startTime).getTime();
        const currentTime = new Date().getTime();
        const elapsedMs = currentTime - startTime;
        const avgTimePerSection = elapsedMs / progress.completedSections;
        const remainingSections = progress.totalSections - progress.completedSections;
        const remainingMs = avgTimePerSection * remainingSections;
        
        const hours = Math.floor(remainingMs / (1000 * 60 * 60));
        const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 0) {
          estimatedTimeRemaining = `${hours}h ${minutes}m`;
        } else {
          estimatedTimeRemaining = `${minutes}m`;
        }
      }

      return {
        success: true,
        progress: {
          workflowId: progress.workflowId,
          topic: progress.topic,
          currentStep: progress.currentStep,
          completedChapters: progress.completedChapters,
          totalChapters: progress.totalChapters,
          completedSections: progress.completedSections,
          totalSections: progress.totalSections,
          totalWordsGenerated: progress.totalWordsGenerated,
          targetWordCount: progress.targetWordCount,
          progressPercentage,
          estimatedTimeRemaining,
          status: progress.status,
          lastUpdate: progress.lastUpdate,
        },
        message: `Progress ${action} completed successfully`
      };

    } catch (error) {
      logger?.error("❌ [ProgressTracking] Error", {
        workflowId,
        action,
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        success: false,
        message: `Progress tracking failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  },
});