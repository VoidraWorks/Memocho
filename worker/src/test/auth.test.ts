// ─── Auth Tests ───────────────────────────────────────────────────────────────

import { describe, it, expect, beforeAll } from "vitest";
import { env } from "cloudflare:test";
import { SELF } from "cloudflare:test";
import { migrateDb, authedFetch } from "./helpers.ts";

beforeAll(async () => {
  await migrateDb(env as unknown as { DB: D1Database });
});

const baseUrl = "http://worker/api/auth";

describe("POST /api/auth/register", () => {
  it("creates a new user and returns tokens", async () => {
    const res = await SELF.fetch(`${baseUrl}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "auth_new@example.com", password: "password123" }),
    });
    expect(res.status).toBe(201);
    const json = (await res.json()) as { success: boolean; data: { tokens: { accessToken: string } } };
    expect(json.success).toBe(true);
    expect(json.data.tokens.accessToken).toBeTruthy();
  });

  it("rejects duplicate email", async () => {
    const payload = { email: "auth_dup@example.com", password: "password123" };
    await SELF.fetch(`${baseUrl}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const res2 = await SELF.fetch(`${baseUrl}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    expect(res2.status).toBe(409);
    const json = (await res2.json()) as { success: boolean; error: { code: string } };
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("CONFLICT");
  });

  it("rejects short password", async () => {
    const res = await SELF.fetch(`${baseUrl}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "short@example.com", password: "abc" }),
    });
    expect(res.status).toBe(400);
    const json = (await res.json()) as { success: boolean };
    expect(json.success).toBe(false);
  });

  it("rejects invalid email", async () => {
    const res = await SELF.fetch(`${baseUrl}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "not-an-email", password: "password123" }),
    });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  const email = "auth_login@example.com";
  const password = "mypassword99";

  beforeAll(async () => {
    await SELF.fetch(`${baseUrl}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  });

  it("returns tokens for valid credentials", async () => {
    const res = await SELF.fetch(`${baseUrl}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    expect(res.status).toBe(200);
    const json = (await res.json()) as { success: boolean; data: { tokens: { accessToken: string } } };
    expect(json.success).toBe(true);
    expect(json.data.tokens.accessToken).toBeTruthy();
  });

  it("rejects wrong password", async () => {
    const res = await SELF.fetch(`${baseUrl}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "wrongpassword" }),
    });
    expect(res.status).toBe(401);
  });

  it("rejects unknown email", async () => {
    const res = await SELF.fetch(`${baseUrl}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "ghost@example.com", password: "password123" }),
    });
    expect(res.status).toBe(401);
  });
});

describe("Unauthorized access", () => {
  it("rejects request without token", async () => {
    const res = await SELF.fetch("http://worker/api/notes", {
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status).toBe(401);
  });

  it("rejects request with invalid token", async () => {
    const res = await authedFetch("/api/notes", "this-is-not-a-real-jwt");
    expect(res.status).toBe(401);
  });
});

describe("POST /api/auth/refresh", () => {
  it("rotates refresh token and returns new access token", async () => {
    const regRes = await SELF.fetch(`${baseUrl}/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "auth_refresh@example.com", password: "password123" }),
    });
    const regJson = (await regRes.json()) as {
      data: { tokens: { refreshToken: string } };
    };
    const { refreshToken } = regJson.data.tokens;

    const res = await SELF.fetch(`${baseUrl}/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    expect(res.status).toBe(200);
    const json = (await res.json()) as { success: boolean; data: { tokens: { accessToken: string } } };
    expect(json.success).toBe(true);
    expect(json.data.tokens.accessToken).toBeTruthy();
  });
});
