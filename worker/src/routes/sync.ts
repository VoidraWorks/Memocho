// ─── Sync Routes ──────────────────────────────────────────────────────────────

import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth.ts";
import { runSync } from "../services/sync.ts";
import { validateSync } from "../lib/validation.ts";
import { ok, Errors } from "../lib/response.ts";
import type { Env, ContextVariables, SyncRequest } from "../types/index.ts";

export const syncRouter = new Hono<{ Bindings: Env; Variables: ContextVariables }>();

syncRouter.use("*", authMiddleware);

// POST /api/sync
// Body: { lastSyncedAt: ISO | null, notes: SyncPushNote[], tasks: SyncPushTask[] }
// Response: { notes, tasks, deletedNoteIds, deletedTaskIds, syncedAt }
syncRouter.post("/", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return Errors.badRequest("Request body must be valid JSON");
  }

  const validation = validateSync(body);
  if (!validation.ok) {
    return Errors.badRequest("Validation failed", validation.errors);
  }

  const userId = c.get("userId");
  const payload = body as SyncRequest;

  const result = await runSync(c.env.DB, userId, payload);
  return ok(result);
});
