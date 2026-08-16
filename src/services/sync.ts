// ─── Sync service stub ────────────────────────────────────────────────────────
// This will be implemented when the Cloudflare Worker backend is connected.
// The UI only calls this service; it never touches fetch() directly.

export const syncService = {
  /** Push local changes to the backend. No-op in local-only mode. */
  async push(): Promise<void> {
    // TODO: POST /api/sync with local delta
  },

  /** Pull remote changes from the backend. No-op in local-only mode. */
  async pull(): Promise<void> {
    // TODO: GET /api/sync/pull
  },

  /** Returns true when backend is reachable. */
  async isOnline(): Promise<boolean> {
    return navigator.onLine;
  },
};
