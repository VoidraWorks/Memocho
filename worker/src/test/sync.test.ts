// ─── Sync Tests ───────────────────────────────────────────────────────────────

import { describe, it, expect, beforeAll } from "vitest";
import { env } from "cloudflare:test";
import { migrateDb, createTestUser, authedFetch } from "./helpers.ts";
import type { TestUser } from "./helpers.ts";

let user: TestUser;
let user2: TestUser;

beforeAll(async () => {
  await migrateDb(env as unknown as { DB: D1Database });
  user = await createTestUser("sync_a");
  user2 = await createTestUser("sync_b");
});

function uuid(): string {
  // Simple deterministic-ish UUID for tests
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

describe("POST /api/sync — first sync (null lastSyncedAt)", () => {
  it("pushes client notes to server", async () => {
    const noteId = uuid();
    const ts = new Date().toISOString();

    const res = await authedFetch("/api/sync", user.accessToken, {
      method: "POST",
      body: JSON.stringify({
        lastSyncedAt: null,
        notes: [
          {
            id: noteId,
            title: "Synced from client",
            content: "{}",
            preview: "",
            pinned: false,
            tags: [],
            createdAt: ts,
            updatedAt: ts,
          },
        ],
        tasks: [],
      }),
    });
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      success: boolean;
      data: { notes: { id: string; title: string }[] };
    };
    expect(json.success).toBe(true);
    // The pushed note should come back in the response (since all records returned on first sync)
    expect(json.data.notes.some((n) => n.id === noteId)).toBe(true);
  });

  it("pushes client tasks to server", async () => {
    const taskId = uuid();
    const ts = new Date().toISOString();

    const res = await authedFetch("/api/sync", user.accessToken, {
      method: "POST",
      body: JSON.stringify({
        lastSyncedAt: null,
        notes: [],
        tasks: [
          {
            id: taskId,
            title: "Synced task",
            date: "2025-05-15",
            completed: false,
            priority: "medium",
            position: 0,
            pinned: false,
            createdAt: ts,
            updatedAt: ts,
          },
        ],
      }),
    });
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      data: { tasks: { id: string }[] };
    };
    expect(json.data.tasks.some((t) => t.id === taskId)).toBe(true);
  });
});

describe("POST /api/sync — delta sync (with lastSyncedAt)", () => {
  it("returns only records changed since lastSyncedAt", async () => {
    const beforeSync = new Date().toISOString();

    // Create a note server-side
    const createRes = await authedFetch("/api/notes", user.accessToken, {
      method: "POST",
      body: JSON.stringify({ title: "New server note" }),
    });
    const { data } = (await createRes.json()) as { data: { note: { id: string } } };
    const newNoteId = data.note.id;

    // Sync with lastSyncedAt = before the creation
    const res = await authedFetch("/api/sync", user.accessToken, {
      method: "POST",
      body: JSON.stringify({ lastSyncedAt: beforeSync, notes: [], tasks: [] }),
    });
    const json = (await res.json()) as {
      data: { notes: { id: string }[] };
    };
    // The new note should appear in the delta
    expect(json.data.notes.some((n) => n.id === newNoteId)).toBe(true);
  });
});

describe("POST /api/sync — conflict resolution (last-write-wins)", () => {
  it("server keeps the record with the newer updatedAt", async () => {
    const noteId = uuid();
    const olderTs = "2025-01-01T10:00:00.000Z";
    const newerTs = "2025-01-01T12:00:00.000Z";

    // Push the note with newerTs first (server has it)
    await authedFetch("/api/sync", user.accessToken, {
      method: "POST",
      body: JSON.stringify({
        lastSyncedAt: null,
        notes: [
          {
            id: noteId,
            title: "Server version",
            content: "{}",
            preview: "",
            pinned: false,
            tags: [],
            createdAt: olderTs,
            updatedAt: newerTs,
          },
        ],
        tasks: [],
      }),
    });

    // Now try to push the same note with an older updatedAt (should be ignored)
    await authedFetch("/api/sync", user.accessToken, {
      method: "POST",
      body: JSON.stringify({
        lastSyncedAt: null,
        notes: [
          {
            id: noteId,
            title: "Stale client version",
            content: "{}",
            preview: "",
            pinned: false,
            tags: [],
            createdAt: olderTs,
            updatedAt: olderTs,
          },
        ],
        tasks: [],
      }),
    });

    // Verify server kept the newer version
    const getRes = await authedFetch(`/api/notes/${noteId}`, user.accessToken);
    const json = (await getRes.json()) as { data: { note: { title: string } } };
    expect(json.data.note.title).toBe("Server version");
  });
});

describe("POST /api/sync — ownership security", () => {
  it("cannot push records belonging to another user", async () => {
    // Get user2's note ID
    const createRes = await authedFetch("/api/notes", user2.accessToken, {
      method: "POST",
      body: JSON.stringify({ title: "User2 Note" }),
    });
    const { data } = (await createRes.json()) as { data: { note: { id: string } } };
    const user2NoteId = data.note.id;

    // User1 tries to overwrite it via sync
    await authedFetch("/api/sync", user.accessToken, {
      method: "POST",
      body: JSON.stringify({
        lastSyncedAt: null,
        notes: [
          {
            id: user2NoteId,
            title: "Hijacked!",
            content: "{}",
            preview: "",
            pinned: false,
            tags: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        tasks: [],
      }),
    });

    // User2's note must remain unchanged
    const getRes = await authedFetch(`/api/notes/${user2NoteId}`, user2.accessToken);
    const json = (await getRes.json()) as { data: { note: { title: string } } };
    expect(json.data.note.title).toBe("User2 Note");
  });
});

describe("POST /api/sync — tombstones for deleted records", () => {
  it("returns deletedNoteIds for soft-deleted notes", async () => {
    const beforeSync = new Date().toISOString();

    // Create and then delete a note
    const createRes = await authedFetch("/api/notes", user.accessToken, {
      method: "POST",
      body: JSON.stringify({ title: "To be deleted" }),
    });
    const { data } = (await createRes.json()) as { data: { note: { id: string } } };
    const noteId = data.note.id;

    await authedFetch(`/api/notes/${noteId}`, user.accessToken, {
      method: "DELETE",
    });

    // Sync should return this noteId in deletedNoteIds
    const res = await authedFetch("/api/sync", user.accessToken, {
      method: "POST",
      body: JSON.stringify({ lastSyncedAt: beforeSync, notes: [], tasks: [] }),
    });
    const json = (await res.json()) as { data: { deletedNoteIds: string[] } };
    expect(json.data.deletedNoteIds).toContain(noteId);
  });
});

describe("POST /api/sync — validation", () => {
  it("rejects invalid lastSyncedAt", async () => {
    const res = await authedFetch("/api/sync", user.accessToken, {
      method: "POST",
      body: JSON.stringify({ lastSyncedAt: "not-a-date", notes: [], tasks: [] }),
    });
    expect(res.status).toBe(400);
  });

  it("rejects non-array notes", async () => {
    const res = await authedFetch("/api/sync", user.accessToken, {
      method: "POST",
      body: JSON.stringify({ lastSyncedAt: null, notes: "bad", tasks: [] }),
    });
    expect(res.status).toBe(400);
  });
});
