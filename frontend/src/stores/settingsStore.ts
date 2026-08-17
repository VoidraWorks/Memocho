import { create } from "zustand";
import { storage } from "../services/storage";
import type { AppSettings, ThemeMode } from "../types";

const SETTINGS_KEY = "settings";

const defaults: AppSettings = {
  appearance: {
    theme: "system",
    opacity: 1,
    background: "solid",
    fontSize: "base",
  },
  window: {
    alwaysOnTop: false,
    startMinimized: false,
    rememberPosition: true,
    rememberSize: true,
  },
  application: {
    globalShortcut: "CommandOrControl+Shift+M",
    startWithWindows: false,
    minimizeToTray: true,
  },
};

interface SettingsState {
  settings: AppSettings;
  resolvedTheme: "light" | "dark"; // actual resolved theme (system → light/dark)

  // Actions
  load: () => void;
  setTheme: (theme: ThemeMode) => void;
  setOpacity: (opacity: number) => void;
  setBackground: (bg: AppSettings["appearance"]["background"]) => void;
  setFontSize: (size: AppSettings["appearance"]["fontSize"]) => void;
  setWindowPref: <K extends keyof AppSettings["window"]>(key: K, val: AppSettings["window"][K]) => void;
  setAppPref: <K extends keyof AppSettings["application"]>(key: K, val: AppSettings["application"][K]) => void;
}

function resolveTheme(mode: ThemeMode): "light" | "dark" {
  if (mode === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return mode;
}

function applyTheme(resolved: "light" | "dark") {
  const root = document.documentElement;
  if (resolved === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: defaults,
  resolvedTheme: resolveTheme(defaults.appearance.theme),

  load: () => {
    const saved = storage.get<AppSettings>(SETTINGS_KEY, defaults);
    const resolved = resolveTheme(saved.appearance.theme);
    applyTheme(resolved);
    set({ settings: saved, resolvedTheme: resolved });
  },

  setTheme: (theme) => {
    const settings = { ...get().settings, appearance: { ...get().settings.appearance, theme } };
    const resolvedTheme = resolveTheme(theme);
    applyTheme(resolvedTheme);
    storage.set(SETTINGS_KEY, settings);
    set({ settings, resolvedTheme });
  },

  setOpacity: (opacity) => {
    const settings = { ...get().settings, appearance: { ...get().settings.appearance, opacity } };
    storage.set(SETTINGS_KEY, settings);
    set({ settings });
  },

  setBackground: (background) => {
    const settings = { ...get().settings, appearance: { ...get().settings.appearance, background } };
    storage.set(SETTINGS_KEY, settings);
    set({ settings });
  },

  setFontSize: (fontSize) => {
    const settings = { ...get().settings, appearance: { ...get().settings.appearance, fontSize } };
    storage.set(SETTINGS_KEY, settings);
    set({ settings });
    // Apply font-size class to root
    document.documentElement.setAttribute("data-font-size", fontSize);
  },

  setWindowPref: (key, val) => {
    const settings = { ...get().settings, window: { ...get().settings.window, [key]: val } };
    storage.set(SETTINGS_KEY, settings);
    set({ settings });
  },

  setAppPref: (key, val) => {
    const settings = { ...get().settings, application: { ...get().settings.application, [key]: val } };
    storage.set(SETTINGS_KEY, settings);
    set({ settings });
  },
}));
