// ─── Validation helpers ───────────────────────────────────────────────────────
// Lightweight hand-written validators — no zod, keeps bundle small.

export type ValidationErrors = Record<string, string>;

export interface ValidationResult {
  ok: boolean;
  errors: ValidationErrors;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const DATE_RE = /^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/;

const PRIORITY_VALUES = new Set(["none", "low", "medium", "high"]);

const THEME_VALUES = new Set(["light", "dark", "system"]);
const FONT_SIZE_VALUES = new Set(["sm", "base", "lg"]);
const BACKGROUND_VALUES = new Set(["solid", "gradient", "transparent"]);

// ─── Primitive validators ─────────────────────────────────────────────────────

export function isValidUUID(v: unknown): v is string {
  return typeof v === "string" && UUID_RE.test(v);
}

export function isValidDate(v: unknown): v is string {
  return typeof v === "string" && DATE_RE.test(v);
}

export function isValidPriority(v: unknown): boolean {
  return typeof v === "string" && PRIORITY_VALUES.has(v);
}

export function isValidISO(v: unknown): v is string {
  if (typeof v !== "string") return false;
  const d = Date.parse(v);
  return !isNaN(d);
}

export function isString(v: unknown): v is string {
  return typeof v === "string";
}

export function isBoolean(v: unknown): v is boolean {
  return typeof v === "boolean";
}

export function isNumber(v: unknown): v is number {
  return typeof v === "number" && isFinite(v);
}

// ─── Body validators ─────────────────────────────────────────────────────────

export function validateCreateNote(body: unknown): ValidationResult {
  const errors: ValidationErrors = {};
  if (typeof body !== "object" || body === null) {
    return { ok: false, errors: { _: "Request body must be a JSON object" } };
  }
  const b = body as Record<string, unknown>;

  if (!isString(b["title"])) {
    errors["title"] = "title is required and must be a string";
  } else if (b["title"].trim().length === 0) {
    errors["title"] = "title cannot be empty";
  } else if ((b["title"] as string).length > 500) {
    errors["title"] = "title must be 500 characters or fewer";
  }

  if (b["content"] !== undefined) {
    if (!isString(b["content"])) {
      errors["content"] = "content must be a string";
    } else if ((b["content"] as string).length > 500_000) {
      errors["content"] = "content must be 500,000 characters or fewer";
    }
  }

  if (b["tags"] !== undefined) {
    if (!Array.isArray(b["tags"])) {
      errors["tags"] = "tags must be an array of strings";
    } else if ((b["tags"] as unknown[]).some((t) => typeof t !== "string")) {
      errors["tags"] = "each tag must be a string";
    } else if ((b["tags"] as string[]).some((t) => t.length > 50)) {
      errors["tags"] = "each tag must be 50 characters or fewer";
    } else if ((b["tags"] as string[]).length > 20) {
      errors["tags"] = "maximum 20 tags per note";
    }
  }

  if (b["color"] !== undefined && b["color"] !== null) {
    if (!isString(b["color"]) || (b["color"] as string).length > 20) {
      errors["color"] = "color must be a string of 20 characters or fewer";
    }
  }

  return { ok: Object.keys(errors).length === 0, errors };
}

export function validateUpdateNote(body: unknown): ValidationResult {
  const errors: ValidationErrors = {};
  if (typeof body !== "object" || body === null) {
    return { ok: false, errors: { _: "Request body must be a JSON object" } };
  }
  const b = body as Record<string, unknown>;

  if (b["title"] !== undefined) {
    if (!isString(b["title"])) {
      errors["title"] = "title must be a string";
    } else if ((b["title"] as string).trim().length === 0) {
      errors["title"] = "title cannot be empty";
    } else if ((b["title"] as string).length > 500) {
      errors["title"] = "title must be 500 characters or fewer";
    }
  }

  if (b["content"] !== undefined) {
    if (!isString(b["content"])) {
      errors["content"] = "content must be a string";
    } else if ((b["content"] as string).length > 500_000) {
      errors["content"] = "content must be 500,000 characters or fewer";
    }
  }

  if (b["pinned"] !== undefined && !isBoolean(b["pinned"])) {
    errors["pinned"] = "pinned must be a boolean";
  }

  if (b["tags"] !== undefined) {
    if (!Array.isArray(b["tags"])) {
      errors["tags"] = "tags must be an array of strings";
    } else if ((b["tags"] as unknown[]).some((t) => typeof t !== "string")) {
      errors["tags"] = "each tag must be a string";
    }
  }

  if (b["color"] !== undefined && b["color"] !== null) {
    if (!isString(b["color"]) || (b["color"] as string).length > 20) {
      errors["color"] = "color must be a string of 20 characters or fewer";
    }
  }

  return { ok: Object.keys(errors).length === 0, errors };
}

export function validateCreateTask(body: unknown): ValidationResult {
  const errors: ValidationErrors = {};
  if (typeof body !== "object" || body === null) {
    return { ok: false, errors: { _: "Request body must be a JSON object" } };
  }
  const b = body as Record<string, unknown>;

  if (!isString(b["title"]) || (b["title"] as string).trim().length === 0) {
    errors["title"] = "title is required and cannot be empty";
  } else if ((b["title"] as string).length > 500) {
    errors["title"] = "title must be 500 characters or fewer";
  }

  if (!isValidDate(b["date"])) {
    errors["date"] = "date is required in YYYY-MM-DD format";
  }

  if (b["description"] !== undefined && b["description"] !== null) {
    if (!isString(b["description"])) {
      errors["description"] = "description must be a string";
    } else if ((b["description"] as string).length > 10_000) {
      errors["description"] = "description must be 10,000 characters or fewer";
    }
  }

  if (b["priority"] !== undefined && !isValidPriority(b["priority"])) {
    errors["priority"] = "priority must be one of: none, low, medium, high";
  }

  return { ok: Object.keys(errors).length === 0, errors };
}

export function validateUpdateTask(body: unknown): ValidationResult {
  const errors: ValidationErrors = {};
  if (typeof body !== "object" || body === null) {
    return { ok: false, errors: { _: "Request body must be a JSON object" } };
  }
  const b = body as Record<string, unknown>;

  if (b["title"] !== undefined) {
    if (!isString(b["title"]) || (b["title"] as string).trim().length === 0) {
      errors["title"] = "title cannot be empty";
    } else if ((b["title"] as string).length > 500) {
      errors["title"] = "title must be 500 characters or fewer";
    }
  }

  if (b["date"] !== undefined && !isValidDate(b["date"])) {
    errors["date"] = "date must be in YYYY-MM-DD format";
  }

  if (b["priority"] !== undefined && !isValidPriority(b["priority"])) {
    errors["priority"] = "priority must be one of: none, low, medium, high";
  }

  if (b["completed"] !== undefined && !isBoolean(b["completed"])) {
    errors["completed"] = "completed must be a boolean";
  }

  if (b["pinned"] !== undefined && !isBoolean(b["pinned"])) {
    errors["pinned"] = "pinned must be a boolean";
  }

  if (b["position"] !== undefined && (!isNumber(b["position"]) || (b["position"] as number) < 0)) {
    errors["position"] = "position must be a non-negative number";
  }

  return { ok: Object.keys(errors).length === 0, errors };
}

export function validateRegister(body: unknown): ValidationResult {
  const errors: ValidationErrors = {};
  if (typeof body !== "object" || body === null) {
    return { ok: false, errors: { _: "Request body must be a JSON object" } };
  }
  const b = body as Record<string, unknown>;

  if (!isString(b["email"]) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b["email"] as string)) {
    errors["email"] = "A valid email is required";
  }

