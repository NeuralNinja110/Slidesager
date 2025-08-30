import { type Presentation, type InsertPresentation } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getPresentation(id: string): Promise<Presentation | undefined>;
  createPresentation(presentation: InsertPresentation): Promise<Presentation>;
  getUserPresentations(limit?: number): Promise<Presentation[]>;
  deletePresentation(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private presentations: Map<string, Presentation>;

  constructor() {
    this.presentations = new Map();
  }

  async getPresentation(id: string): Promise<Presentation | undefined> {
    return this.presentations.get(id);
  }

  async createPresentation(insertPresentation: InsertPresentation): Promise<Presentation> {
    const id = randomUUID();
    const presentation: Presentation = {
      ...insertPresentation,
      id,
      createdAt: new Date(),
      guidance: insertPresentation.guidance ?? null,
      templateStyles: insertPresentation.templateStyles ?? null,
    };
    this.presentations.set(id, presentation);
    return presentation;
  }

  async getUserPresentations(limit = 10): Promise<Presentation[]> {
    return Array.from(this.presentations.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async deletePresentation(id: string): Promise<boolean> {
    return this.presentations.delete(id);
  }
}

export const storage = new MemStorage();