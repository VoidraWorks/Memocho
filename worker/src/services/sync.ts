// ─── Sync Service ─────────────────────────────────────────────────────────────
// Implements last-write-wins delta sync:
//   1. Accept client deltas (notes + tasks since lastSyncedAt)
//   2. Upsert them server-side (server keeps the newer record)
//   3. Return all server records changed since lastSyncedAt

import {
  dbGetNotes,
  dbGetTasks,
  dbGetNoteById_noOwnership,
  dbGetTaskById_noOwnership,
  dbUpsertNote,
  dbUpsertTask,
  dbGetTagsForNotes,
} from "../db/queries.ts";
import { extractPreview, rowToNote } from "./notes.ts";
import { rowToTask } from "./tasks.ts";
import type {
  SyncRequest,
  SyncResponse,
  Note,
  Task,
  SyncPushNote,
  SyncPushTask,
  NoteRow,
  TaskRow,
} from "../types/index.ts";

export async function runSync(
  db: D1Database,
  userId: string,
  payload: SyncRequest
): Promise<SyncResponse> {
  const syncedAt = new Date().toISOString();

  // ── 1. Push client notes ────────────────────────────────────────────────────
  await pushNotes(db, userId, payload.notes);

  // ── 2. Push client tasks ────────────────────────────────────────────────────
  await pushTasks(db, userId, payload.tasks);

  // ── 3. Pull server changes since lastSyncedAt ───────────────────────────────
  const since = payload.lastSyncedAt;

  const [noteRows, taskRows] = await Promise.all([
    dbGetNotes(db, userId, since),
    dbGetTasks(db, userId, { since }),
  ]);

  // Batch-fetch tags for all returned notes
  const noteIds = noteRows.map((r) => r.id);
  const tagMap = await dbGetTagsForNotes(db, noteIds);

  const notes: Note[] = noteRows
    .filter((r) => r.deleted_at === null)
    .map((r) => rowToNote(r, tagMap.get(r.id) ?? []));

  const tasks: Task[] = taskRows
    .filter((r) => r.deleted_at === null)
    .map((r) => rowToTask(r));

  const deletedNoteIds = noteRows
    .filter((r) => r.deleted_at !== null)
    .map((r) => r.id);

  const deletedTaskIds = taskRows
    .filter((r) => r.deleted_at !== null)
    .map((r) => r.id);

  return { notes, tasks, deletedNoteIds, deletedTaskIds, syncedAt };
}

// ─── Push helpers ─────────────────────────────────────────────────────────────

async function pushNotes(
  db: D1Database,
  userId: string,
  clientNotes: SyncPushNote[]
): Promise<void> {
  for (const cn of clientNotes) {
    // Ownership: only accept records that either don't exist yet
    // or already belong to this user.
    const existing = await dbGetNoteById_noOwnership(db, cn.id);
    if (existing && existing.user_id !== userId) continue; // silently skip

    const row: NoteRow = {
      id: cn.id,
      user_id: userId,
      title: (cn.title ?? "").slice(0, 500),
      content: (cn.content ?? "").slice(0, 500_000),
      preview: extractPreview(cn.content ?? ""),
      pinned: cn.pinned ? 1 : 0,
      color: cn.color ?? null,
      created_at: cn.createdAt,
      updated_at: cn.updatedAt,
      deleted_at: cn.deletedAt ?? null,
    };
    await dbUpsertNote(db, row);
  }
}

async function pushTasks(
  db: D1Database,
  userId: string,
  clientTasks: SyncPushTask[]
): Promise<void> {
  for (const ct of clientTasks) {
    const existing = await dbGetTaskById_noOwnership(db, ct.id);
    if (existing && existing.user_id !== userId) continue;

    const row: TaskRow = {
      id: ct.id,
      user_id: userId,
      title: (ct.title ?? "").slice(0, 500),
      description: ct.description ?? null,
      date: ct.date,
      completed: ct.completed ? 1 : 0,
      priority: ct.priority ?? "none",
      position: ct.position ?? 0,
      pinned: ct.pinned ? 1 : 0,
      created_at: ct.createdAt,
      updated_at: ct.updatedAt,
      deleted_at: ct.deletedAt ?? null,
    };
    await dbUpsertTask(db, row);
  }
}
