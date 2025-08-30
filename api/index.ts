import express, { type Request, Response, NextFunction } from "express";
import type { Express } from "express";
import multer, { FileFilterCallback } from "multer";
import { storage } from "../server/storage";
import { llmService } from "../server/services/llm";
import { templateAnalyzer } from "../server/services/templateAnalyzer";
import { marpService } from "../server/services/marp";
import { LLMProvider, Model } from "../shared/schema";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// CORS middleware for Vercel
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      console.log(`[${new Date().toISOString()}] ${logLine}`);
    }
  });

  next();
});

// Register all API routes inline for serverless deployment
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

// Error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  
  console.error('Server Error:', err);
  res.status(status).json({ message });
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Environment info endpoint  
app.get('/api/environment', (_req, res) => {
  const isServerless = Boolean(
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.NETLIFY ||
    process.env.RAILWAY_PROJECT_ID ||
    process.env.CF_PAGES ||
    process.env.FUNCTIONS_WORKER_RUNTIME ||
    process.env.NODE_ENV === 'production' && !process.env.PORT
  );
  
  res.json({ 
    isServerless,
    supportsFileGeneration: !isServerless 
  });
});

// For Vercel serverless function
export default function handler(req: any, res: any) {
  return app(req, res);
}
