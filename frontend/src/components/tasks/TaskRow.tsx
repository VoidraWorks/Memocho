import React, { useState } from "react";
import { MoreHorizontal, Pin, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "../../lib/cn";
import { Checkbox } from "../ui/Checkbox";
import { PriorityDot } from "../ui/Badge";
import { Button } from "../ui/Button";
import type { Task, Priority } from "../../types";

interface TaskRowProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  onSetPriority: (id: string, priority: Priority) => void;
  onUpdateTitle: (id: string, title: string) => void;
  onUpdateDescription: (id: string, description: string) => void;
  compact?: boolean;
}

const PRIORITY_OPTIONS: { value: Priority; label: string; dot: string }[] = [
  { value: "none",   label: "No priority",    dot: "bg-surface-300 dark:bg-surface-600" },
  { value: "low",    label: "Low",             dot: "bg-blue-400" },
  { value: "medium", label: "Medium",          dot: "bg-amber-400" },
  { value: "high",   label: "High",            dot: "bg-red-400" },
];

export const TaskRow: React.FC<TaskRowProps> = ({
  task,
  onToggleComplete,
  onDelete,
  onTogglePin,
  onSetPriority,
  onUpdateTitle,
  onUpdateDescription,
  compact = false,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(task.title);
  const [descDraft, setDescDraft] = useState(task.description ?? "");

  const handleTitleBlur = () => {
    setEditingTitle(false);
    if (titleDraft.trim() && titleDraft !== task.title) {
      onUpdateTitle(task.id, titleDraft.trim());
    } else {
      setTitleDraft(task.title);
    }
  };

  const handleDescBlur = () => {
    if (descDraft !== task.description) {
      onUpdateDescription(task.id, descDraft);
    }
  };

  return (
    <div
      className={cn(
        "group relative rounded-md transition-all duration-fast",
        !compact && "hover:bg-surface-50 dark:hover:bg-surface-800/40",
        task.completed && "opacity-60"
      )}
    >
      <div className="flex items-center gap-2 px-1 py-1.5">
        {/* Priority dot */}
        <PriorityDot priority={task.priority} className="ml-0.5" />

        {/* Checkbox */}
        <Checkbox
          checked={task.completed}
          onChange={() => onToggleComplete(task.id)}
          size={compact ? "sm" : "md"}
        />

        {/* Title */}
        {editingTitle ? (
          <input
            autoFocus
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={handleTitleBlur}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleTitleBlur();
              if (e.key === "Escape") {
                setTitleDraft(task.title);
                setEditingTitle(false);
              }
            }}
            className="flex-1 bg-transparent text-sm text-surface-900 dark:text-surface-100 focus:outline-none border-b border-primary-400"
          />
        ) : (
          <span
            className={cn(
              "flex-1 text-sm text-surface-800 dark:text-surface-200 cursor-text select-none",
              task.completed && "line-through text-surface-400 dark:text-surface-600"
            )}
            onClick={() => !compact && setEditingTitle(true)}
          >
            {task.title}
          </span>
        )}

        {/* Controls — visible on hover */}
        {!compact && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-fast">
            {/* Description toggle */}
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setExpanded((e) => !e)}
              className="h-6 w-6"
              title="Toggle description"
            >
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </Button>

            {/* More menu */}
            <div className="relative">
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => setMenuOpen((o) => !o)}
              >
                <MoreHorizontal size={12} />
              </Button>
              {menuOpen && (
                <div
                  className="absolute right-0 top-full mt-1 z-30 bg-surface-0 dark:bg-surface-850 border border-surface-100 dark:border-surface-700/60 rounded-md shadow-md py-1 min-w-[140px]"
                  onMouseLeave={() => setMenuOpen(false)}
                >
                  <p className="px-3 pt-1 pb-0.5 text-xs text-surface-400 dark:text-surface-600 font-medium uppercase tracking-wide">Priority</p>
                  {PRIORITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { onSetPriority(task.id, opt.value); setMenuOpen(false); }}
                      className={cn(
                        "flex items-center gap-2 w-full px-3 py-1.5 text-sm text-left hover:bg-surface-50 dark:hover:bg-surface-800",
                        task.priority === opt.value ? "text-primary-600 dark:text-primary-400 font-medium" : "text-surface-700 dark:text-surface-300"
                      )}
                    >
                      <span className={cn("w-1.5 h-1.5 rounded-full", opt.dot)} />
                      {opt.label}
                    </button>
                  ))}
                  <hr className="my-1 border-surface-100 dark:border-surface-800" />
                  <button
                    onClick={() => { onTogglePin(task.id); setMenuOpen(false); }}
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800"
                  >
                    <Pin size={12} />
                    {task.pinned ? "Unpin" : "Pin"}
                  </button>
                  <button
                    onClick={() => { onDelete(task.id); setMenuOpen(false); }}
                    className="flex items-center gap-2 w-full px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    <Trash2 size={12} />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Description (expandable) */}
      {!compact && expanded && (
        <div className="pl-7 pr-2 pb-2">
          <textarea
            value={descDraft}
            onChange={(e) => setDescDraft(e.target.value)}
            onBlur={handleDescBlur}
            placeholder="Add a description…"
            rows={2}
            className={cn(
              "w-full resize-none text-xs text-surface-600 dark:text-surface-400 placeholder:text-surface-300 dark:placeholder:text-surface-700",
              "bg-transparent focus:outline-none"
            )}
          />
        </div>
      )}
    </div>
  );
};
