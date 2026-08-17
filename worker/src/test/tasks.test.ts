// ─── Tasks Tests ──────────────────────────────────────────────────────────────

import { describe, it, expect, beforeAll } from "vitest";
import { env } from "cloudflare:test";
import { migrateDb, createTestUser, authedFetch } from "./helpers.ts";
import type { TestUser } from "./helpers.ts";

let user: TestUser;
let user2: TestUser;

beforeAll(async () => {
  await migrateDb(env as unknown as { DB: D1Database });
  user = await createTestUser("tasks_a");
  user2 = await createTestUser("tasks_b");
});

describe("POST /api/tasks", () => {
  it("creates a task and returns it", async () => {
    const res = await authedFetch("/api/tasks", user.accessToken, {
      method: "POST",
      body: JSON.stringify({ title: "Buy groceries", date: "2025-01-15" }),
    });
    expect(res.status).toBe(201);
    const json = (await res.json()) as { success: boolean; data: { task: { id: string; title: string; completed: boolean; priority: string } } };
    expect(json.success).toBe(true);
    expect(json.data.task.title).toBe("Buy groceries");
    expect(json.data.task.completed).toBe(false);
    expect(json.data.task.priority).toBe("none");
  });

  it("rejects missing title", async () => {
    const res = await authedFetch("/api/tasks", user.accessToken, {
      method: "POST",
      body: JSON.stringify({ date: "2025-01-15" }),
    });
    expect(res.status).toBe(400);
  });

  it("rejects invalid date format", async () => {
    const res = await authedFetch("/api/tasks", user.accessToken, {
      method: "POST",
      body: JSON.stringify({ title: "Task", date: "15-01-2025" }),
    });
    expect(res.status).toBe(400);
    const json = (await res.json()) as { error: { fields: Record<string, string> } };
    expect(json.error.fields["date"]).toBeTruthy();
  });

  it("rejects invalid priority", async () => {
    const res = await authedFetch("/api/tasks", user.accessToken, {
      method: "POST",
      body: JSON.stringify({ title: "Task", date: "2025-01-15", priority: "extreme" }),
    });
    expect(res.status).toBe(400);
  });

  it("assigns sequential position within a date", async () => {
    const date = "2025-02-10";
    const r1 = await authedFetch("/api/tasks", user.accessToken, {
      method: "POST",
      body: JSON.stringify({ title: "First", date }),
    });
    const r2 = await authedFetch("/api/tasks", user.accessToken, {
      method: "POST",
      body: JSON.stringify({ title: "Second", date }),
    });
    const j1 = (await r1.json()) as { data: { task: { position: number } } };
    const j2 = (await r2.json()) as { data: { task: { position: number } } };
    expect(j2.data.task.position).toBeGreaterThan(j1.data.task.position);
  });
});

describe("GET /api/tasks?date=", () => {
  it("returns tasks for a specific date", async () => {
    const date = "2025-03-20";
    await authedFetch("/api/tasks", user.accessToken, {
      method: "POST",
      body: JSON.stringify({ title: "On this date", date }),
    });
    await authedFetch("/api/tasks", user.accessToken, {
      method: "POST",
      body: JSON.stringify({ title: "Different date", date: "2025-03-21" }),
    });

    const res = await authedFetch(`/api/tasks?date=${date}`, user.accessToken);
    expect(res.status).toBe(200);
    const json = (await res.json()) as { data: { tasks: { title: string; date: string }[] } };
    expect(json.data.tasks.every((t) => t.date === date)).toBe(true);
    expect(json.data.tasks.some((t) => t.title === "On this date")).toBe(true);
    expect(json.data.tasks.some((t) => t.title === "Different date")).toBe(false);
  });

  it("rejects invalid date query param", async () => {
    const res = await authedFetch("/api/tasks?date=not-a-date", user.accessToken);
    expect(res.status).toBe(400);
  });
});

describe("PUT /api/tasks/:id — completing tasks", () => {
  it("marks a task as completed", async () => {
    const createRes = await authedFetch("/api/tasks", user.accessToken, {
      method: "POST",
      body: JSON.stringify({ title: "Complete me", date: "2025-01-20" }),
    });
    const { data } = (await createRes.json()) as { data: { task: { id: string } } };
    const taskId = data.task.id;

    const res = await authedFetch(`/api/tasks/${taskId}`, user.accessToken, {
      method: "PUT",
      body: JSON.stringify({ completed: true }),
    });
    expect(res.status).toBe(200);
    const json = (await res.json()) as { data: { task: { completed: boolean } } };
    expect(json.data.task.completed).toBe(true);
  });

  it("can set priority", async () => {
    const createRes = await authedFetch("/api/tasks", user.accessToken, {
      method: "POST",
      body: JSON.stringify({ title: "Priority task", date: "2025-01-20" }),
    });
    const { data } = (await createRes.json()) as { data: { task: { id: string } } };

    const res = await authedFetch(`/api/tasks/${data.task.id}`, user.accessToken, {
      method: "PUT",
      body: JSON.stringify({ priority: "high" }),
    });
    expect(res.status).toBe(200);
    const json = (await res.json()) as { data: { task: { priority: string } } };
    expect(json.data.task.priority).toBe("high");
  });

  it("cannot update another user's task", async () => {
    const createRes = await authedFetch("/api/tasks", user2.accessToken, {
      method: "POST",
      body: JSON.stringify({ title: "User2 Task", date: "2025-01-20" }),
    });
    const { data } = (await createRes.json()) as { data: { task: { id: string } } };

    const res = await authedFetch(`/api/tasks/${data.task.id}`, user.accessToken, {
      method: "PUT",
      body: JSON.stringify({ completed: true }),
    });
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/tasks/:id", () => {
  it("soft-deletes a task", async () => {
    const createRes = await authedFetch("/api/tasks", user.accessToken, {
      method: "POST",
      body: JSON.stringify({ title: "Deletable task", date: "2025-04-01" }),
    });
    const { data } = (await createRes.json()) as { data: { task: { id: string } } };
    const taskId = data.task.id;

    const delRes = await authedFetch(`/api/tasks/${taskId}`, user.accessToken, {
      method: "DELETE",
    });
    expect(delRes.status).toBe(204);

    const getRes = await authedFetch(`/api/tasks/${taskId}`, user.accessToken);
    expect(getRes.status).toBe(404);
  });
});
