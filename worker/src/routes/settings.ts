// ─── Settings Routes ──────────────────────────────────────────────────────────

import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth.ts";
import { dbGetSettings, dbUpsertSettings } from "../db/queries.ts";
import { validateUpdateSettings } from "../lib/validation.ts";
import { ok, Errors } from "../lib/response.ts";
import type { Env, ContextVariables, UserSettings, UserSettingsRow } from "../types/index.ts";

export const settingsRouter = new Hono<{ Bindings: Env; Variables: ContextVariables }>();

settingsRouter.use("*", authMiddleware);

const DEFAULT_SETTINGS: Omit<UserSettings, "updatedAt"> = {
  theme: "system",
  fontSize: "base",
  background: "solid",
  gradientFrom: null,
  gradientTo: null,
};

function rowToSettings(row: UserSettingsRow): UserSettings {
  return {
    theme: row.theme as UserSettings["theme"],
    fontSize: row.font_size as UserSettings["fontSize"],
    background: row.background as UserSettings["background"],
    gradientFrom: row.gradient_from,
    gradientTo: row.gradient_to,
    updatedAt: row.updated_at,
  };
}

// GET /api/settings
settingsRouter.get("/", async (c) => {
  const userId = c.get("userId");
  const row = await dbGetSettings(c.env.DB, userId);

  if (!row) {
    // Return defaults if not yet initialized
    return ok({
      settings: { ...DEFAULT_SETTINGS, updatedAt: new Date().toISOString() },
    });
  }

  return ok({ settings: rowToSettings(row) });
});

// PUT /api/settings
settingsRouter.put("/", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return Errors.badRequest("Request body must be valid JSON");
  }

  const validation = validateUpdateSettings(body);
  if (!validation.ok) {
    return Errors.badRequest("Validation failed", validation.errors);
  }

  const userId = c.get("userId");
  const b = body as Record<string, unknown>;
  const now = new Date().toISOString();

  // Merge with existing or defaults
  const existing = await dbGetSettings(c.env.DB, userId);
  const current: UserSettingsRow = existing ?? {
    user_id: userId,
    theme: DEFAULT_SETTINGS.theme,
    font_size: DEFAULT_SETTINGS.fontSize,
    background: DEFAULT_SETTINGS.background,
    gradient_from: null,
    gradient_to: null,
    updated_at: now,
  };

  const updated: UserSettingsRow = {
    user_id: userId,
    theme: (b["theme"] as string | undefined) ?? current.theme,
    font_size: (b["fontSize"] as string | undefined) ?? current.font_size,
    background: (b["background"] as string | undefined) ?? current.background,
    gradient_from: (b["gradientFrom"] as string | null | undefined) ?? current.gradient_from,
    gradient_to: (b["gradientTo"] as string | null | undefined) ?? current.gradient_to,
    updated_at: now,
  };

  await dbUpsertSettings(c.env.DB, updated);
  return ok({ settings: rowToSettings(updated) });
});
