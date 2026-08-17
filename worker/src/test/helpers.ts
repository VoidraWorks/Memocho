// ─── Test helpers ─────────────────────────────────────────────────────────────
// Shared setup for all worker tests: migrate DB, register a test user, return a bearer token.

import { SELF } from "cloudflare:test";

export interface TestUser {
  id: string;
  email: string;
  accessToken: string;
  refreshToken: string;
}

let _migrated = false;

/** Apply schema migrations to the test D1 instance. */
export async function migrateDb(env: { DB: D1Database }): Promise<void> {
  if (_migrated) return;
  _migrated = true;
  // Read and execute migration inline for test environment
  const schema = `
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
    );

    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL DEFAULT '', content TEXT NOT NULL DEFAULT '',
      preview TEXT NOT NULL DEFAULT '', pinned INTEGER NOT NULL DEFAULT 0,
      color TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL, description TEXT, date TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0, priority TEXT NOT NULL DEFAULT 'none',
      position INTEGER NOT NULL DEFAULT 0, pinned INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL, deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL, UNIQUE(user_id, name)
    );

    CREATE TABLE IF NOT EXISTS note_tags (
      note_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
      tag_id  TEXT NOT NULL REFERENCES tags(id)  ON DELETE CASCADE,
      PRIMARY KEY (note_id, tag_id)
    );

    CREATE TABLE IF NOT EXISTS user_settings (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      theme TEXT NOT NULL DEFAULT 'system', font_size TEXT NOT NULL DEFAULT 'base',
      background TEXT NOT NULL DEFAULT 'solid', gradient_from TEXT,
      gradient_to TEXT, updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL, expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
      revoked INTEGER NOT NULL DEFAULT 0
    );
  `;
  for (const stmt of schema.split(";").map((s) => s.trim()).filter(Boolean)) {
    await env.DB.prepare(stmt).run();
  }
}

let _counter = 0;

/** Register a unique test user and return their tokens. */
export async function createTestUser(suffix?: string): Promise<TestUser> {
  const email = `test${suffix ?? ++_counter}@example.com`;
  const res = await SELF.fetch("http://worker/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "password123" }),
  });
  const json = (await res.json()) as {
    success: boolean;
    data: { user: { id: string; email: string }; tokens: { accessToken: string; refreshToken: string } };
  };
  if (!json.success) throw new Error(`Failed to register test user: ${JSON.stringify(json)}`);
  return {
    id: json.data.user.id,
    email: json.data.user.email,
    accessToken: json.data.tokens.accessToken,
    refreshToken: json.data.tokens.refreshToken,
  };
}

/** Authenticated fetch helper. */
export function authedFetch(
  path: string,
  token: string,
  options: RequestInit = {}
): Promise<Response> {
  return SELF.fetch(`http://worker${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });
}
