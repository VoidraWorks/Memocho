import React, { useState } from "react";
import { Pin, Maximize2, Minus, X, Settings } from "lucide-react";
import { cn } from "../../lib/cn";
import { Checkbox } from "../ui/Checkbox";
import { Button } from "../ui/Button";
import { Tooltip } from "../ui/Tooltip";
import { useTasksStore, selectTodayTasks } from "../../stores/tasksStore";
import { useNotesStore } from "../../stores/notesStore";
import { useUIStore } from "../../stores/uiStore";

interface FloatingWindowProps {
  onExpand: () => void;
  onClose: () => void;
}

export const FloatingWindow: React.FC<FloatingWindowProps> = ({ onExpand, onClose }) => {
  const [pinned, setPinned] = useState(false);
  const [minimized, setMinimized] = useState(false);

  const tasks = useTasksStore((s) => s.tasks);
  const todayTasks = selectTodayTasks(tasks);
  const toggleComplete = useTasksStore((s) => s.toggleComplete);
  const notes = useNotesStore((s) => s.notes);
  const setActiveSection = useUIStore((s) => s.setActiveSection);

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  const recentNote = notes[0];

  if (minimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setMinimized(false)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-0 dark:bg-surface-850 border border-surface-200 dark:border-surface-700 shadow-float text-xs font-medium text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
        >
          <div className="w-4 h-4 rounded-sm bg-gradient-to-br from-primary-400 to-primary-600" />
          Memocho
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 w-72 rounded-xl overflow-hidden shadow-float",
        "bg-surface-0/95 dark:bg-surface-850/95 backdrop-blur-xl",
        "border border-surface-200/60 dark:border-surface-700/40",
        "transition-all duration-slow"
      )}
    >
      {/* Title bar */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-surface-100 dark:border-surface-800/50 drag-region">
        <span className="text-xs font-semibold text-surface-700 dark:text-surface-300 flex-1">
          {today}
        </span>
        <Tooltip content={pinned ? "Unpin" : "Pin on top"}>
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-5 w-5", pinned && "text-primary-500")}
            onClick={() => setPinned((p) => !p)}
          >
            <Pin size={10} className={pinned ? "fill-current" : ""} />
          </Button>
        </Tooltip>
        <Tooltip content="Expand">
          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={onExpand}>
            <Maximize2 size={10} />
          </Button>
        </Tooltip>
        <Tooltip content="Minimize">
          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setMinimized(true)}>
            <Minus size={10} />
          </Button>
        </Tooltip>
        <Tooltip content="Settings">
          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => { onExpand(); setActiveSection("settings"); }}>
            <Settings size={10} />
          </Button>
        </Tooltip>
        <Tooltip content="Close">
          <Button variant="ghost" size="icon" className="h-5 w-5 hover:text-red-500" onClick={onClose}>
            <X size={10} />
          </Button>
        </Tooltip>
      </div>

      {/* Tasks section */}
      <div className="px-3 pt-2.5 pb-2">
        <p className="text-xs font-semibold text-surface-400 dark:text-surface-600 uppercase tracking-wide mb-2">
          Today
        </p>
        {todayTasks.length === 0 ? (
          <p className="text-xs text-surface-400 dark:text-surface-600 py-1">
            No tasks for today.
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {todayTasks.slice(0, 6).map((task) => (
              <div key={task.id} className="flex items-center gap-2">
                <Checkbox
                  checked={task.completed}
                  onChange={() => toggleComplete(task.id)}
                  size="sm"
                />
                <span
                  className={cn(
                    "text-xs text-surface-800 dark:text-surface-200 truncate",
                    task.completed && "line-through text-surface-400 dark:text-surface-600"
                  )}
                >
                  {task.title}
                </span>
              </div>
            ))}
            {todayTasks.length > 6 && (
              <p className="text-xs text-surface-400 dark:text-surface-600 pl-5">
                +{todayTasks.length - 6} more
              </p>
            )}
          </div>
        )}
      </div>

      {/* Recent note preview */}
      {recentNote && (
        <>
          <div className="mx-3 border-t border-surface-100 dark:border-surface-800/50" />
          <div className="px-3 py-2.5">
            <p className="text-xs font-semibold text-surface-400 dark:text-surface-600 uppercase tracking-wide mb-1">
              Recent Note
            </p>
            <p className="text-xs font-medium text-surface-800 dark:text-surface-200 truncate">
              {recentNote.title || "Untitled"}
            </p>
            {recentNote.preview && (
              <p className="text-xs text-surface-500 dark:text-surface-500 mt-0.5 line-clamp-2 leading-relaxed">
                {recentNote.preview}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
};
