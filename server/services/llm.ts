import OpenAI from "openai";
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenAI } from "@google/genai";
import { LLMProvider, Model, SlideContent, SlideCountOption } from "@shared/schema";

export class LLMService {
  async generateSlides(
    content: string,
    guidance: string | undefined,
    provider: LLMProvider,
    model: Model,
    apiKey: string,
    slideCountOption: SlideCountOption = "automatic"
  ): Promise<SlideContent[]> {
    const prompt = this.buildPrompt(content, guidance, slideCountOption);
    
    switch (provider) {
      case "openai":
        return this.generateWithOpenAI(prompt, model, apiKey);
      case "anthropic":
        return this.generateWithAnthropic(prompt, model, apiKey);
      case "gemini":
        return this.generateWithGemini(prompt, model, apiKey);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  private extractJsonFromText(text: string): string {
    // Remove any markdown code block formatting
    let cleanText = text.replace(/```json\n?|```\n?/g, '').trim();
    
    // Try to find JSON array in the text
    const jsonArrayRegex = /\[[\s\S]*?\]/;
    const match = cleanText.match(jsonArrayRegex);
    
    if (match) {
      return match[0];
    }
    
    // If no array found, try to find JSON object with slides property
    const jsonObjectWithSlidesRegex = /\{\s*"slides"\s*:\s*\[[\s\S]*?\]\s*\}/;
    const slidesMatch = cleanText.match(jsonObjectWithSlidesRegex);
    
    if (slidesMatch) {
      return slidesMatch[0];
    }
    
    // Try to find any JSON object
    const jsonObjectRegex = /\{[\s\S]*?\}/;
    const objectMatch = cleanText.match(jsonObjectRegex);
    
    if (objectMatch) {
      return objectMatch[0];
    }
    
    // Return cleaned text if no JSON pattern found
    return cleanText;
  }

  private buildPrompt(content: string, guidance?: string, slideCountOption: SlideCountOption = "automatic"): string {
    const basePrompt = `
Analyze the following text and break it down into slide content for a presentation.

Content:
${content}

${guidance ? `Guidance: ${guidance}` : ''}

Please structure the output as a JSON array of slide objects. Each slide should have:
- title: The slide title (string)
- content: Main content points in markdown format (string)
- layout: Suggested layout type (string: "title", "content", "image", etc.)
- notes: Optional speaker notes (string, can be empty)

Ensure the slides flow logically and are appropriate for the content type and guidance provided.
${this.getSlideCountInstruction(slideCountOption)}

IMPORTANT: Return ONLY a valid JSON array with no additional text, comments, or formatting. Example format:
[
  {
    "title": "Introduction",
    "content": "- Welcome to the presentation\\n- Overview of topics",
    "layout": "title",
    "notes": "Start with enthusiasm"
  }
]

Do not include any text before or after the JSON array.
`;
    return basePrompt;
  }

  private getSlideCountInstruction(slideCountOption: SlideCountOption): string {
    switch (slideCountOption) {
      case "2-5":
        return "Create between 2-5 slides. Keep content concise and focused.";
      case "5-10":
        return "Create between 5-10 slides. Balance detail with brevity.";
      case "10-20":
        return "Create between 10-20 slides. Include detailed explanations and examples.";
      case "20-30":
        return "Create between 20-30 slides. Provide comprehensive coverage with detailed breakdowns.";
      case "30-50":
        return "Create between 30-50 slides. Create an extensive, detailed presentation with thorough explanations.";
      case "automatic":
      default:
        return "Create between 5-15 slides depending on content length and complexity.";
    }
  }

  private async generateWithOpenAI(prompt: string, model: Model, apiKey: string): Promise<SlideContent[]> {
    try {
      const openai = new OpenAI({ apiKey });
      
      const response = await openai.chat.completions.create({
        model: model as "gpt-5" | "gpt-4-turbo" | "gpt-4", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No content received from OpenAI");
      }

      console.log("Raw OpenAI response:", content.substring(0, 200) + "...");

      const cleanJson = this.extractJsonFromText(content);
      const result = JSON.parse(cleanJson);
      const slides = Array.isArray(result) ? result : result.slides || [];
      
      if (!slides || slides.length === 0) {
        throw new Error("No slides generated from OpenAI response");
      }
      
      return slides;
    } catch (error) {
      console.error("Error generating with OpenAI:", error);
      if (error instanceof SyntaxError) {
        throw new Error("Invalid JSON response from OpenAI: " + error.message);
      }
      throw error;
    }
  }

  private async generateWithAnthropic(prompt: string, model: Model, apiKey: string): Promise<SlideContent[]> {
    try {
      const anthropic = new Anthropic({ apiKey });
      
      const response = await anthropic.messages.create({
        model: model as "claude-sonnet-4-20250514" | "claude-3-5-sonnet-20241022" | "claude-3-opus-20240229",
        max_tokens: 4000,
        system: "You are a presentation expert. Return only valid JSON arrays of slide objects.",
        messages: [{ role: 'user', content: prompt }],
      });

      const content = response.content[0];
      if (content.type !== "text" || !content.text) {
        throw new Error("No text content received from Anthropic");
      }

      console.log("Raw Anthropic response:", content.text.substring(0, 200) + "...");

      const cleanJson = this.extractJsonFromText(content.text);
      const result = JSON.parse(cleanJson);
      const slides = Array.isArray(result) ? result : result.slides || [];
      
      if (!slides || slides.length === 0) {
        throw new Error("No slides generated from Anthropic response");
      }
      
      return slides;
    } catch (error) {
      console.error("Error generating with Anthropic:", error);
      if (error instanceof SyntaxError) {
        throw new Error("Invalid JSON response from Anthropic: " + error.message);
      }
      throw error;
    }
  }

  private async generateWithGemini(prompt: string, model: Model, apiKey: string): Promise<SlideContent[]> {
    try {
      const ai = new GoogleGenAI({ apiKey });
      
      const response = await ai.models.generateContent({
        model: model as "gemini-2.5-pro" | "gemini-2.5-flash" | "gemini-1.5-pro",
        config: {
          responseMimeType: "application/json",
        },
        contents: prompt,
      });

      if (!response.text) {
        throw new Error("No text received from Gemini");
      }

      console.log("Raw Gemini response:", response.text.substring(0, 200) + "...");

      const cleanJson = this.extractJsonFromText(response.text);
      const result = JSON.parse(cleanJson);
      const slides = Array.isArray(result) ? result : result.slides || [];
      
      if (!slides || slides.length === 0) {
        throw new Error("No slides generated from Gemini response");
      }
      
      return slides;
    } catch (error) {
      console.error("Error generating with Gemini:", error);
      if (error instanceof SyntaxError) {
        throw new Error("Invalid JSON response from Gemini: " + error.message);
      }
      throw error;
    }
  }
}

export const llmService = new LLMService();
