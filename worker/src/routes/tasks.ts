// ─── Tasks Routes ─────────────────────────────────────────────────────────────

import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth.ts";
import { listTasks, getTask, createTask, updateTask, deleteTask } from "../services/tasks.ts";
import { validateCreateTask, validateUpdateTask, isValidDate, isValidISO } from "../lib/validation.ts";
import { ok, created, noContent, Errors } from "../lib/response.ts";
import type { Env, ContextVariables } from "../types/index.ts";

export const tasksRouter = new Hono<{ Bindings: Env; Variables: ContextVariables }>();

// All tasks routes require authentication
tasksRouter.use("*", authMiddleware);

// GET /api/tasks?date=YYYY-MM-DD&since=ISO
tasksRouter.get("/", async (c) => {
  const userId = c.get("userId");
  const date = c.req.query("date");
  const since = c.req.query("since") ?? null;

  if (date !== undefined && !isValidDate(date)) {
    return Errors.badRequest("'date' must be in YYYY-MM-DD format");
  }

  if (since !== null && !isValidISO(since)) {
    return Errors.badRequest("'since' must be a valid ISO timestamp");
  }

  const tasks = await listTasks(c.env.DB, userId, { date, since });
  return ok({ tasks });
});

// GET /api/tasks/:id
tasksRouter.get("/:id", async (c) => {
  const userId = c.get("userId");
  const { id } = c.req.param();

  const task = await getTask(c.env.DB, id, userId);
  if (!task) return Errors.notFound("task");

  return ok({ task });
});

// POST /api/tasks
tasksRouter.post("/", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return Errors.badRequest("Request body must be valid JSON");
  }

  const validation = validateCreateTask(body);
  if (!validation.ok) {
    return Errors.badRequest("Validation failed", validation.errors);
  }

  const userId = c.get("userId");
  const task = await createTask(c.env.DB, userId, body as Parameters<typeof createTask>[2]);

  return created({ task });
});

// PUT /api/tasks/:id
tasksRouter.put("/:id", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return Errors.badRequest("Request body must be valid JSON");
  }

  const validation = validateUpdateTask(body);
  if (!validation.ok) {
    return Errors.badRequest("Validation failed", validation.errors);
  }

  const userId = c.get("userId");
  const { id } = c.req.param();

  const task = await updateTask(c.env.DB, id, userId, body as Parameters<typeof updateTask>[3]);
  if (!task) return Errors.notFound("task");

  return ok({ task });
});

// DELETE /api/tasks/:id
tasksRouter.delete("/:id", async (c) => {
  const userId = c.get("userId");
  const { id } = c.req.param();

  const deleted = await deleteTask(c.env.DB, id, userId);
  if (!deleted) return Errors.notFound("task");

  return noContent();
});
