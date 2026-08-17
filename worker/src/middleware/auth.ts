// ─── Auth Middleware ──────────────────────────────────────────────────────────
// Verifies the Bearer JWT and injects userId + userEmail into Hono context.

import type { MiddlewareHandler } from "hono";
import { verifyToken } from "../lib/auth.ts";
import { Errors } from "../lib/response.ts";
import type { Env, ContextVariables } from "../types/index.ts";

export const authMiddleware: MiddlewareHandler<{
  Bindings: Env;
  Variables: ContextVariables;
}> = async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return Errors.unauthorized();
  }

  const token = authHeader.slice(7);

  if (!c.env.JWT_SECRET) {
    console.error("JWT_SECRET is not configured");
    return Errors.internal();
  }

  const payload = await verifyToken(token, c.env.JWT_SECRET);

  if (!payload) {
    return Errors.unauthorized("Invalid or expired token");
  }

  c.set("userId", payload.sub);
  c.set("userEmail", payload.email);

  await next();
};
