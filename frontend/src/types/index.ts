// ─── Shared types for the Memocho frontend ───────────────────────────────────

export type ThemeMode = "light" | "dark" | "system";
export type Priority = "none" | "low" | "medium" | "high";
export type NavSection = "today" | "notes" | "tasks" | "planner" | "pinned" | "settings";

// ─── Task ─────────────────────────────────────────────────────────────────────

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: Priority;
  date: string; // ISO date string YYYY-MM-DD
  order: number;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CreateTaskInput = Pick<Task, "title" | "date"> & Partial<Pick<Task, "description" | "priority">>;
export type UpdateTaskInput = Partial<Omit<Task, "id" | "createdAt">>;

// ─── Note ─────────────────────────────────────────────────────────────────────

export interface Note {
  id: string;
  title: string;
  content: string; // TipTap JSON serialised as string
  preview: string; // Plain-text preview (first ~120 chars)
  pinned: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export type CreateNoteInput = Pick<Note, "title"> & Partial<Pick<Note, "content" | "tags">>;
export type UpdateNoteInput = Partial<Omit<Note, "id" | "createdAt">>;

// ─── Settings ─────────────────────────────────────────────────────────────────

export interface AppearanceSettings {
  theme: ThemeMode;
  opacity: number; // 0.1 – 1.0
  background: "solid" | "gradient" | "transparent";
  gradientFrom?: string;
  gradientTo?: string;
  fontSize: "sm" | "base" | "lg";
}

export interface WindowSettings {
  alwaysOnTop: boolean;
  startMinimized: boolean;
  rememberPosition: boolean;
  rememberSize: boolean;
}

export interface ApplicationSettings {
  globalShortcut: string;
  startWithWindows: boolean;
  minimizeToTray: boolean;
}

export interface AppSettings {
  appearance: AppearanceSettings;
  window: WindowSettings;
  application: ApplicationSettings;
}

// ─── Planner ──────────────────────────────────────────────────────────────────

export interface PlannerDay {
  date: string; // YYYY-MM-DD
  tasks: Task[];
}

// ─── UI State ─────────────────────────────────────────────────────────────────

export interface ModalState {
  type: "task-detail" | "note-delete" | "task-delete" | null;
  payload?: unknown;
}
