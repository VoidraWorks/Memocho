// ─── Response helpers ─────────────────────────────────────────────────────────

import type { ApiSuccess, ApiError } from "../types/index.ts";

export function ok<T>(data: T): Response {
  const body: ApiSuccess<T> = { success: true, data };
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export function created<T>(data: T): Response {
  const body: ApiSuccess<T> = { success: true, data };
  return new Response(JSON.stringify(body), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
}

export function noContent(): Response {
  return new Response(null, { status: 204 });
}

export function err(
  status: number,
  code: string,
  message: string,
  fields?: Record<string, string>
): Response {
  const body: ApiError = {
    success: false,
    error: { code, message, ...(fields ? { fields } : {}) },
  };
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const Errors = {
  badRequest: (message = "Invalid request", fields?: Record<string, string>) =>
    err(400, "BAD_REQUEST", message, fields),

  unauthorized: (message = "Authentication required") =>
    err(401, "UNAUTHORIZED", message),

  forbidden: (message = "Access denied") =>
    err(403, "FORBIDDEN", message),

  notFound: (resource = "Resource") =>
    err(404, `${resource.toUpperCase().replace(" ", "_")}_NOT_FOUND`, `The requested ${resource.toLowerCase()} was not found.`),

  conflict: (message: string) =>
    err(409, "CONFLICT", message),

  tooManyRequests: () =>
    err(429, "RATE_LIMITED", "Too many requests. Please slow down."),

  internal: () =>
    err(500, "INTERNAL_ERROR", "An unexpected error occurred."),
};
