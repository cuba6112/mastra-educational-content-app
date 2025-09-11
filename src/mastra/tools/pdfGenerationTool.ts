import { createTool } from "@mastra/core/tools";
import type { IMastraLogger } from "@mastra/core/logger";
import { z } from "zod";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

interface Chapter {
  title: string;
  content: string;
}

interface BookContent {
  title: string;
  subtitle?: string;
  author: string;
  chapters: Chapter[];
}

const generatePDF = async ({
  bookContent,
  logger,
}: {
  bookContent: BookContent;
  logger?: IMastraLogger;
}) => {
  logger?.info("📖 [PDFGeneration] Starting PDF generation", { 
    title: bookContent.title,
    chapterCount: bookContent.chapters.length 
  });

  try {
    // Create output directory if it doesn't exist
    const outputDir = join(process.cwd(), 'generated_books');
    mkdirSync(outputDir, { recursive: true });

    // Generate HTML content for the book
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${bookContent.title}</title>
    <style>
        body {
            font-family: 'Times New Roman', serif;
            line-height: 1.6;
            margin: 0;
            padding: 40px;
            background-color: #fff;
            color: #333;
        }
        .title-page {
            text-align: center;
            page-break-after: always;
            margin-bottom: 100px;
        }
        .book-title {
            font-size: 3em;
            font-weight: bold;
            margin-bottom: 20px;
            color: #2c3e50;
        }
        .book-subtitle {
            font-size: 1.5em;
            margin-bottom: 40px;
            color: #7f8c8d;
        }
        .book-author {
            font-size: 1.2em;
            margin-top: 60px;
            color: #34495e;
        }
        .chapter {
            page-break-before: always;
            margin-bottom: 50px;
        }
        .chapter-title {
            font-size: 2.2em;
            font-weight: bold;
            margin-bottom: 30px;
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
        }
        .chapter-content {
            font-size: 1.1em;
            text-align: justify;
            margin-bottom: 20px;
        }
        .toc {
            page-break-after: always;
            margin-bottom: 50px;
        }
        .toc-title {
            font-size: 2em;
            font-weight: bold;
            margin-bottom: 30px;
            color: #2c3e50;
        }
        .toc-item {
            margin-bottom: 10px;
            font-size: 1.1em;
        }
        @media print {
            body { margin: 0; }
            .chapter { page-break-before: always; }
        }
    </style>
</head>
<body>
    <!-- Title Page -->
    <div class="title-page">
        <h1 class="book-title">${bookContent.title}</h1>
        ${bookContent.subtitle ? `<h2 class="book-subtitle">${bookContent.subtitle}</h2>` : ''}
        <p class="book-author">by ${bookContent.author}</p>
    </div>

    <!-- Table of Contents -->
    <div class="toc">
        <h2 class="toc-title">Table of Contents</h2>
        ${bookContent.chapters.map((chapter, index) => 
          `<div class="toc-item">Chapter ${index + 1}: ${chapter.title}</div>`
        ).join('')}
    </div>

    <!-- Chapters -->
    ${bookContent.chapters.map((chapter, index) => `
    <div class="chapter">
        <h1 class="chapter-title">Chapter ${index + 1}: ${chapter.title}</h1>
        <div class="chapter-content">
            ${chapter.content.split('\n').map(paragraph => 
              paragraph.trim() ? `<p>${paragraph.trim()}</p>` : ''
            ).join('')}
        </div>
    </div>
    `).join('')}
</body>
</html>`;

    // Save HTML file
    const sanitizedTitle = bookContent.title.replace(/[^a-zA-Z0-9]/g, '_');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${sanitizedTitle}_${timestamp}`;
    const htmlPath = join(outputDir, `${filename}.html`);
    
    writeFileSync(htmlPath, htmlContent, 'utf8');

    logger?.info("📄 [PDFGeneration] HTML file generated successfully", { 
      path: htmlPath,
      fileSize: htmlContent.length 
    });

    // For now, we're generating HTML. In a production environment,
    // you could use tools like Puppeteer or WeasyPrint to convert to PDF
    return {
      title: bookContent.title,
      format: 'html',
      path: htmlPath,
      fileSize: htmlContent.length,
      chapterCount: bookContent.chapters.length,
      generatedAt: new Date().toISOString(),
    };
  } catch (error) {
    logger?.error("❌ [PDFGeneration] Error generating PDF", {
      title: bookContent.title,
      error: error instanceof Error ? error.message : String(error),
    });
    
    throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : String(error)}`);
  }
};

export const pdfGenerationTool = createTool({
  id: "pdf-generation-tool",
  description: `Generates professional PDF books from structured content with chapters, formatting, and table of contents`,
  inputSchema: z.object({
    title: z.string().describe("The main title of the book"),
    subtitle: z.string().optional().describe("Optional subtitle for the book"),
    author: z.string().describe("The author name to display"),
    chapters: z.array(z.object({
      title: z.string().describe("Chapter title"),
      content: z.string().describe("Chapter content in plain text"),
    })).describe("Array of chapters with titles and content"),
  }),
  outputSchema: z.object({
    title: z.string(),
    format: z.string(),
    path: z.string(),
    fileSize: z.number(),
    chapterCount: z.number(),
    generatedAt: z.string(),
  }),
  execute: async ({ context, mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info("🔧 [PDFGeneration] Starting execution", { 
      title: context.title,
      chapterCount: context.chapters.length 
    });
    
    const bookContent: BookContent = {
      title: context.title,
      subtitle: context.subtitle,
      author: context.author,
      chapters: context.chapters,
    };
    
    const result = await generatePDF({ bookContent, logger });
    
    logger?.info("✅ [PDFGeneration] Completed successfully", { 
      path: result.path,
      fileSize: result.fileSize,
    });
    
    return result;
  },
});