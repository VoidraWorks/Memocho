import React from "react";
import { Pin, Trash2 } from "lucide-react";
import { cn } from "../../lib/cn";
import { Button } from "../ui/Button";
import type { Note } from "../../types";

interface NoteCardProps {
  note: Note;
  active?: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export const NoteCard: React.FC<NoteCardProps> = ({
  note,
  active,
  onSelect,
  onDelete,
  onTogglePin,
}) => {
  return (
    <div
      onClick={() => onSelect(note.id)}
      className={cn(
        "group relative p-3 rounded-lg cursor-pointer transition-all duration-fast",
        "border",
        active
          ? "bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800/50"
          : "bg-surface-0 dark:bg-surface-850 border-surface-100 dark:border-surface-800/50 hover:border-surface-200 dark:hover:border-surface-700"
      )}
    >
      {/* Pin indicator */}
      {note.pinned && (
        <Pin
          size={10}
          className="absolute top-2.5 right-2.5 text-primary-500 fill-primary-500"
        />
      )}

      {/* Title */}
      <h3
        className={cn(
          "text-sm font-medium truncate pr-4",
          active
            ? "text-primary-700 dark:text-primary-300"
            : "text-surface-900 dark:text-surface-100"
        )}
      >
        {note.title || "Untitled"}
      </h3>

      {/* Preview */}
      {note.preview && (
        <p className="text-xs text-surface-500 dark:text-surface-500 mt-0.5 line-clamp-2 leading-relaxed">
          {note.preview}
        </p>
      )}

      {/* Date */}
      <p className="text-xs text-surface-400 dark:text-surface-600 mt-1.5">
        {formatDate(note.updatedAt)}
      </p>

      {/* Actions (hover) */}
      <div className="absolute bottom-2.5 right-2.5 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-fast">
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5"
          onClick={(e) => { e.stopPropagation(); onTogglePin(note.id); }}
          title={note.pinned ? "Unpin" : "Pin"}
        >
          <Pin size={10} className={note.pinned ? "fill-current" : ""} />
        </Button>
        <Button
          variant="danger"
          size="icon"
          className="h-5 w-5"
          onClick={(e) => { e.stopPropagation(); onDelete(note.id); }}
          title="Delete note"
        >
          <Trash2 size={10} />
        </Button>
      </div>
    </div>
  );
};
