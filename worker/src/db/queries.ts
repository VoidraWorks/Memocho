// ─── D1 Query Helpers ─────────────────────────────────────────────────────────
// All SQL lives here. Services call these functions, never raw D1 directly.

import type {
  NoteRow,
  TaskRow,
  TagRow,
  UserSettingsRow,
  UserRow,
  RefreshTokenRow,
} from "../types/index.ts";

// ─── Notes ───────────────────────────────────────────────────────────────────

export async function dbGetNotes(
  db: D1Database,
  userId: string,
  since?: string | null
): Promise<NoteRow[]> {
  if (since) {
    const stmt = db
      .prepare(
        `SELECT * FROM notes
         WHERE user_id = ?
           AND updated_at > ?
         ORDER BY updated_at DESC`
      )
      .bind(userId, since);
    const result = await stmt.all<NoteRow>();
    return result.results;
  }
  const stmt = db
    .prepare(
      `SELECT * FROM notes
       WHERE user_id = ?
         AND deleted_at IS NULL
       ORDER BY pinned DESC, updated_at DESC`
    )
    .bind(userId);
  const result = await stmt.all<NoteRow>();
  return result.results;
}

export async function dbGetNoteById(
  db: D1Database,
  id: string,
  userId: string
): Promise<NoteRow | null> {
  return db
    .prepare(
      `SELECT * FROM notes WHERE id = ? AND user_id = ? AND deleted_at IS NULL`
    )
    .bind(id, userId)
    .first<NoteRow>();
}

export async function dbInsertNote(
  db: D1Database,
  note: Omit<NoteRow, "deleted_at"> & { deleted_at: null }
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO notes (id, user_id, title, content, preview, pinned, color, created_at, updated_at, deleted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      note.id,
      note.user_id,
      note.title,
      note.content,
      note.preview,
      note.pinned,
      note.color,
      note.created_at,
      note.updated_at,
      null
    )
    .run();
}

export async function dbUpdateNote(
  db: D1Database,
  id: string,
  userId: string,
  fields: Partial<Pick<NoteRow, "title" | "content" | "preview" | "pinned" | "color" | "updated_at">>
): Promise<void> {
  const sets: string[] = [];
  const values: unknown[] = [];
  for (const [k, v] of Object.entries(fields)) {
    sets.push(`${k} = ?`);
    values.push(v);
  }
  if (sets.length === 0) return;
  values.push(id, userId);
  await db
    .prepare(
      `UPDATE notes SET ${sets.join(", ")} WHERE id = ? AND user_id = ? AND deleted_at IS NULL`
    )
    .bind(...values)
    .run();
}

export async function dbSoftDeleteNote(
  db: D1Database,
  id: string,
  userId: string,
  now: string
): Promise<void> {
  await db
    .prepare(
      `UPDATE notes SET deleted_at = ?, updated_at = ? WHERE id = ? AND user_id = ?`
    )
    .bind(now, now, id, userId)
    .run();
}

// ─── Note Tags ───────────────────────────────────────────────────────────────

export async function dbGetTagsForNote(
  db: D1Database,
  noteId: string
): Promise<string[]> {
  const result = await db
    .prepare(
      `SELECT t.name FROM tags t
       INNER JOIN note_tags nt ON nt.tag_id = t.id
       WHERE nt.note_id = ?`
    )
    .bind(noteId)
    .all<{ name: string }>();
  return result.results.map((r) => r.name);
}

export async function dbGetTagsForNotes(
  db: D1Database,
  noteIds: string[]
): Promise<Map<string, string[]>> {
  if (noteIds.length === 0) return new Map();
  const placeholders = noteIds.map(() => "?").join(",");
  const result = await db
    .prepare(
      `SELECT nt.note_id, t.name FROM tags t
       INNER JOIN note_tags nt ON nt.tag_id = t.id
       WHERE nt.note_id IN (${placeholders})`
    )
    .bind(...noteIds)
    .all<{ note_id: string; name: string }>();
  const map = new Map<string, string[]>();
  for (const row of result.results) {
    const arr = map.get(row.note_id) ?? [];
    arr.push(row.name);
    map.set(row.note_id, arr);
  }
  return map;
}

