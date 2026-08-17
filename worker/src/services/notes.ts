// ─── Notes Service ────────────────────────────────────────────────────────────

import {
  dbGetNotes,
  dbGetNoteById,
  dbInsertNote,
  dbUpdateNote,
  dbSoftDeleteNote,
  dbUpsertTag,
  dbSetNoteTagsForNote,
  dbGetTagsForNote,
  dbGetTagsForNotes,
} from "../db/queries.ts";
import type { Note, NoteRow, CreateNoteInput, UpdateNoteInput } from "../types/index.ts";

function now(): string {
  return new Date().toISOString();
}

/** Extract plain-text preview from a TipTap JSON string (≤ 160 chars). */
export function extractPreview(content: string): string {
  if (!content) return "";
  try {
    const doc = JSON.parse(content) as { content?: unknown[] };
    const texts: string[] = [];
    function walk(node: { text?: string; content?: unknown[] }) {
      if (node.text) texts.push(node.text);
      if (node.content) (node.content as typeof node[]).forEach(walk);
    }
    walk(doc as { text?: string; content?: unknown[] });
    return texts.join(" ").slice(0, 160);
  } catch {
    return content.slice(0, 160);
  }
}

/** Convert a DB row to the API Note shape. Tags are injected separately. */
export function rowToNote(row: NoteRow, tags: string[]): Note {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    content: row.content,
    preview: row.preview,
    pinned: row.pinned === 1,
    color: row.color,
    tags,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function listNotes(
  db: D1Database,
  userId: string,
  since?: string | null
): Promise<Note[]> {
  const rows = await dbGetNotes(db, userId, since);
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const tagMap = await dbGetTagsForNotes(db, ids);
  return rows.map((r) => rowToNote(r, tagMap.get(r.id) ?? []));
}

export async function getNote(
  db: D1Database,
  id: string,
  userId: string
): Promise<Note | null> {
  const row = await dbGetNoteById(db, id, userId);
  if (!row) return null;
  const tags = await dbGetTagsForNote(db, id);
  return rowToNote(row, tags);
}

export async function createNote(
  db: D1Database,
  userId: string,
  input: CreateNoteInput
): Promise<Note> {
  const id = crypto.randomUUID();
  const ts = now();
  const preview = input.content ? extractPreview(input.content) : "";

  const row: NoteRow = {
    id,
    user_id: userId,
    title: input.title.trim(),
    content: input.content ?? "",
    preview,
    pinned: 0,
    color: input.color ?? null,
    created_at: ts,
    updated_at: ts,
    deleted_at: null,
  };
  await dbInsertNote(db, row as Omit<NoteRow, "deleted_at"> & { deleted_at: null });

  // Handle tags
  const tagNames = input.tags ?? [];
  const tagIds = await resolveTagIds(db, userId, tagNames);
  await dbSetNoteTagsForNote(db, id, tagIds);

  return rowToNote(row, tagNames);
}

export async function updateNote(
  db: D1Database,
  id: string,
  userId: string,
  input: UpdateNoteInput
): Promise<Note | null> {
  const existing = await dbGetNoteById(db, id, userId);
  if (!existing) return null;

  const ts = now();
  const fields: Parameters<typeof dbUpdateNote>[3] = { updated_at: ts };

  if (input.title !== undefined) fields.title = input.title.trim();
  if (input.content !== undefined) {
    fields.content = input.content;
    fields.preview = extractPreview(input.content);
  }
  if (input.pinned !== undefined) fields.pinned = input.pinned ? 1 : 0;
  if (input.color !== undefined) fields.color = input.color;

  await dbUpdateNote(db, id, userId, fields);

  // Handle tag update
  let tags: string[];
  if (input.tags !== undefined) {
    const tagIds = await resolveTagIds(db, userId, input.tags);
    await dbSetNoteTagsForNote(db, id, tagIds);
    tags = input.tags;
  } else {
    tags = await dbGetTagsForNote(db, id);
  }

  const updated: NoteRow = {
    ...existing,
    ...fields,
    pinned: fields.pinned ?? existing.pinned,
    color: fields.color ?? existing.color,
  };
  return rowToNote(updated, tags);
}

export async function deleteNote(
  db: D1Database,
  id: string,
  userId: string
): Promise<boolean> {
  const existing = await dbGetNoteById(db, id, userId);
  if (!existing) return false;
  await dbSoftDeleteNote(db, id, userId, now());
  return true;
}

// ─── Tag helpers ──────────────────────────────────────────────────────────────

async function resolveTagIds(
  db: D1Database,
  userId: string,
  tagNames: string[]
): Promise<string[]> {
  const ids: string[] = [];
  for (const name of tagNames) {
    const trimmed = name.trim().toLowerCase();
    if (!trimmed) continue;
    const id = await dbUpsertTag(db, crypto.randomUUID(), userId, trimmed);
    ids.push(id);
  }
  return ids;
}
