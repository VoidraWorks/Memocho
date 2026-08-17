// ─── Notes Routes ─────────────────────────────────────────────────────────────

import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth.ts";
import { listNotes, getNote, createNote, updateNote, deleteNote } from "../services/notes.ts";
import { validateCreateNote, validateUpdateNote, isValidISO } from "../lib/validation.ts";
import { ok, created, noContent, Errors } from "../lib/response.ts";
import type { Env, ContextVariables } from "../types/index.ts";

export const notesRouter = new Hono<{ Bindings: Env; Variables: ContextVariables }>();

// All notes routes require authentication
notesRouter.use("*", authMiddleware);

// GET /api/notes?since=ISO
notesRouter.get("/", async (c) => {
  const userId = c.get("userId");
  const since = c.req.query("since") ?? null;

  if (since !== null && !isValidISO(since)) {
    return Errors.badRequest("'since' must be a valid ISO timestamp");
  }

  const notes = await listNotes(c.env.DB, userId, since);
  return ok({ notes });
});

// GET /api/notes/:id
notesRouter.get("/:id", async (c) => {
  const userId = c.get("userId");
  const { id } = c.req.param();

  const note = await getNote(c.env.DB, id, userId);
  if (!note) return Errors.notFound("note");

  return ok({ note });
});

// POST /api/notes
notesRouter.post("/", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return Errors.badRequest("Request body must be valid JSON");
  }

  const validation = validateCreateNote(body);
  if (!validation.ok) {
    return Errors.badRequest("Validation failed", validation.errors);
  }

  const userId = c.get("userId");
  const note = await createNote(c.env.DB, userId, body as Parameters<typeof createNote>[2]);

  return created({ note });
});

// PUT /api/notes/:id
notesRouter.put("/:id", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return Errors.badRequest("Request body must be valid JSON");
  }

  const validation = validateUpdateNote(body);
  if (!validation.ok) {
    return Errors.badRequest("Validation failed", validation.errors);
  }

  const userId = c.get("userId");
  const { id } = c.req.param();

  const note = await updateNote(c.env.DB, id, userId, body as Parameters<typeof updateNote>[3]);
  if (!note) return Errors.notFound("note");

  return ok({ note });
});

// DELETE /api/notes/:id
notesRouter.delete("/:id", async (c) => {
  const userId = c.get("userId");
  const { id } = c.req.param();

  const deleted = await deleteNote(c.env.DB, id, userId);
  if (!deleted) return Errors.notFound("note");

  return noContent();
});
