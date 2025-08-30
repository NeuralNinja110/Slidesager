import { spawn } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import { SlideContent, TemplateStyles, SlideRange } from "@shared/schema";

export class MarpService {
  private isServerlessEnvironment(): boolean {
    // Check for common serverless environment variables
    return Boolean(
      process.env.VERCEL ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.NETLIFY ||
      process.env.RAILWAY_PROJECT_ID ||
      process.env.CF_PAGES ||
      process.env.FUNCTIONS_WORKER_RUNTIME ||
      // Generic serverless indicators
      process.env.NODE_ENV === 'production' && !process.env.PORT
    );
  }

  private generateStaticHTML(marpContent: string): string {
    // Generate a simple HTML presentation without Marp CLI
    // This is a fallback for serverless environments
    const lines = marpContent.split('\n');
    const slides: string[] = [];
    let currentSlide = '';
    let isInSlide = false;

    for (const line of lines) {
      if (line.trim() === '---' && isInSlide) {
        slides.push(currentSlide);
        currentSlide = '';
      } else if (line.trim().startsWith('# ')) {
        if (currentSlide) slides.push(currentSlide);
        currentSlide = `<section><h1>${line.replace('# ', '')}</h1>`;
        isInSlide = true;
      } else if (isInSlide && line.trim()) {
        if (line.startsWith('<!--') && line.endsWith('-->')) {
          // Skip comments (speaker notes)
          continue;
        }
        currentSlide += `<p>${line}</p>`;
      }
    }
    
    if (currentSlide) slides.push(currentSlide + '</section>');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Generated Presentation</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; background: #f0f0f0; }
        .presentation { display: flex; flex-direction: column; min-height: 100vh; }
        section { 
            min-height: 100vh; 
            padding: 60px; 
            background: white; 
            margin-bottom: 20px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            display: flex;
            flex-direction: column;
            justify-content: center;
        }
        h1 { font-size: 2.5em; margin-bottom: 30px; color: #333; }
        p { font-size: 1.2em; line-height: 1.6; color: #555; }
        @media print { 
            section { page-break-after: always; margin-bottom: 0; box-shadow: none; } 
            body { background: white; }
        }
    </style>
</head>
<body>
    <div class="presentation">
        ${slides.join('\n        ')}
    </div>
</body>
</html>
`;
  }
  async generatePresentation(
    slides: SlideContent[],
    styles: TemplateStyles,
    title: string
  ): Promise<string> {
    const marpContent = this.buildMarpContent(slides, styles, title);
    return marpContent;
  }

  private buildMarpContent(slides: SlideContent[], styles: TemplateStyles, title: string): string {
    const theme = this.generateTheme(styles);
    
    let marpContent = `---
marp: true
theme: custom
paginate: true
title: ${title}
---

<style>
${theme}
</style>

`;

    slides.forEach((slide, index) => {
      if (index > 0) marpContent += "\n---\n\n";
      
      marpContent += `# ${slide.title}\n\n`;
      marpContent += `${slide.content}\n`;
      
      if (slide.notes) {
        marpContent += `\n<!-- ${slide.notes} -->\n`;
      }
    });

    return marpContent;
  }

  private generateTheme(styles: TemplateStyles): string {
    return `
section {
  background: ${styles.colors.background};
  color: ${styles.colors.text};
  font-family: ${styles.fonts.body};
}

h1, h2, h3, h4, h5, h6 {
  color: ${styles.colors.primary};
  font-family: ${styles.fonts.title};
}

a {
  color: ${styles.colors.secondary};
}

blockquote {
  border-left: 4px solid ${styles.colors.primary};
  background: rgba(0, 0, 0, 0.05);
}
`;
  }

