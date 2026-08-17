// ─── Auth service ─────────────────────────────────────────────────────────────
// Used by login/register screens. Stores tokens via api.ts tokenStore.

import { apiClient, tokenStore } from "./api";

export interface AuthUser {
  id: string;
  email: string;
  createdAt: string;
}

export interface AuthResult {
  ok: boolean;
  error?: string;
  fields?: Record<string, string>;
  user?: AuthUser;
}

export const authService = {
  async register(email: string, password: string): Promise<AuthResult> {
    const result = await apiClient.postAnon<{
      user: { id: string; email: string; created_at: string };
      tokens: { accessToken: string; refreshToken: string };
    }>("/api/auth/register", { email, password });

    if (!result.success) {
      return { ok: false, error: result.error.message, fields: result.error.fields };
    }

    tokenStore.set(result.data.tokens.accessToken, result.data.tokens.refreshToken);
    return {
      ok: true,
      user: {
        id: result.data.user.id,
        email: result.data.user.email,
        createdAt: result.data.user.created_at,
      },
    };
  },

  async login(email: string, password: string): Promise<AuthResult> {
    const result = await apiClient.postAnon<{
      user: { id: string; email: string; created_at: string };
      tokens: { accessToken: string; refreshToken: string };
    }>("/api/auth/login", { email, password });

    if (!result.success) {
      return { ok: false, error: result.error.message, fields: result.error.fields };
    }

    tokenStore.set(result.data.tokens.accessToken, result.data.tokens.refreshToken);
    return {
      ok: true,
      user: {
        id: result.data.user.id,
        email: result.data.user.email,
        createdAt: result.data.user.created_at,
      },
    };
  },

  async logout(): Promise<void> {
    // Best-effort server-side revocation
    try {
      await apiClient.post("/api/auth/logout", {});
    } catch {
      // Ignore failures — tokens cleared locally regardless
    }
    tokenStore.clear();
  },

  isLoggedIn(): boolean {
    return tokenStore.getAccess() !== null;
  },
};
