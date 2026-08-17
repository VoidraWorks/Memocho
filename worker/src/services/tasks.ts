// ─── Tasks Service ────────────────────────────────────────────────────────────

import {
  dbGetTasks,
  dbGetTaskById,
  dbInsertTask,
  dbUpdateTask,
  dbSoftDeleteTask,
} from "../db/queries.ts";
import type { Task, TaskRow, CreateTaskInput, UpdateTaskInput } from "../types/index.ts";

function now(): string {
  return new Date().toISOString();
}

export function rowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    date: row.date,
    completed: row.completed === 1,
    priority: row.priority as Task["priority"],
    position: row.position,
    pinned: row.pinned === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function listTasks(
  db: D1Database,
  userId: string,
  options: { date?: string; since?: string | null } = {}
): Promise<Task[]> {
  const rows = await dbGetTasks(db, userId, options);
  return rows.map(rowToTask);
}

export async function getTask(
  db: D1Database,
  id: string,
  userId: string
): Promise<Task | null> {
  const row = await dbGetTaskById(db, id, userId);
  return row ? rowToTask(row) : null;
}

export async function createTask(
  db: D1Database,
  userId: string,
  input: CreateTaskInput
): Promise<Task> {
  const id = crypto.randomUUID();
  const ts = now();

  // Determine position: count existing tasks for that date
  const existing = await dbGetTasks(db, userId, { date: input.date });
  const position = existing.length;

  const row: TaskRow = {
    id,
    user_id: userId,
    title: input.title.trim(),
    description: input.description ?? null,
    date: input.date,
    completed: 0,
    priority: input.priority ?? "none",
    position,
    pinned: input.pinned ? 1 : 0,
    created_at: ts,
    updated_at: ts,
    deleted_at: null,
  };

  await dbInsertTask(db, row as Omit<TaskRow, "deleted_at"> & { deleted_at: null });
  return rowToTask(row);
}

export async function updateTask(
  db: D1Database,
  id: string,
  userId: string,
  input: UpdateTaskInput
): Promise<Task | null> {
  const existing = await dbGetTaskById(db, id, userId);
  if (!existing) return null;

  const ts = now();
  const fields: Parameters<typeof dbUpdateTask>[3] = { updated_at: ts };

  if (input.title !== undefined) fields.title = input.title.trim();
  if (input.description !== undefined) fields.description = input.description;
  if (input.date !== undefined) fields.date = input.date;
  if (input.completed !== undefined) fields.completed = input.completed ? 1 : 0;
  if (input.priority !== undefined) fields.priority = input.priority;
  if (input.position !== undefined) fields.position = input.position;
  if (input.pinned !== undefined) fields.pinned = input.pinned ? 1 : 0;

  await dbUpdateTask(db, id, userId, fields);

  const updated: TaskRow = {
    ...existing,
    ...fields,
    completed: fields.completed ?? existing.completed,
    pinned: fields.pinned ?? existing.pinned,
  };
  return rowToTask(updated);
}

export async function deleteTask(
  db: D1Database,
  id: string,
  userId: string
): Promise<boolean> {
  const existing = await dbGetTaskById(db, id, userId);
  if (!existing) return false;
  await dbSoftDeleteTask(db, id, userId, now());
  return true;
}
