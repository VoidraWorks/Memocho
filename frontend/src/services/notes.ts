// ─── Notes service — mock implementation (localStorage) ──────────────────────
// When the Cloudflare Worker backend is ready, swap these implementations
// for fetch() calls. The stores and components stay unchanged.

import type { Note, CreateNoteInput, UpdateNoteInput } from "../types";
import { storage } from "./storage";
import { nanoid } from "./nanoid";

const KEY = "notes";

function now() {
  return new Date().toISOString();
}

function plainText(jsonStr: string): string {
  try {
    const doc = JSON.parse(jsonStr);
    const texts: string[] = [];
    function walk(node: { text?: string; content?: unknown[] }) {
      if (node.text) texts.push(node.text);
      if (node.content) node.content.forEach(walk as (n: unknown) => void);
    }
    walk(doc);
    return texts.join(" ").slice(0, 160);
  } catch {
    return jsonStr.slice(0, 160);
  }
}

export const notesService = {
  getAll(): Note[] {
    return storage.get<Note[]>(KEY, []);
  },

  getById(id: string): Note | undefined {
    return this.getAll().find((n) => n.id === id);
  },

  create(input: CreateNoteInput): Note {
    const notes = this.getAll();
    const note: Note = {
      id: nanoid(),
      title: input.title,
      content: input.content ?? "",
      preview: "",
      pinned: false,
      tags: input.tags ?? [],
      createdAt: now(),
      updatedAt: now(),
    };
    storage.set(KEY, [note, ...notes]);
    return note;
  },

  update(id: string, input: UpdateNoteInput): Note | undefined {
    const notes = this.getAll();
    const idx = notes.findIndex((n) => n.id === id);
    if (idx === -1) return undefined;
    const updated: Note = {
      ...notes[idx],
      ...input,
      preview: input.content !== undefined ? plainText(input.content) : notes[idx].preview,
      updatedAt: now(),
    };
    notes[idx] = updated;
    storage.set(KEY, notes);
    return updated;
  },

  delete(id: string): void {
    const notes = this.getAll().filter((n) => n.id !== id);
    storage.set(KEY, notes);
  },

  togglePin(id: string): Note | undefined {
    const note = this.getById(id);
    if (!note) return undefined;
    return this.update(id, { pinned: !note.pinned });
  },
};
