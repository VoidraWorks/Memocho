// ─── Auth Service ─────────────────────────────────────────────────────────────

import {
  dbGetUserByEmail,
  dbGetUserById,
  dbInsertUser,
  dbInsertRefreshToken,
  dbGetRefreshToken,
  dbRevokeRefreshToken,
  dbRevokeAllUserRefreshTokens,
} from "../db/queries.ts";
import {
  hashPassword,
  verifyPassword,
  signAccessToken,
  signRefreshToken,
  hashToken,
} from "../lib/auth.ts";
import type { AuthTokens, UserRow } from "../types/index.ts";

function now(): string {
  return new Date().toISOString();
}

export interface RegisterInput {
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

function getTTLs(env: { JWT_ACCESS_TTL: string; JWT_REFRESH_TTL: string }): {
  access: number;
  refresh: number;
} {
  return {
    access: parseInt(env.JWT_ACCESS_TTL, 10) || 900,
    refresh: parseInt(env.JWT_REFRESH_TTL, 10) || 2_592_000,
  };
}

export async function register(
  db: D1Database,
  env: { JWT_SECRET: string; JWT_ACCESS_TTL: string; JWT_REFRESH_TTL: string },
  input: RegisterInput
): Promise<{ user: Omit<UserRow, "password_hash">; tokens: AuthTokens }> {
  const existing = await dbGetUserByEmail(db, input.email.toLowerCase());
  if (existing) {
    throw new Error("EMAIL_IN_USE");
  }

  const id = crypto.randomUUID();
  const ts = now();
  const passwordHash = await hashPassword(input.password);

  const user: UserRow = {
    id,
    email: input.email.toLowerCase(),
    password_hash: passwordHash,
    created_at: ts,
    updated_at: ts,
  };
  await dbInsertUser(db, user);

  const tokens = await issueTokens(db, env, user);
  return {
    user: { id: user.id, email: user.email, created_at: user.created_at, updated_at: user.updated_at },
    tokens,
  };
}

export async function login(
  db: D1Database,
  env: { JWT_SECRET: string; JWT_ACCESS_TTL: string; JWT_REFRESH_TTL: string },
  input: LoginInput
): Promise<{ user: Omit<UserRow, "password_hash">; tokens: AuthTokens } | null> {
  const user = await dbGetUserByEmail(db, input.email.toLowerCase());
  if (!user) return null;

  const valid = await verifyPassword(input.password, user.password_hash);
  if (!valid) return null;

  const tokens = await issueTokens(db, env, user);
  return {
    user: { id: user.id, email: user.email, created_at: user.created_at, updated_at: user.updated_at },
    tokens,
  };
}

export async function refreshTokens(
  db: D1Database,
  env: { JWT_SECRET: string; JWT_ACCESS_TTL: string; JWT_REFRESH_TTL: string },
  rawRefreshToken: string
): Promise<AuthTokens | null> {
  const tokenHash = await hashToken(rawRefreshToken);
  const stored = await dbGetRefreshToken(db, tokenHash);

  if (!stored) return null;
  if (stored.revoked === 1) return null;
  if (new Date(stored.expires_at) < new Date()) return null;

  // Rotate: revoke old, issue new
  await dbRevokeRefreshToken(db, tokenHash);

  const user = await dbGetUserById(db, stored.user_id);
  if (!user) return null;

  return issueTokens(db, env, user);
}

export async function logout(
  db: D1Database,
  userId: string
): Promise<void> {
  await dbRevokeAllUserRefreshTokens(db, userId);
}

// ─── Private helpers ──────────────────────────────────────────────────────────

async function issueTokens(
  db: D1Database,
  env: { JWT_SECRET: string; JWT_ACCESS_TTL: string; JWT_REFRESH_TTL: string },
  user: UserRow
): Promise<AuthTokens> {
  const { access, refresh } = getTTLs(env);

  const [accessToken, rawRefreshToken] = await Promise.all([
    signAccessToken({ sub: user.id, email: user.email }, env.JWT_SECRET, access),
    signRefreshToken(user.id, env.JWT_SECRET, refresh),
  ]);

  const tokenHash = await hashToken(rawRefreshToken);
  const expiresAt = new Date(Date.now() + refresh * 1000).toISOString();

  await dbInsertRefreshToken(db, {
    id: crypto.randomUUID(),
    user_id: user.id,
    token_hash: tokenHash,
    expires_at: expiresAt,
  });

  return {
    accessToken,
    refreshToken: rawRefreshToken,
    expiresIn: access,
  };
}
