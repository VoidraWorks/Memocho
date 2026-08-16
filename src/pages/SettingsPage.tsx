import React from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { useSettingsStore } from "../stores/settingsStore";
import { cn } from "../lib/cn";
import type { ThemeMode } from "../types";

// ── Reusable settings primitives ──────────────────────────────────────────────

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-8">
    <h2 className="text-xs font-semibold text-surface-400 dark:text-surface-600 uppercase tracking-widest mb-4">
      {title}
    </h2>
    <div className="flex flex-col gap-3">{children}</div>
  </div>
);

const SettingRow: React.FC<{
  label: string;
  description?: string;
  children: React.ReactNode;
}> = ({ label, description, children }) => (
  <div className="flex items-center justify-between gap-4">
    <div>
      <p className="text-sm font-medium text-surface-800 dark:text-surface-200">{label}</p>
      {description && (
        <p className="text-xs text-surface-400 dark:text-surface-600 mt-0.5">{description}</p>
      )}
    </div>
    <div className="flex-shrink-0">{children}</div>
  </div>
);

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void }> = ({
  checked,
  onChange,
}) => (
  <button
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={cn(
      "relative w-9 h-5 rounded-full transition-colors duration-fast focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-offset-1",
      checked ? "bg-primary-500" : "bg-surface-200 dark:bg-surface-700"
    )}
  >
    <span
      className={cn(
        "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-fast",
        checked ? "translate-x-4" : "translate-x-0.5"
      )}
    />
  </button>
);

const Slider: React.FC<{
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  label?: string;
}> = ({ value, min, max, step, onChange, label }) => (
  <div className="flex items-center gap-3">
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-28 accent-primary-500"
    />
    {label && (
      <span className="text-xs text-surface-500 dark:text-surface-400 w-8 text-right">
        {label}
      </span>
    )}
  </div>
);

// ── Theme Selector ─────────────────────────────────────────────────────────────

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
  { value: "light",  label: "Light",  icon: <Sun size={14} /> },
  { value: "dark",   label: "Dark",   icon: <Moon size={14} /> },
  { value: "system", label: "System", icon: <Monitor size={14} /> },
];

const ThemeSelector: React.FC<{
  value: ThemeMode;
  onChange: (v: ThemeMode) => void;
}> = ({ value, onChange }) => (
  <div className="flex gap-1 p-0.5 rounded-lg bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700">
    {THEME_OPTIONS.map((opt) => (
      <button
        key={opt.value}
        onClick={() => onChange(opt.value)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-fast",
          value === opt.value
            ? "bg-surface-0 dark:bg-surface-700 text-surface-900 dark:text-surface-100 shadow-subtle"
            : "text-surface-500 dark:text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
        )}
      >
        {opt.icon}
        {opt.label}
      </button>
    ))}
  </div>
);

// ── Font Size Selector ─────────────────────────────────────────────────────────

type FontSize = "sm" | "base" | "lg";
const FONT_OPTIONS: { value: FontSize; label: string }[] = [
  { value: "sm",   label: "Small" },
  { value: "base", label: "Medium" },
  { value: "lg",   label: "Large" },
];

const FontSizeSelector: React.FC<{
  value: FontSize;
  onChange: (v: FontSize) => void;
}> = ({ value, onChange }) => (
  <div className="flex gap-1 p-0.5 rounded-lg bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700">
    {FONT_OPTIONS.map((opt) => (
      <button
        key={opt.value}
        onClick={() => onChange(opt.value)}
        className={cn(
          "flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-fast",
          value === opt.value
            ? "bg-surface-0 dark:bg-surface-700 text-surface-900 dark:text-surface-100 shadow-subtle"
            : "text-surface-500 dark:text-surface-500 hover:text-surface-700 dark:hover:text-surface-300"
        )}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

// ── Main Settings Page ─────────────────────────────────────────────────────────

export const SettingsPage: React.FC = () => {
  const { settings, setTheme, setOpacity, setFontSize, setWindowPref, setAppPref } =
    useSettingsStore();

  const { appearance, window: win, application: app } = settings;

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-lg mx-auto px-6 py-8">
        <h1 className="text-xl font-bold text-surface-900 dark:text-surface-100 mb-8">
          Settings
        </h1>

        {/* Appearance */}
        <Section title="Appearance">
          <SettingRow label="Theme" description="Choose your preferred color scheme">
            <ThemeSelector value={appearance.theme} onChange={setTheme} />
          </SettingRow>

          <SettingRow label="Font size">
            <FontSizeSelector value={appearance.fontSize} onChange={setFontSize} />
          </SettingRow>

          <SettingRow
            label="Window opacity"
            description={`${Math.round(appearance.opacity * 100)}%`}
          >
            <Slider
              value={appearance.opacity}
              min={0.4}
              max={1}
              step={0.05}
              onChange={setOpacity}
              label={`${Math.round(appearance.opacity * 100)}%`}
            />
          </SettingRow>

          <SettingRow label="Background style">
            <div className="flex gap-1.5">
              {(["solid", "gradient", "transparent"] as const).map((bg) => (
                <button
                  key={bg}
                  className={cn(
                    "px-3 py-1 rounded-md text-xs font-medium capitalize transition-all duration-fast",
                    "border",
                    appearance.background === bg
                      ? "border-primary-400 text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20"
                      : "border-surface-200 dark:border-surface-700 text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800"
                  )}
                  onClick={() =>
                    useSettingsStore.getState().setBackground(bg)
                  }
                >
                  {bg}
                </button>
              ))}
            </div>
          </SettingRow>
        </Section>

        {/* Window */}
        <Section title="Window">
          <SettingRow label="Always on top" description="Keep the floating window above others">
            <Toggle checked={win.alwaysOnTop} onChange={(v) => setWindowPref("alwaysOnTop", v)} />
          </SettingRow>
          <SettingRow label="Start minimized" description="Launch in the system tray">
            <Toggle checked={win.startMinimized} onChange={(v) => setWindowPref("startMinimized", v)} />
          </SettingRow>
          <SettingRow label="Remember position">
            <Toggle checked={win.rememberPosition} onChange={(v) => setWindowPref("rememberPosition", v)} />
          </SettingRow>
          <SettingRow label="Remember size">
            <Toggle checked={win.rememberSize} onChange={(v) => setWindowPref("rememberSize", v)} />
          </SettingRow>
        </Section>

        {/* Application */}
        <Section title="Application">
          <SettingRow label="Global shortcut" description="Quick open/hide from anywhere">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-800">
              <span className="text-xs font-mono text-surface-700 dark:text-surface-300">
                {app.globalShortcut}
              </span>
            </div>
          </SettingRow>
          <SettingRow label="Start with Windows" description="Launch automatically on login">
            <Toggle checked={app.startWithWindows} onChange={(v) => setAppPref("startWithWindows", v)} />
          </SettingRow>
          <SettingRow label="Minimize to tray" description="Hide to system tray when closed">
            <Toggle checked={app.minimizeToTray} onChange={(v) => setAppPref("minimizeToTray", v)} />
          </SettingRow>
        </Section>

        {/* About */}
        <div className="pt-4 border-t border-surface-100 dark:border-surface-800/50">
          <p className="text-xs text-surface-400 dark:text-surface-600">
            Memocho · v0.1.0 · Built with Tauri 2 + React
          </p>
        </div>
      </div>
    </div>
  );
};
