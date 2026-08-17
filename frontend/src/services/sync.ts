// ─── Sync service ─────────────────────────────────────────────────────────────
// Local-first: UI never waits for this. Sync fires in the background after
// each save (debounced) and on app focus/online events.
//
// Flow:
//   User action → local store → (debounced) syncService.push()
//                                   → POST /api/sync
//                                   → merge server changes into stores
//
// The service is a no-op when the user is not logged in.

import { apiClient, tokenStore } from "./api";
import { storage } from "./storage";

// ─── Types mirrored from the Worker ──────────────────────────────────────────

interface SyncNote {
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

interface SyncTask {
  id: string;
  title: string;
  description?: string | null;
  date: string;
  completed: boolean;
  priority: "none" | "low" | "medium" | "high";
  position: number;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

interface SyncResponse {
  notes: SyncNote[];
  tasks: SyncTask[];
  deletedNoteIds: string[];
  deletedTaskIds: string[];
  syncedAt: string;
}

// ─── Local storage keys ───────────────────────────────────────────────────────

const LAST_SYNCED_KEY = "memocho_last_synced_at";
const NOTES_KEY = "notes";
const TASKS_KEY = "tasks";
const PENDING_DELETES_KEY = "memocho_pending_deletes";

interface PendingDeletes {
  noteIds: string[];
  taskIds: string[];
}

// ─── Sync state ───────────────────────────────────────────────────────────────

let _syncInProgress = false;
let _debounceTimer: ReturnType<typeof setTimeout> | null = null;
const DEBOUNCE_MS = 5_000; // 5 s after last change

// ─── Public API ──────────────────────────────────────────────────────────────

export const syncService = {
  /**
   * Call after any local mutation (note save, task update, etc.).
   * Fires a debounced sync so rapid changes don't spam the API.
   */
  schedule(): void {
    if (!tokenStore.getAccess()) return;
    if (_debounceTimer) clearTimeout(_debounceTimer);
    _debounceTimer = setTimeout(() => {
      void this.push();
    }, DEBOUNCE_MS);
  },

  /** Immediately push local changes and pull remote changes. */
  async push(): Promise<void> {
    if (!tokenStore.getAccess()) return;
    if (_syncInProgress) return;
    if (!navigator.onLine) return;

    _syncInProgress = true;
    try {
      const lastSyncedAt = storage.get<string | null>(LAST_SYNCED_KEY, null);
      const notes = storage.get<SyncNote[]>(NOTES_KEY, []);
      const tasks = storage.get<SyncTask[]>(TASKS_KEY, []);

      // Include soft-deletes that were done locally
      const pending = storage.get<PendingDeletes>(PENDING_DELETES_KEY, {
        noteIds: [],
        taskIds: [],
      });

      // Mark pending deletes in the payloads
      const now = new Date().toISOString();
      const notesPayload: SyncNote[] = notes.map((n) => ({
        ...n,
        deletedAt: pending.noteIds.includes(n.id) ? now : n.deletedAt ?? null,
      }));
      const tasksPayload: SyncTask[] = tasks.map((t) => ({
        ...t,
        deletedAt: pending.taskIds.includes(t.id) ? now : t.deletedAt ?? null,
      }));

      const result = await apiClient.post<SyncResponse>("/api/sync", {
        lastSyncedAt,
        notes: notesPayload,
        tasks: tasksPayload,
      });

      if (!result.success) {
        console.warn("[Sync] Failed:", result.error.message);
        return;
      }

      const { syncedAt } = result.data;
      mergeNotes(result.data.notes, result.data.deletedNoteIds);
      mergeTasks(result.data.tasks, result.data.deletedTaskIds);

      storage.set(LAST_SYNCED_KEY, syncedAt);
      // Clear pending deletes that were successfully synced
      storage.set<PendingDeletes>(PENDING_DELETES_KEY, { noteIds: [], taskIds: [] });
    } catch (err) {
      console.warn("[Sync] Unexpected error:", err);
    } finally {
      _syncInProgress = false;
    }
  },

  /** Pull without pushing (used on app focus to refresh stale data). */
  async pull(): Promise<void> {
    await this.push(); // push + pull happen in the same round-trip
  },

  /** Returns true when the backend is reachable and the user is logged in. */
  async isOnline(): Promise<boolean> {
    if (!navigator.onLine) return false;
    if (!tokenStore.getAccess()) return false;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL ?? "http://localhost:8787"}/api/health`);
      return res.ok;
    } catch {
      return false;
    }
  },

  /** Track a local delete so it gets tombstoned on next sync. */
  markNoteDeleted(id: string): void {
    const pending = storage.get<PendingDeletes>(PENDING_DELETES_KEY, { noteIds: [], taskIds: [] });
    if (!pending.noteIds.includes(id)) {
      pending.noteIds.push(id);
      storage.set(PENDING_DELETES_KEY, pending);
    }
    this.schedule();
  },

  markTaskDeleted(id: string): void {
    const pending = storage.get<PendingDeletes>(PENDING_DELETES_KEY, { noteIds: [], taskIds: [] });
    if (!pending.taskIds.includes(id)) {
      pending.taskIds.push(id);
      storage.set(PENDING_DELETES_KEY, pending);
    }
    this.schedule();
  },
};

// ─── Merge helpers ────────────────────────────────────────────────────────────
// These update localStorage directly. The Zustand stores reload on next action
// or via an explicit loadNotes()/loadTasks() call in the app bootstrap.

function mergeNotes(serverNotes: SyncNote[], deletedIds: string[]): void {
  const local = storage.get<SyncNote[]>(NOTES_KEY, []);
  const map = new Map<string, SyncNote>(local.map((n) => [n.id, n]));

  for (const sn of serverNotes) {
    const existing = map.get(sn.id);
    if (!existing || sn.updatedAt > existing.updatedAt) {
      map.set(sn.id, sn);
    }
  }

  for (const id of deletedIds) {
    map.delete(id);
  }

  storage.set(NOTES_KEY, Array.from(map.values()));
}

function mergeTasks(serverTasks: SyncTask[], deletedIds: string[]): void {
  const local = storage.get<SyncTask[]>(TASKS_KEY, []);
  const map = new Map<string, SyncTask>(local.map((t) => [t.id, t]));

  for (const st of serverTasks) {
    const existing = map.get(st.id);
    if (!existing || st.updatedAt > existing.updatedAt) {
      map.set(st.id, st);
    }
  }

  for (const id of deletedIds) {
    map.delete(id);
  }

  storage.set(TASKS_KEY, Array.from(map.values()));
}

// ─── Auto-sync on window focus and online events ──────────────────────────────

if (typeof window !== "undefined") {
  window.addEventListener("focus", () => syncService.schedule());
  window.addEventListener("online", () => void syncService.push());
}