  async generateHTML(marpContent: string): Promise<string> {
    // Check if we're in a serverless environment
    if (this.isServerlessEnvironment()) {
      console.log("Generating HTML in serverless mode (no external CLI)");
      return this.generateStaticHTML(marpContent);
    }

    return new Promise((resolve, reject) => {
      const tempDir = path.join(process.cwd(), "temp");
      const timestamp = Date.now();
      const inputFile = path.join(tempDir, `presentation-${timestamp}.md`);
      const outputFile = path.join(tempDir, `presentation-${timestamp}.html`);

      console.log(`Generating HTML with Marp CLI: ${inputFile} -> ${outputFile}`);

      // Ensure temp directory exists
      fs.mkdir(tempDir, { recursive: true }).then(() => {
        // Write Marp content to file
        console.log(`Writing ${marpContent.length} characters to ${inputFile}`);
        return fs.writeFile(inputFile, marpContent);
      }).then(() => {
        // Run Marp CLI
        console.log('Running Marp CLI for HTML generation...');
        const marp = spawn("npx", ["@marp-team/marp-cli", inputFile, "-o", outputFile, "--html"], {
          stdio: ['ignore', 'pipe', 'pipe']
        });
        
        let stdout = '';
        let stderr = '';
        
        marp.stdout?.on('data', (data) => {
          stdout += data.toString();
        });
        
        marp.stderr?.on('data', (data) => {
          stderr += data.toString();
        });
        
        marp.on("close", async (code) => {
          console.log(`Marp CLI finished with code: ${code}`);
          if (stdout) console.log('Marp stdout:', stdout);
          if (stderr) console.log('Marp stderr:', stderr);
          
          if (code === 0) {
            try {
              const htmlContent = await fs.readFile(outputFile, "utf-8");
              console.log(`Generated HTML file size: ${htmlContent.length} characters`);
              
              // Cleanup temp files
              fs.unlink(inputFile).catch(console.error);
              fs.unlink(outputFile).catch(console.error);
              resolve(htmlContent);
            } catch (error) {
              console.error('Error reading HTML output:', error);
              reject(error);
            }
          } else {
            reject(new Error(`Marp CLI exited with code ${code}. Stderr: ${stderr}`));
          }
        });

        marp.on("error", (error) => {
          console.error('Marp CLI spawn error:', error);
          reject(error);
        });
      }).catch((error) => {
        console.error('Error setting up Marp generation:', error);
        reject(error);
      });
    });
  }

  async generatePPTX(marpContent: string, slideRanges?: SlideRange[]): Promise<Buffer> {
    if (this.isServerlessEnvironment()) {
      throw new Error("PPTX generation is not available in serverless environments. Please download the presentation as HTML or use a local development environment for PPTX export.");
    }

    return new Promise((resolve, reject) => {
      const tempDir = path.join(process.cwd(), "temp");
      const timestamp = Date.now();
      const inputFile = path.join(tempDir, `presentation-${timestamp}.md`);
      const outputFile = path.join(tempDir, `presentation-${timestamp}.pptx`);

      // Filter slides if ranges specified
      let filteredContent = marpContent;
      if (slideRanges && slideRanges.length > 0) {
        filteredContent = this.filterSlidesByRange(marpContent, slideRanges);
      }

      console.log(`Generating PPTX with Marp CLI: ${inputFile} -> ${outputFile}`);

      fs.mkdir(tempDir, { recursive: true }).then(() => {
        return fs.writeFile(inputFile, filteredContent);
      }).then(() => {
        console.log('Running Marp CLI for PPTX generation...');
        const marp = spawn("npx", ["@marp-team/marp-cli", inputFile, "-o", outputFile, "--pptx"], {
          stdio: ['ignore', 'pipe', 'pipe']
        });
        
        let stdout = '';
        let stderr = '';
        
        marp.stdout?.on('data', (data) => {
          stdout += data.toString();
        });
        
        marp.stderr?.on('data', (data) => {
          stderr += data.toString();
        });
        
        marp.on("close", async (code) => {
          console.log(`Marp CLI PPTX finished with code: ${code}`);
          if (stdout) console.log('Marp stdout:', stdout);
          if (stderr) console.log('Marp stderr:', stderr);
          
          if (code === 0) {
            try {
              const pptxBuffer = await fs.readFile(outputFile);
              console.log(`Generated PPTX file size: ${pptxBuffer.length} bytes`);
              
              // Cleanup temp files
              fs.unlink(inputFile).catch(console.error);
              fs.unlink(outputFile).catch(console.error);
              resolve(pptxBuffer);
            } catch (error) {
              console.error('Error reading PPTX output:', error);
              reject(error);
            }
          } else {
            reject(new Error(`Marp CLI exited with code ${code}. Stderr: ${stderr}`));
          }
        });

        marp.on("error", (error) => {
          console.error('Marp CLI PPTX spawn error:', error);
          reject(error);
        });
      }).catch((error) => {
        console.error('Error setting up PPTX generation:', error);
        reject(error);
      });
    });
  }

