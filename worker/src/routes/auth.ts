// ─── Auth Routes ──────────────────────────────────────────────────────────────

import { Hono } from "hono";
import { register, login, refreshTokens, logout } from "../services/auth.ts";
import { validateRegister, validateLogin } from "../lib/validation.ts";
import { ok, created, Errors } from "../lib/response.ts";
import { authMiddleware } from "../middleware/auth.ts";
import type { Env, ContextVariables } from "../types/index.ts";

export const authRouter = new Hono<{ Bindings: Env; Variables: ContextVariables }>();

// POST /api/auth/register
authRouter.post("/register", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return Errors.badRequest("Request body must be valid JSON");
  }

  const validation = validateRegister(body);
  if (!validation.ok) {
    return Errors.badRequest("Validation failed", validation.errors);
  }

  const { email, password } = body as { email: string; password: string };

  try {
    const result = await register(c.env.DB, c.env, { email, password });
    return created({
      user: result.user,
      tokens: result.tokens,
    });
  } catch (e) {
    if (e instanceof Error && e.message === "EMAIL_IN_USE") {
      return Errors.conflict("An account with this email already exists");
    }
    console.error("Register error:", e);
    return Errors.internal();
  }
});

// POST /api/auth/login
authRouter.post("/login", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return Errors.badRequest("Request body must be valid JSON");
  }

  const validation = validateLogin(body);
  if (!validation.ok) {
    return Errors.badRequest("Validation failed", validation.errors);
  }

  const { email, password } = body as { email: string; password: string };

  const result = await login(c.env.DB, c.env, { email, password });
  if (!result) {
    return Errors.unauthorized("Invalid email or password");
  }

  return ok({ user: result.user, tokens: result.tokens });
});

// POST /api/auth/refresh
authRouter.post("/refresh", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return Errors.badRequest("Request body must be valid JSON");
  }

  const b = body as Record<string, unknown>;
  if (typeof b["refreshToken"] !== "string") {
    return Errors.badRequest("refreshToken is required");
  }

  const tokens = await refreshTokens(c.env.DB, c.env, b["refreshToken"]);
  if (!tokens) {
    return Errors.unauthorized("Invalid or expired refresh token");
  }

  return ok({ tokens });
});

// POST /api/auth/logout — requires valid access token
authRouter.post("/logout", authMiddleware, async (c) => {
  await logout(c.env.DB, c.get("userId"));
  return ok({ message: "Logged out successfully" });
});