  if (!isString(b["password"]) || (b["password"] as string).length < 8) {
    errors["password"] = "Password must be at least 8 characters";
  } else if ((b["password"] as string).length > 128) {
    errors["password"] = "Password must be 128 characters or fewer";
  }

  return { ok: Object.keys(errors).length === 0, errors };
}

export function validateLogin(body: unknown): ValidationResult {
  const errors: ValidationErrors = {};
  if (typeof body !== "object" || body === null) {
    return { ok: false, errors: { _: "Request body must be a JSON object" } };
  }
  const b = body as Record<string, unknown>;

  if (!isString(b["email"])) errors["email"] = "email is required";
  if (!isString(b["password"])) errors["password"] = "password is required";

  return { ok: Object.keys(errors).length === 0, errors };
}

export function validateUpdateSettings(body: unknown): ValidationResult {
  const errors: ValidationErrors = {};
  if (typeof body !== "object" || body === null) {
    return { ok: false, errors: { _: "Request body must be a JSON object" } };
  }
  const b = body as Record<string, unknown>;

  if (b["theme"] !== undefined && !THEME_VALUES.has(b["theme"] as string)) {
    errors["theme"] = "theme must be one of: light, dark, system";
  }
  if (b["fontSize"] !== undefined && !FONT_SIZE_VALUES.has(b["fontSize"] as string)) {
    errors["fontSize"] = "fontSize must be one of: sm, base, lg";
  }
  if (b["background"] !== undefined && !BACKGROUND_VALUES.has(b["background"] as string)) {
    errors["background"] = "background must be one of: solid, gradient, transparent";
  }

  return { ok: Object.keys(errors).length === 0, errors };
}

export function validateSync(body: unknown): ValidationResult {
  const errors: ValidationErrors = {};
  if (typeof body !== "object" || body === null) {
    return { ok: false, errors: { _: "Request body must be a JSON object" } };
  }
  const b = body as Record<string, unknown>;

  if (b["lastSyncedAt"] !== null && !isValidISO(b["lastSyncedAt"])) {
    errors["lastSyncedAt"] = "lastSyncedAt must be an ISO timestamp or null";
  }
  if (!Array.isArray(b["notes"])) {
    errors["notes"] = "notes must be an array";
  }
  if (!Array.isArray(b["tasks"])) {
    errors["tasks"] = "tasks must be an array";
  }

  return { ok: Object.keys(errors).length === 0, errors };
}
