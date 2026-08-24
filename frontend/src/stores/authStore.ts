// ─── Auth store ───────────────────────────────────────────────────────────────
// Tracks whether the user is authenticated (Google OAuth or email/password).

import { create } from "zustand";
import { tokenStore } from "../services/api";
import type { AuthUser } from "../services/auth";

const USER_KEY = "memocho_user";

interface AuthState {
  user: AuthUser | null;
  isLoggedIn: boolean;
  isLoading: boolean;

  // Actions
  setUser: (user: AuthUser) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoggedIn: false,
  isLoading: true,

  hydrate: () => {
    const raw = localStorage.getItem(USER_KEY);
    const hasToken = tokenStore.getAccess() !== null;
    if (raw && hasToken) {
      try {
        const user = JSON.parse(raw) as AuthUser;
        set({ user, isLoggedIn: true, isLoading: false });
        return;
      } catch {
        // corrupt — fall through
      }
    }
    // Clear stale state
    localStorage.removeItem(USER_KEY);
    set({ user: null, isLoggedIn: false, isLoading: false });
  },

  setUser: (user: AuthUser) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ user, isLoggedIn: true, isLoading: false });
  },

  logout: () => {
    tokenStore.clear();
    localStorage.removeItem(USER_KEY);
    set({ user: null, isLoggedIn: false, isLoading: false });
  },
}));
