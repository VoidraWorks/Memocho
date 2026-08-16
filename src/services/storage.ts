// ─── LocalStorage adapter ─────────────────────────────────────────────────────

const PREFIX = "memocho:";

export const storage = {
  get<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw !== null ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  },

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      console.warn("[storage] Failed to persist", key);
    }
  },

  remove(key: string): void {
    localStorage.removeItem(PREFIX + key);
  },
};