export async function dbUpsertTag(
  db: D1Database,
  id: string,
  userId: string,
  name: string
): Promise<string> {
  // Insert or ignore, then return existing id
  await db
    .prepare(
      `INSERT OR IGNORE INTO tags (id, user_id, name) VALUES (?, ?, ?)`
    )
    .bind(id, userId, name)
    .run();
  const row = await db
    .prepare(`SELECT id FROM tags WHERE user_id = ? AND name = ?`)
    .bind(userId, name)
    .first<{ id: string }>();
  return row?.id ?? id;
}

export async function dbSetNoteTagsForNote(
  db: D1Database,
  noteId: string,
  tagIds: string[]
): Promise<void> {
  await db
    .prepare(`DELETE FROM note_tags WHERE note_id = ?`)
    .bind(noteId)
    .run();
  for (const tagId of tagIds) {
    await db
      .prepare(`INSERT OR IGNORE INTO note_tags (note_id, tag_id) VALUES (?, ?)`)
      .bind(noteId, tagId)
      .run();
  }
}

// ─── Tasks ───────────────────────────────────────────────────────────────────

export async function dbGetTasks(
  db: D1Database,
  userId: string,
  options: { date?: string; since?: string | null } = {}
): Promise<TaskRow[]> {
  if (options.since) {
    const stmt = db
      .prepare(
        `SELECT * FROM tasks
         WHERE user_id = ? AND updated_at > ?
         ORDER BY updated_at DESC`
      )
      .bind(userId, options.since);
    const result = await stmt.all<TaskRow>();
    return result.results;
  }
  if (options.date) {
    const stmt = db
      .prepare(
        `SELECT * FROM tasks
         WHERE user_id = ? AND date = ? AND deleted_at IS NULL
         ORDER BY position ASC`
      )
      .bind(userId, options.date);
    const result = await stmt.all<TaskRow>();
    return result.results;
  }
  const stmt = db
    .prepare(
      `SELECT * FROM tasks
       WHERE user_id = ? AND deleted_at IS NULL
       ORDER BY date ASC, position ASC`
    )
    .bind(userId);
  const result = await stmt.all<TaskRow>();
  return result.results;
}

export async function dbGetTaskById(
  db: D1Database,
  id: string,
  userId: string
): Promise<TaskRow | null> {
  return db
    .prepare(
      `SELECT * FROM tasks WHERE id = ? AND user_id = ? AND deleted_at IS NULL`
    )
    .bind(id, userId)
    .first<TaskRow>();
}

