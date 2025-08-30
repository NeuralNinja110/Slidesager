import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import multer, { FileFilterCallback } from "multer";
import { storage } from "./storage";
import { llmService } from "./services/llm";
import { templateAnalyzer } from "./services/templateAnalyzer";
import { marpService } from "./services/marp";
import { LLMProvider, Model, insertPresentationSchema } from "@shared/schema";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.presentationml.presentation", // .pptx
      "application/vnd.openxmlformats-officedocument.presentationml.template", // .potx
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only .pptx and .potx files are allowed."));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Generate presentation
  app.post("/api/presentations/generate", upload.single("template"), async (req, res) => {
    try {
      const { content, guidance, llmProvider, model, apiKey, slideCountOption } = req.body;
      
      if (!content || !llmProvider || !model || !apiKey) {
        return res.status(400).json({ 
          error: "Missing required fields: content, llmProvider, model, apiKey" 
        });
      }

      // Analyze template if provided
      let templateStyles;
      if (req.file) {
        templateStyles = await templateAnalyzer.analyzeTemplate(req.file.buffer);
      } else {
        // Default template styles
        templateStyles = {
          colors: {
            primary: "#2563eb",
            secondary: "#7c3aed", 
            background: "#ffffff",
            text: "#1f2937",
          },
          fonts: {
            title: "Inter, sans-serif",
            body: "Inter, sans-serif",
          },
          layouts: ["title", "content", "image"],
          images: [],
        };
      }

      // Generate slides using LLM
      const slides = await llmService.generateSlides(
        content,
        guidance,
        llmProvider as LLMProvider,
        model as Model,
        apiKey,
        slideCountOption || "automatic"
      );

      // Generate Marp content
      const title = slides[0]?.title || "Generated Presentation";
      const marpContent = await marpService.generatePresentation(slides, templateStyles, title);

      // Save presentation
      const presentation = await storage.createPresentation({
        title,
        content,
        guidance: guidance || null,
        llmProvider: llmProvider as LLMProvider,
        model: model as Model,
        slideCount: slides.length,
        templateStyles,
        marpContent,
      });

      res.json({
        id: presentation.id,
        title: presentation.title,
        slideCount: presentation.slideCount,
        slides,
        marpContent,
        createdAt: presentation.createdAt,
      });

    } catch (error) {
      console.error("Generation error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to generate presentation" 
      });
    }
  });

  // Get presentation preview (HTML)
  app.get("/api/presentations/:id/preview", async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`Generating preview for presentation: ${id}`);
      
      const presentation = await storage.getPresentation(id);
      
      if (!presentation) {
        console.log(`Presentation not found: ${id}`);
        return res.status(404).json({ error: "Presentation not found" });
      }

      console.log(`Found presentation: ${presentation.title}`);
      console.log(`Marp content length: ${presentation.marpContent.length}`);

      const htmlContent = await marpService.generateHTML(presentation.marpContent);
      console.log(`Generated HTML preview, length: ${htmlContent.length}`);
      
      res.setHeader("Content-Type", "text/html");
      res.setHeader("X-Frame-Options", "SAMEORIGIN");
      res.send(htmlContent);

    } catch (error) {
      console.error("Preview error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to generate preview" 
      });
    }
  });

  // Download presentation as PPTX
  app.post("/api/presentations/:id/download/pptx", async (req, res) => {
    try {
      const { id } = req.params;
      const { slideRanges } = req.body;
      
      const presentation = await storage.getPresentation(id);
      if (!presentation) {
        return res.status(404).json({ error: "Presentation not found" });
      }

      const ranges = slideRanges ? marpService.parseSlideRanges(slideRanges) : undefined;
      const pptxBuffer = await marpService.generatePPTX(presentation.marpContent, ranges);

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.presentationml.presentation");
      res.setHeader("Content-Disposition", `attachment; filename="${presentation.title}.pptx"`);
      res.send(pptxBuffer);

    } catch (error) {
      console.error("PPTX download error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to generate PPTX" 
      });
    }
  });

  // Download presentation as PDF
  app.post("/api/presentations/:id/download/pdf", async (req, res) => {
    try {
      const { id } = req.params;
      const { slideRanges } = req.body;
      
      const presentation = await storage.getPresentation(id);
      if (!presentation) {
        return res.status(404).json({ error: "Presentation not found" });
      }

      const ranges = slideRanges ? marpService.parseSlideRanges(slideRanges) : undefined;
      const pdfBuffer = await marpService.generatePDF(presentation.marpContent, ranges);

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${presentation.title}.pdf"`);
      res.send(pdfBuffer);

    } catch (error) {
      console.error("PDF download error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to generate PDF" 
      });
    }
  });

  // Get recent presentations
  app.get("/api/presentations", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const presentations = await storage.getUserPresentations(limit);
      res.json(presentations);
    } catch (error) {
      console.error("Fetch presentations error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to fetch presentations" 
      });
    }
  });

  // Get specific presentation
  app.get("/api/presentations/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const presentation = await storage.getPresentation(id);
      
      if (!presentation) {
        return res.status(404).json({ error: "Presentation not found" });
      }

      res.json(presentation);
    } catch (error) {
      console.error("Get presentation error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to fetch presentation" 
      });
    }
  });

  // Delete presentation
  app.delete("/api/presentations/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deletePresentation(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Presentation not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Delete presentation error:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to delete presentation" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
