// ─── HTTP API client ──────────────────────────────────────────────────────────
// Thin wrapper around fetch() used by all frontend services that call the Worker.
// Base URL is read from VITE_API_URL (set in .env.local for dev).

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:8787";

const AUTH_TOKEN_KEY = "memocho_access_token";
const REFRESH_TOKEN_KEY = "memocho_refresh_token";

// ─── Token management ─────────────────────────────────────────────────────────

export const tokenStore = {
  getAccess(): string | null {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  },
  getRefresh(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },
  set(accessToken: string, refreshToken: string): void {
    localStorage.setItem(AUTH_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },
  clear(): void {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

// ─── API response shape ───────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: { code: string; message: string; fields?: Record<string, string> };
}

export type ApiResult<T> = ApiSuccess<T> | ApiError;

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  authenticated = true
): Promise<ApiResult<T>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (authenticated) {
    const token = tokenStore.getAccess();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { ...headers, ...(options.headers as Record<string, string> | undefined) },
    });
  } catch {
    return {
      success: false,
      error: { code: "NETWORK_ERROR", message: "Unable to reach the server. Check your internet connection." },
    };
  }

  // 204 No Content
  if (response.status === 204) {
    return { success: true, data: null as T };
  }

  let json: ApiResult<T>;
  try {
    json = await response.json() as ApiResult<T>;
  } catch {
    return {
      success: false,
      error: { code: "PARSE_ERROR", message: "Unexpected response from server." },
    };
  }

  // If token expired, attempt a transparent refresh and retry once
  if (!json.success && (json as ApiError).error.code === "UNAUTHORIZED" && authenticated) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      return apiFetch<T>(path, options, true);
    }
    tokenStore.clear();
  }

  return json;
}

async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = tokenStore.getRefresh();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    const json = (await res.json()) as ApiResult<{ tokens: { accessToken: string; refreshToken: string } }>;
    if (json.success) {
      tokenStore.set(json.data.tokens.accessToken, json.data.tokens.refreshToken);
      return true;
    }
  } catch {
    // Ignore errors during refresh
  }
  return false;
}

// ─── Exported helpers ─────────────────────────────────────────────────────────

export const apiClient = {
  get<T>(path: string): Promise<ApiResult<T>> {
    return apiFetch<T>(path, { method: "GET" });
  },
  post<T>(path: string, body: unknown): Promise<ApiResult<T>> {
    return apiFetch<T>(path, { method: "POST", body: JSON.stringify(body) });
  },
  put<T>(path: string, body: unknown): Promise<ApiResult<T>> {
    return apiFetch<T>(path, { method: "PUT", body: JSON.stringify(body) });
  },
  delete<T = null>(path: string): Promise<ApiResult<T>> {
    return apiFetch<T>(path, { method: "DELETE" });
  },
  /** Unauthenticated — for login / register. */
  postAnon<T>(path: string, body: unknown): Promise<ApiResult<T>> {
    return apiFetch<T>(path, { method: "POST", body: JSON.stringify(body) }, false);
  },
  isLoggedIn(): boolean {
    return tokenStore.getAccess() !== null;
  },
};