export async function dbInsertTask(db: D1Database, task: Omit<TaskRow, "deleted_at"> & { deleted_at: null }): Promise<void> {
  await db
    .prepare(
      `INSERT INTO tasks
         (id, user_id, title, description, date, completed, priority, position, pinned, created_at, updated_at, deleted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      task.id, task.user_id, task.title, task.description,
      task.date, task.completed, task.priority, task.position,
      task.pinned, task.created_at, task.updated_at, null
    )
    .run();
}

export async function dbUpdateTask(
  db: D1Database,
  id: string,
  userId: string,
  fields: Partial<Pick<TaskRow, "title" | "description" | "date" | "completed" | "priority" | "position" | "pinned" | "updated_at">>
): Promise<void> {
  const sets: string[] = [];
  const values: unknown[] = [];
  for (const [k, v] of Object.entries(fields)) {
    sets.push(`${k} = ?`);
    values.push(v);
  }
  if (sets.length === 0) return;
  values.push(id, userId);
  await db
    .prepare(
      `UPDATE tasks SET ${sets.join(", ")} WHERE id = ? AND user_id = ? AND deleted_at IS NULL`
    )
    .bind(...values)
    .run();
}

export async function dbSoftDeleteTask(
  db: D1Database,
  id: string,
  userId: string,
  now: string
): Promise<void> {
  await db
    .prepare(
      `UPDATE tasks SET deleted_at = ?, updated_at = ? WHERE id = ? AND user_id = ?`
    )
    .bind(now, now, id, userId)
    .run();
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function dbGetUserByEmail(
  db: D1Database,
  email: string
): Promise<UserRow | null> {
  return db
    .prepare(`SELECT * FROM users WHERE email = ?`)
    .bind(email)
    .first<UserRow>();
}

export async function dbGetUserById(
  db: D1Database,
  id: string
): Promise<UserRow | null> {
  return db
    .prepare(`SELECT * FROM users WHERE id = ?`)
    .bind(id)
    .first<UserRow>();
}

export async function dbInsertUser(db: D1Database, user: UserRow): Promise<void> {
  await db
    .prepare(
      `INSERT INTO users (id, email, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`
    )
    .bind(user.id, user.email, user.password_hash, user.created_at, user.updated_at)
    .run();
}

// ─── Settings ────────────────────────────────────────────────────────────────

export async function dbGetSettings(
  db: D1Database,
  userId: string
): Promise<UserSettingsRow | null> {
  return db
    .prepare(`SELECT * FROM user_settings WHERE user_id = ?`)
    .bind(userId)
    .first<UserSettingsRow>();
}

export async function dbUpsertSettings(
  db: D1Database,
  settings: UserSettingsRow
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO user_settings (user_id, theme, font_size, background, gradient_from, gradient_to, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         theme = excluded.theme,
         font_size = excluded.font_size,
         background = excluded.background,
         gradient_from = excluded.gradient_from,
         gradient_to = excluded.gradient_to,
         updated_at = excluded.updated_at`
    )
    .bind(
      settings.user_id, settings.theme, settings.font_size,
      settings.background, settings.gradient_from, settings.gradient_to,
      settings.updated_at
    )
    .run();
}

// ─── Refresh Tokens ──────────────────────────────────────────────────────────

export async function dbInsertRefreshToken(
  db: D1Database,
  row: Omit<RefreshTokenRow, "revoked" | "created_at">
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)`
    )
    .bind(row.id, row.user_id, row.token_hash, row.expires_at)
    .run();
}

export async function dbGetRefreshToken(
  db: D1Database,
  tokenHash: string
): Promise<RefreshTokenRow | null> {
  return db
    .prepare(
      `SELECT * FROM refresh_tokens WHERE token_hash = ? AND revoked = 0`
    )
    .bind(tokenHash)
    .first<RefreshTokenRow>();
}

export async function dbRevokeRefreshToken(
  db: D1Database,
  tokenHash: string
): Promise<void> {
  await db
    .prepare(`UPDATE refresh_tokens SET revoked = 1 WHERE token_hash = ?`)
    .bind(tokenHash)
    .run();
}

export async function dbRevokeAllUserRefreshTokens(
  db: D1Database,
  userId: string
): Promise<void> {
  await db
    .prepare(`UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?`)
    .bind(userId)
    .run();
}

// ─── Sync helpers ─────────────────────────────────────────────────────────────

export async function dbGetNoteById_noOwnership(
  db: D1Database,
  id: string
): Promise<NoteRow | null> {
  return db
    .prepare(`SELECT * FROM notes WHERE id = ?`)
    .bind(id)
    .first<NoteRow>();
}

export async function dbGetTaskById_noOwnership(
  db: D1Database,
  id: string
): Promise<TaskRow | null> {
  return db
    .prepare(`SELECT * FROM tasks WHERE id = ?`)
    .bind(id)
    .first<TaskRow>();
}

export async function dbUpsertNote(
  db: D1Database,
  note: NoteRow
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO notes (id, user_id, title, content, preview, pinned, color, created_at, updated_at, deleted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         title = excluded.title,
         content = excluded.content,
         preview = excluded.preview,
         pinned = excluded.pinned,
         color = excluded.color,
         updated_at = excluded.updated_at,
         deleted_at = excluded.deleted_at
       WHERE excluded.updated_at > notes.updated_at`
    )
    .bind(
      note.id, note.user_id, note.title, note.content, note.preview,
      note.pinned, note.color, note.created_at, note.updated_at, note.deleted_at
    )
    .run();
}

export async function dbUpsertTask(
  db: D1Database,
  task: TaskRow
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO tasks (id, user_id, title, description, date, completed, priority, position, pinned, created_at, updated_at, deleted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         title = excluded.title,
         description = excluded.description,
         date = excluded.date,
         completed = excluded.completed,
         priority = excluded.priority,
         position = excluded.position,
         pinned = excluded.pinned,
         updated_at = excluded.updated_at,
         deleted_at = excluded.deleted_at
       WHERE excluded.updated_at > tasks.updated_at`
    )
    .bind(
      task.id, task.user_id, task.title, task.description, task.date,
      task.completed, task.priority, task.position, task.pinned,
      task.created_at, task.updated_at, task.deleted_at
    )
    .run();
}
