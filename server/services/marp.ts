import { spawn } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import { SlideContent, TemplateStyles, SlideRange } from "@shared/schema";

export class MarpService {
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
