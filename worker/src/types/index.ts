// ─── Shared types for Memocho Worker ─────────────────────────────────────────

// ─── Cloudflare Worker Env ────────────────────────────────────────────────────

export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  CORS_ORIGIN: string;
  ENVIRONMENT: string;
  JWT_ACCESS_TTL: string;
  JWT_REFRESH_TTL: string;
}

// ─── API Responses ────────────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    fields?: Record<string, string>;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ─── DB Row shapes (as returned from D1) ─────────────────────────────────────

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

export interface NoteRow {
  id: string;
  user_id: string;
  title: string;
  content: string;
  preview: string;
  pinned: number; // SQLite INTEGER 0|1
  color: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface TaskRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  date: string;
  completed: number;
  priority: string;
  position: number;
  pinned: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface TagRow {
  id: string;
  user_id: string;
  name: string;
}

export interface UserSettingsRow {
  user_id: string;
  theme: string;
  font_size: string;
  background: string;
  gradient_from: string | null;
  gradient_to: string | null;
  updated_at: string;
}

export interface RefreshTokenRow {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  created_at: string;
  revoked: number;
}

// ─── Domain types (API-facing, camelCase) ────────────────────────────────────

export type Priority = "none" | "low" | "medium" | "high";
export type ThemeMode = "light" | "dark" | "system";
export type FontSize = "sm" | "base" | "lg";
export type Background = "solid" | "gradient" | "transparent";

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  preview: string;
  pinned: boolean;
  color: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  date: string;
  completed: boolean;
  priority: Priority;
  position: number;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface UserSettings {
  theme: ThemeMode;
  fontSize: FontSize;
  background: Background;
  gradientFrom: string | null;
  gradientTo: string | null;
  updatedAt: string;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface JWTPayload {
  sub: string;   // user id
  email: string;
  iat: number;
  exp: number;
}

// ─── Sync ─────────────────────────────────────────────────────────────────────

export interface SyncPushNote {
  id: string;
  title: string;
  content: string;
  preview: string;
  pinned: boolean;
  color?: string | null;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface SyncPushTask {
  id: string;
  title: string;
  description?: string | null;
  date: string;
  completed: boolean;
  priority: Priority;
  position: number;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface SyncRequest {
  lastSyncedAt: string | null; // ISO timestamp or null for first sync
  notes: SyncPushNote[];
  tasks: SyncPushTask[];
}

export interface SyncResponse {
  notes: Note[];
  tasks: Task[];
  deletedNoteIds: string[];
  deletedTaskIds: string[];
  syncedAt: string;
}

// ─── Hono context variables ───────────────────────────────────────────────────

export interface ContextVariables {
  userId: string;
  userEmail: string;
}

// ─── Input types ─────────────────────────────────────────────────────────────

export interface CreateNoteInput {
  title: string;
  content?: string;
  tags?: string[];
  color?: string;
}

export interface UpdateNoteInput {
  title?: string;
  content?: string;
  preview?: string;
  pinned?: boolean;
  tags?: string[];
  color?: string | null;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  date: string;
  priority?: Priority;
  pinned?: boolean;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  date?: string;
  completed?: boolean;
  priority?: Priority;
  position?: number;
  pinned?: boolean;
}

export interface UpdateSettingsInput {
  theme?: ThemeMode;
  fontSize?: FontSize;
  background?: Background;
  gradientFrom?: string | null;
  gradientTo?: string | null;
}
