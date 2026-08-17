// ─── Notes Tests ──────────────────────────────────────────────────────────────

import { describe, it, expect, beforeAll } from "vitest";
import { env } from "cloudflare:test";
import { migrateDb, createTestUser, authedFetch } from "./helpers.ts";
import type { TestUser } from "./helpers.ts";

let user: TestUser;
let user2: TestUser;

beforeAll(async () => {
  await migrateDb(env as unknown as { DB: D1Database });
  user = await createTestUser("notes_a");
  user2 = await createTestUser("notes_b");
});

describe("POST /api/notes", () => {
  it("creates a note and returns it", async () => {
    const res = await authedFetch("/api/notes", user.accessToken, {
      method: "POST",
      body: JSON.stringify({ title: "My First Note", content: "{}" }),
    });
    expect(res.status).toBe(201);
    const json = (await res.json()) as { success: boolean; data: { note: { id: string; title: string } } };
    expect(json.success).toBe(true);
    expect(json.data.note.title).toBe("My First Note");
    expect(json.data.note.id).toBeTruthy();
  });

  it("rejects missing title", async () => {
    const res = await authedFetch("/api/notes", user.accessToken, {
      method: "POST",
      body: JSON.stringify({ content: "no title here" }),
    });
    expect(res.status).toBe(400);
    const json = (await res.json()) as { success: boolean; error: { fields: Record<string, string> } };
    expect(json.success).toBe(false);
    expect(json.error.fields["title"]).toBeTruthy();
  });

  it("rejects title longer than 500 chars", async () => {
    const res = await authedFetch("/api/notes", user.accessToken, {
      method: "POST",
      body: JSON.stringify({ title: "x".repeat(501) }),
    });
    expect(res.status).toBe(400);
  });

  it("stores tags with the note", async () => {
    const res = await authedFetch("/api/notes", user.accessToken, {
      method: "POST",
      body: JSON.stringify({ title: "Tagged Note", tags: ["work", "ideas"] }),
    });
    expect(res.status).toBe(201);
    const json = (await res.json()) as { data: { note: { tags: string[] } } };
    expect(json.data.note.tags).toContain("work");
    expect(json.data.note.tags).toContain("ideas");
  });
});

describe("GET /api/notes", () => {
  it("returns only the authenticated user's notes", async () => {
    // Create a note for user2
    await authedFetch("/api/notes", user2.accessToken, {
      method: "POST",
      body: JSON.stringify({ title: "User2 Secret Note" }),
    });

    // User1 should NOT see user2's note
    const res = await authedFetch("/api/notes", user.accessToken);
    expect(res.status).toBe(200);
    const json = (await res.json()) as { data: { notes: { title: string }[] } };
    const titles = json.data.notes.map((n) => n.title);
    expect(titles).not.toContain("User2 Secret Note");
  });
});

describe("GET /api/notes/:id", () => {
  it("returns a note by ID", async () => {
    const createRes = await authedFetch("/api/notes", user.accessToken, {
      method: "POST",
      body: JSON.stringify({ title: "Fetch Me" }),
    });
    const { data } = (await createRes.json()) as { data: { note: { id: string } } };
    const noteId = data.note.id;

    const res = await authedFetch(`/api/notes/${noteId}`, user.accessToken);
    expect(res.status).toBe(200);
    const json = (await res.json()) as { data: { note: { title: string } } };
    expect(json.data.note.title).toBe("Fetch Me");
  });

  it("returns 404 for non-existent note", async () => {
    const res = await authedFetch(
      "/api/notes/00000000-0000-0000-0000-000000000000",
      user.accessToken
    );
    expect(res.status).toBe(404);
  });

  it("returns 404 when accessing another user's note", async () => {
    // Create note as user2
    const createRes = await authedFetch("/api/notes", user2.accessToken, {
      method: "POST",
      body: JSON.stringify({ title: "Private to User2" }),
    });
    const { data } = (await createRes.json()) as { data: { note: { id: string } } };
    const noteId = data.note.id;

    // Try to access as user1
    const res = await authedFetch(`/api/notes/${noteId}`, user.accessToken);
    expect(res.status).toBe(404);
  });
});

describe("PUT /api/notes/:id", () => {
  it("updates a note", async () => {
    const createRes = await authedFetch("/api/notes", user.accessToken, {
      method: "POST",
      body: JSON.stringify({ title: "Original Title" }),
    });
    const { data } = (await createRes.json()) as { data: { note: { id: string } } };
    const noteId = data.note.id;

    const res = await authedFetch(`/api/notes/${noteId}`, user.accessToken, {
      method: "PUT",
      body: JSON.stringify({ title: "Updated Title", pinned: true }),
    });
    expect(res.status).toBe(200);
    const json = (await res.json()) as { data: { note: { title: string; pinned: boolean } } };
    expect(json.data.note.title).toBe("Updated Title");
    expect(json.data.note.pinned).toBe(true);
  });

  it("cannot update another user's note", async () => {
    const createRes = await authedFetch("/api/notes", user2.accessToken, {
      method: "POST",
      body: JSON.stringify({ title: "Owned by User2" }),
    });
    const { data } = (await createRes.json()) as { data: { note: { id: string } } };
    const noteId = data.note.id;

    const res = await authedFetch(`/api/notes/${noteId}`, user.accessToken, {
      method: "PUT",
      body: JSON.stringify({ title: "Hacked" }),
    });
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/notes/:id", () => {
  it("soft-deletes a note", async () => {
    const createRes = await authedFetch("/api/notes", user.accessToken, {
      method: "POST",
      body: JSON.stringify({ title: "Delete Me" }),
    });
    const { data } = (await createRes.json()) as { data: { note: { id: string } } };
    const noteId = data.note.id;

    const delRes = await authedFetch(`/api/notes/${noteId}`, user.accessToken, {
      method: "DELETE",
    });
    expect(delRes.status).toBe(204);

    // Accessing the deleted note should return 404
    const getRes = await authedFetch(`/api/notes/${noteId}`, user.accessToken);
    expect(getRes.status).toBe(404);
  });

  it("cannot delete another user's note", async () => {
    const createRes = await authedFetch("/api/notes", user2.accessToken, {
      method: "POST",
      body: JSON.stringify({ title: "Protected" }),
    });
    const { data } = (await createRes.json()) as { data: { note: { id: string } } };
    const noteId = data.note.id;

    const res = await authedFetch(`/api/notes/${noteId}`, user.accessToken, {
      method: "DELETE",
    });
    expect(res.status).toBe(404);
  });
});
