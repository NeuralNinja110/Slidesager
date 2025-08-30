import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const presentations = pgTable("presentations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  guidance: text("guidance"),
  llmProvider: text("llm_provider").notNull(),
  model: text("model").notNull(),
  slideCount: integer("slide_count").notNull(),
  templateStyles: jsonb("template_styles"),
  marpContent: text("marp_content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPresentationSchema = createInsertSchema(presentations).omit({
  id: true,
  createdAt: true,
});

export type InsertPresentation = z.infer<typeof insertPresentationSchema>;
export type Presentation = typeof presentations.$inferSelect;

export const llmProviders = ["openai", "anthropic", "gemini"] as const;
export type LLMProvider = typeof llmProviders[number];

export const models = {
  openai: ["gpt-5", "gpt-4-turbo", "gpt-4"],
  anthropic: ["claude-sonnet-4-20250514", "claude-3-5-sonnet-20241022", "claude-3-opus-20240229"],
  gemini: ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-1.5-pro"]
} as const;

export type Model = typeof models[keyof typeof models][number];

export interface SlideContent {
  title: string;
  content: string;
  layout: string;
  notes?: string;
}

export interface TemplateStyles {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
  fonts: {
    title: string;
    body: string;
  };
  layouts: string[];
  images: string[];
}

export const slideCountOptions = [
  { value: "2-5", label: "2-5 slides" },
  { value: "5-10", label: "5-10 slides" },
  { value: "10-20", label: "10-20 slides" },
  { value: "20-30", label: "20-30 slides" },
  { value: "30-50", label: "30-50 slides" },
  { value: "automatic", label: "Automatic" }
] as const;

export type SlideCountOption = typeof slideCountOptions[number]["value"];

export interface GenerationRequest {
  content: string;
  guidance?: string;
  llmProvider: LLMProvider;
  model: Model;
  apiKey: string;
  slideCountOption: SlideCountOption;
  templateFile?: File;
}

export interface SlideRange {
  start: number;
  end: number;
}
