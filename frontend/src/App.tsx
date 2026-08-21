import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import { AppShell } from "./components/layout/AppShell";
import { FloatingWindow } from "./components/layout/FloatingWindow";
import { StickyNoteWindow } from "./components/sticky/StickyNoteWindow";
import { useSettingsStore } from "./stores/settingsStore";
import { useNotesStore } from "./stores/notesStore";
import { useTasksStore } from "./stores/tasksStore";
import { useUIStore } from "./stores/uiStore";
import { storage } from "./services/storage";
import type { Note } from "./types";

function App() {
  const [windowMode, setWindowMode] = useState<"main" | "floating" | "sticky">("main");

  const loadSettings = useSettingsStore((s) => s.load);
  const loadNotes    = useNotesStore((s) => s.loadNotes);
  const loadTasks    = useTasksStore((s) => s.loadTasks);
  const isFloating   = useUIStore((s) => s.isFloating);
  const toggleFloating = useUIStore((s) => s.toggleFloating);
  const setFloating  = useUIStore((s) => s.setFloating);

  // Detect window mode on mount
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash) {
      // Sticky window — note ID is in the hash
      setWindowMode("sticky");
      return;
    }
    // Normal window — bootstrap data
    loadSettings();
    loadNotes();
    loadTasks();
  }, [loadSettings, loadNotes, loadTasks]);

  // Track floating state
  useEffect(() => {
    if (windowMode === "sticky") return;
    setWindowMode(isFloating ? "floating" : "main");
  }, [isFloating, windowMode, setFloating]);

  // Keyboard shortcut: Ctrl+Shift+F → toggle floating
  useEffect(() => {
    if (windowMode === "sticky") return;
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "F") {
        e.preventDefault();
        toggleFloating();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggleFloating, windowMode]);

  // Cross-window sync: main window listens for note updates from sticky windows
  useEffect(() => {
    if (windowMode !== "main") return;

    const unlisten = listen<{ noteId: string; note: Note }>("note-updated", () => {
      // Read fresh data from localStorage (sticky window already wrote it)
      const notes = storage.get<Note[]>("notes", []);
      useNotesStore.setState({ notes });
    });

    return () => { unlisten.then((fn) => fn()); };
  }, [windowMode]);

  // Sticky note window
  if (windowMode === "sticky") {
    return (
      <div className="h-screen w-screen bg-transparent">
        <StickyNoteWindow />
      </div>
    );
  }

  // Floating compact window
  if (windowMode === "floating") {
    return (
      <div className="h-screen w-screen bg-transparent">
        <FloatingWindow
          onExpand={() => setFloating(false)}
          onClose={() => setFloating(false)}
        />
      </div>
    );
  }

  // Full app
  return <AppShell />;
}

export default App;
