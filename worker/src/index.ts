// ─── Memocho Worker — Entry Point ─────────────────────────────────────────────

import { Hono } from "hono";
import { cors } from "hono/cors";
import { authRouter } from "./routes/auth.ts";
import { notesRouter } from "./routes/notes.ts";
import { tasksRouter } from "./routes/tasks.ts";
import { settingsRouter } from "./routes/settings.ts";
import { syncRouter } from "./routes/sync.ts";
import { Errors } from "./lib/response.ts";
import type { Env, ContextVariables } from "./types/index.ts";

const app = new Hono<{ Bindings: Env; Variables: ContextVariables }>();

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(
  "*",
  cors({
    origin: (origin, c) => {
      const allowed = c.env.CORS_ORIGIN;
      // In dev allow all; in production restrict to the configured origin
      if (allowed === "*") return "*";
      if (origin === allowed) return origin;
      // Always allow Tauri's local protocol
      if (origin === "tauri://localhost" || origin === "https://tauri.localhost") {
        return origin;
      }
      return null;
    },
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    maxAge: 86400,
  })
);

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/api/health", (c) => {
  return c.json({
    success: true,
    data: {
      status: "ok",
      environment: c.env.ENVIRONMENT ?? "unknown",
      timestamp: new Date().toISOString(),
    },
  });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.route("/api/auth", authRouter);
app.route("/api/notes", notesRouter);
app.route("/api/tasks", tasksRouter);
app.route("/api/settings", settingsRouter);
app.route("/api/sync", syncRouter);

// ── 404 catch-all ─────────────────────────────────────────────────────────────
app.notFound(() => {
  return Errors.notFound("endpoint");
});

// ── Global error handler ──────────────────────────────────────────────────────
app.onError((err, c) => {
  // Never expose internal error details to clients
  console.error(`[${c.req.method}] ${c.req.url}`, err.message);
  return Errors.internal();
});

export default app;