  async generatePDF(marpContent: string, slideRanges?: SlideRange[]): Promise<Buffer> {
    if (this.isServerlessEnvironment()) {
      throw new Error("PDF generation is not available in serverless environments. Please download the presentation as HTML or use a local development environment for PDF export.");
    }

    return new Promise((resolve, reject) => {
      const tempDir = path.join(process.cwd(), "temp");
      const timestamp = Date.now();
      const inputFile = path.join(tempDir, `presentation-${timestamp}.md`);
      const outputFile = path.join(tempDir, `presentation-${timestamp}.pdf`);

      // Filter slides if ranges specified
      let filteredContent = marpContent;
      if (slideRanges && slideRanges.length > 0) {
        filteredContent = this.filterSlidesByRange(marpContent, slideRanges);
      }

      console.log(`Generating PDF with Marp CLI: ${inputFile} -> ${outputFile}`);

      fs.mkdir(tempDir, { recursive: true }).then(() => {
        return fs.writeFile(inputFile, filteredContent);
      }).then(() => {
        console.log('Running Marp CLI for PDF generation...');
        const marp = spawn("npx", ["@marp-team/marp-cli", inputFile, "-o", outputFile, "--pdf"], {
          stdio: ['ignore', 'pipe', 'pipe']
        });
        
        let stdout = '';
        let stderr = '';
        
        marp.stdout?.on('data', (data) => {
          stdout += data.toString();
        });
        
        marp.stderr?.on('data', (data) => {
          stderr += data.toString();
        });
        
        marp.on("close", async (code) => {
          console.log(`Marp CLI PDF finished with code: ${code}`);
          if (stdout) console.log('Marp stdout:', stdout);
          if (stderr) console.log('Marp stderr:', stderr);
          
          if (code === 0) {
            try {
              const pdfBuffer = await fs.readFile(outputFile);
              console.log(`Generated PDF file size: ${pdfBuffer.length} bytes`);
              
              // Cleanup temp files
              fs.unlink(inputFile).catch(console.error);
              fs.unlink(outputFile).catch(console.error);
              resolve(pdfBuffer);
            } catch (error) {
              console.error('Error reading PDF output:', error);
              reject(error);
            }
          } else {
            reject(new Error(`Marp CLI exited with code ${code}. Stderr: ${stderr}`));
          }
        });

        marp.on("error", (error) => {
          console.error('Marp CLI PDF spawn error:', error);
          reject(error);
        });
      }).catch((error) => {
        console.error('Error setting up PDF generation:', error);
        reject(error);
      });
    });
  }

  private filterSlidesByRange(marpContent: string, ranges: SlideRange[]): string {
    const slides = marpContent.split("---").map(s => s.trim()).filter(s => s.length > 0);
    const header = slides[0]; // Contains marp config and styles
    const slideContents = slides.slice(1);

    const selectedSlides = new Set<number>();
    ranges.forEach(range => {
      for (let i = range.start; i <= range.end; i++) {
        if (i > 0 && i <= slideContents.length) {
          selectedSlides.add(i - 1); // Convert to 0-based index
        }
      }
    });

    const filteredSlides = Array.from(selectedSlides)
      .sort((a, b) => a - b)
      .map(index => slideContents[index]);

    return [header, ...filteredSlides].join("\n\n---\n\n");
  }

  parseSlideRanges(rangeString: string): SlideRange[] {
    if (!rangeString.trim()) return [];
    
    const ranges: SlideRange[] = [];
    const parts = rangeString.split(",").map(s => s.trim());
    
    for (const part of parts) {
      if (part.includes("-")) {
        const [start, end] = part.split("-").map(s => parseInt(s.trim()));
        if (!isNaN(start) && !isNaN(end) && start <= end) {
          ranges.push({ start, end });
        }
      } else {
        const num = parseInt(part);
        if (!isNaN(num)) {
          ranges.push({ start: num, end: num });
        }
      }
    }
    
    return ranges;
  }
}

export const marpService = new MarpService();
