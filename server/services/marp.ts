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
      const inputFile = path.join(tempDir, `presentation-${Date.now()}.md`);
      const outputFile = path.join(tempDir, `presentation-${Date.now()}.html`);

      // Ensure temp directory exists
      fs.mkdir(tempDir, { recursive: true }).then(() => {
        // Write Marp content to file
        return fs.writeFile(inputFile, marpContent);
      }).then(() => {
        // Run Marp CLI
        const marp = spawn("npx", ["@marp-team/marp-cli", inputFile, "-o", outputFile, "--html"]);
        
        marp.on("close", async (code) => {
          if (code === 0) {
            try {
              const htmlContent = await fs.readFile(outputFile, "utf-8");
              // Cleanup temp files
              fs.unlink(inputFile).catch(console.error);
              fs.unlink(outputFile).catch(console.error);
              resolve(htmlContent);
            } catch (error) {
              reject(error);
            }
          } else {
            reject(new Error(`Marp CLI exited with code ${code}`));
          }
        });

        marp.on("error", reject);
      }).catch(reject);
    });
  }

  async generatePPTX(marpContent: string, slideRanges?: SlideRange[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const tempDir = path.join(process.cwd(), "temp");
      const inputFile = path.join(tempDir, `presentation-${Date.now()}.md`);
      const outputFile = path.join(tempDir, `presentation-${Date.now()}.pptx`);

      // Filter slides if ranges specified
      let filteredContent = marpContent;
      if (slideRanges && slideRanges.length > 0) {
        filteredContent = this.filterSlidesByRange(marpContent, slideRanges);
      }

      fs.mkdir(tempDir, { recursive: true }).then(() => {
        return fs.writeFile(inputFile, filteredContent);
      }).then(() => {
        const marp = spawn("npx", ["@marp-team/marp-cli", inputFile, "-o", outputFile, "--pptx"]);
        
        marp.on("close", async (code) => {
          if (code === 0) {
            try {
              const pptxBuffer = await fs.readFile(outputFile);
              // Cleanup temp files
              fs.unlink(inputFile).catch(console.error);
              fs.unlink(outputFile).catch(console.error);
              resolve(pptxBuffer);
            } catch (error) {
              reject(error);
            }
          } else {
            reject(new Error(`Marp CLI exited with code ${code}`));
          }
        });

        marp.on("error", reject);
      }).catch(reject);
    });
  }

  async generatePDF(marpContent: string, slideRanges?: SlideRange[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const tempDir = path.join(process.cwd(), "temp");
      const inputFile = path.join(tempDir, `presentation-${Date.now()}.md`);
      const outputFile = path.join(tempDir, `presentation-${Date.now()}.pdf`);

      // Filter slides if ranges specified
      let filteredContent = marpContent;
      if (slideRanges && slideRanges.length > 0) {
        filteredContent = this.filterSlidesByRange(marpContent, slideRanges);
      }

      fs.mkdir(tempDir, { recursive: true }).then(() => {
        return fs.writeFile(inputFile, filteredContent);
      }).then(() => {
        const marp = spawn("npx", ["@marp-team/marp-cli", inputFile, "-o", outputFile, "--pdf"]);
        
        marp.on("close", async (code) => {
          if (code === 0) {
            try {
              const pdfBuffer = await fs.readFile(outputFile);
              // Cleanup temp files
              fs.unlink(inputFile).catch(console.error);
              fs.unlink(outputFile).catch(console.error);
              resolve(pdfBuffer);
            } catch (error) {
              reject(error);
            }
          } else {
            reject(new Error(`Marp CLI exited with code ${code}`));
          }
        });

        marp.on("error", reject);
      }).catch(reject);
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
