import React, { useState } from "react";
import { Pin, Trash2, Tag, MoreVertical, StickyNote } from "lucide-react";
import { cn } from "../../lib/cn";
import type { Note } from "../../types";

interface NoteCardProps {
  note: Note;
  active?: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
}

// Color accent based on first tag or a hash of the note id
const ACCENT_COLORS = [
  "from-violet-500/20 to-indigo-500/20 border-violet-500/20",
  "from-blue-500/20 to-cyan-500/20 border-blue-500/20",
  "from-emerald-500/20 to-teal-500/20 border-emerald-500/20",
  "from-amber-500/20 to-orange-500/20 border-amber-500/20",
  "from-rose-500/20 to-pink-500/20 border-rose-500/20",
  "from-purple-500/20 to-violet-500/20 border-purple-500/20",
];

const ACCENT_DOT = [
  "bg-violet-500",
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-purple-500",
];

function colorIndex(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return Math.abs(hash) % ACCENT_COLORS.length;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  active,
  onSelect,
  onDelete,
  onTogglePin,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const ci = colorIndex(note.id);
  const accentGradient = ACCENT_COLORS[ci]!;
  const accentDot = ACCENT_DOT[ci]!;

  return (
    <div
      onClick={() => onSelect(note.id)}
      className={cn(
        "group relative p-3 rounded-xl cursor-pointer transition-all duration-150 select-none",
        "border",
        active
          ? `bg-gradient-to-br ${accentGradient} border-opacity-60 shadow-md`
          : "bg-surface-0 dark:bg-surface-850 border-surface-100 dark:border-surface-800/60 hover:bg-surface-50 dark:hover:bg-surface-800/60 hover:border-surface-200 dark:hover:border-surface-700"
      )}
    >
      {/* Color dot + pin */}
      <div className="flex items-center gap-2 mb-1.5">
        <span className={cn("w-2 h-2 rounded-full flex-shrink-0", accentDot)} />
        {note.pinned && (
          <Pin size={9} className="text-amber-500 fill-amber-500 flex-shrink-0" />
        )}
        <span className="flex-1" />
        <span className="text-[10px] text-surface-400 dark:text-surface-600">
          {formatDate(note.updatedAt)}
        </span>
      </div>

      {/* Title */}
      <h3
        className={cn(
          "text-sm font-semibold leading-tight truncate",
          active
            ? "text-surface-900 dark:text-surface-50"
            : "text-surface-800 dark:text-surface-100"
        )}
      >
        {note.title || "Untitled"}
      </h3>

      {/* Preview */}
      {note.preview && (
        <p className="text-xs text-surface-500 dark:text-surface-500 mt-1 line-clamp-2 leading-relaxed">
          {note.preview}
        </p>
      )}

      {/* Tags */}
      {note.tags.length > 0 && (
        <div className="flex items-center gap-1 mt-2 flex-wrap">
          <Tag size={9} className="text-surface-400 dark:text-surface-600 flex-shrink-0" />
          {note.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[9px] px-1.5 py-0.5 rounded-full bg-surface-100 dark:bg-surface-700/60 text-surface-500 dark:text-surface-400"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Hover actions */}
      <div
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-100"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-surface-200 dark:hover:bg-surface-700 text-surface-400"
        >
          <MoreVertical size={12} />
        </button>

        {menuOpen && (
          <div
            className="absolute right-0 top-7 z-50 w-36 bg-surface-0 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg shadow-lg overflow-hidden"
            onMouseLeave={() => setMenuOpen(false)}
          >
            <button
              onClick={async () => {
                const { WebviewWindow } = await import("@tauri-apps/api/webviewWindow");
                new WebviewWindow(`sticky-${note.id}`, {
                  url: `#${note.id}`,
                  title: note.title || "Sticky Note",
                  width: 320,
                  height: 360,
                  minWidth: 240,
                  minHeight: 200,
                  decorations: false,
                  transparent: true,
                  alwaysOnTop: true,
                  resizable: true,
                  center: false,
                });
                setMenuOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
            >
              <StickyNote size={11} />
              Open as Sticky
            </button>
            <button
              onClick={() => { onTogglePin(note.id); setMenuOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-surface-700 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
            >
              <Pin size={11} className={note.pinned ? "fill-current" : ""} />
              {note.pinned ? "Unpin" : "Pin"}
            </button>
            <button
              onClick={() => { onDelete(note.id); setMenuOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
            >
              <Trash2 size={11} />
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
