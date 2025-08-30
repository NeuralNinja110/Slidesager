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

  private buildPrompt(content: string, guidance?: string, slideCountOption: SlideCountOption = "automatic"): string {
    const basePrompt = `
Analyze the following text and break it down into slide content for a presentation.

Content:
${content}

${guidance ? `Guidance: ${guidance}` : ''}

Please structure the output as a JSON array of slide objects. Each slide should have:
- title: The slide title
- content: Main content points (markdown format)
- layout: Suggested layout type (title, content, image, etc.)
- notes: Optional speaker notes

Ensure the slides flow logically and are appropriate for the content type and guidance provided.
${this.getSlideCountInstruction(slideCountOption)}

Return only the JSON array, no additional text.
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
    const openai = new OpenAI({ apiKey });
    
    const response = await openai.chat.completions.create({
      model: model as "gpt-5" | "gpt-4-turbo" | "gpt-4", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content || "[]");
    return Array.isArray(result) ? result : result.slides || [];
  }

  private async generateWithAnthropic(prompt: string, model: Model, apiKey: string): Promise<SlideContent[]> {
    const anthropic = new Anthropic({ apiKey });
    
    const response = await anthropic.messages.create({
      model: model as "claude-sonnet-4-20250514" | "claude-3-5-sonnet-20241022" | "claude-3-opus-20240229",
      max_tokens: 4000,
      system: "You are a presentation expert. Return only valid JSON arrays of slide objects.",
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type === "text") {
      const result = JSON.parse(content.text);
      return Array.isArray(result) ? result : result.slides || [];
    }
    
    throw new Error("Failed to generate slides with Anthropic");
  }

  private async generateWithGemini(prompt: string, model: Model, apiKey: string): Promise<SlideContent[]> {
    const ai = new GoogleGenAI({ apiKey });
    
    const response = await ai.models.generateContent({
      model: model as "gemini-2.5-pro" | "gemini-2.5-flash" | "gemini-1.5-pro",
      config: {
        responseMimeType: "application/json",
      },
      contents: prompt,
    });

    const result = JSON.parse(response.text || "[]");
    return Array.isArray(result) ? result : result.slides || [];
  }
}

export const llmService = new LLMService();
