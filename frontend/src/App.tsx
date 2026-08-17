import { useEffect } from "react";
import { AppShell } from "./components/layout/AppShell";
import { FloatingWindow } from "./components/layout/FloatingWindow";
import { useSettingsStore } from "./stores/settingsStore";
import { useNotesStore } from "./stores/notesStore";
import { useTasksStore } from "./stores/tasksStore";
import { useUIStore } from "./stores/uiStore";

function App() {
  const loadSettings = useSettingsStore((s) => s.load);
  const loadNotes    = useNotesStore((s) => s.loadNotes);
  const loadTasks    = useTasksStore((s) => s.loadTasks);
  const isFloating   = useUIStore((s) => s.isFloating);
  const toggleFloating = useUIStore((s) => s.toggleFloating);
  const setFloating  = useUIStore((s) => s.setFloating);

  // Bootstrap app data
  useEffect(() => {
    loadSettings();
    loadNotes();
    loadTasks();
  }, [loadSettings, loadNotes, loadTasks]);

  // Keyboard shortcut: Ctrl+Shift+F → toggle floating
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "F") {
        e.preventDefault();
        toggleFloating();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggleFloating]);

  if (isFloating) {
    return (
      <div className="h-screen w-screen bg-transparent">
        <FloatingWindow
          onExpand={() => setFloating(false)}
          onClose={() => setFloating(false)}
        />
      </div>
    );
  }

  return <AppShell />;
}

export default App;
