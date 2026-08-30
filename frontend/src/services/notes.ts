// ─── Notes service — connected to the Worker API ─────────────────────────────

import type { Note, CreateNoteInput, UpdateNoteInput } from "../types";
import { apiClient } from "./api";

export const notesService = {
  async getAll(): Promise<Note[]> {
    const result = await apiClient.get<{ notes: Note[] }>("/api/notes");
    if (!result.success) return [];
    return result.data.notes;
  },

  async getById(id: string): Promise<Note | undefined> {
    const result = await apiClient.get<{ note: Note }>(`/api/notes/${id}`);
    if (!result.success) return undefined;
    return result.data.note;
  },

  async create(input: CreateNoteInput): Promise<Note> {
    const result = await apiClient.post<{ note: Note }>("/api/notes", {
      title: input.title,
      content: input.content ?? "",
      tags: input.tags ?? [],
      color: input.color ?? null,
    });
    if (!result.success) {
      throw new Error(result.error.message);
    }
    return result.data.note;
  },

  async update(id: string, input: UpdateNoteInput): Promise<Note | undefined> {
    const result = await apiClient.put<{ note: Note }>(`/api/notes/${id}`, input);
    if (!result.success) return undefined;
    return result.data.note;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/api/notes/${id}`);
  },

  async togglePin(id: string): Promise<Note | undefined> {
    const existing = await this.getById(id);
    if (!existing) return undefined;
    return this.update(id, { pinned: !existing.pinned });
  },
};
