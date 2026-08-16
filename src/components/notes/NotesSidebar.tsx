import React from "react";
import { Search, Plus } from "lucide-react";
import { NoteCard } from "./NoteCard";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import type { Note } from "../../types";

interface NotesSidebarProps {
  notes: Note[];
  currentNoteId: string | null;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
}

export const NotesSidebar: React.FC<NotesSidebarProps> = ({
  notes,
  currentNoteId,
  searchQuery,
  onSearchChange,
  onSelect,
  onCreate,
  onDelete,
  onTogglePin,
}) => {
  return (
    <div className="flex flex-col h-full w-56 flex-shrink-0 border-r border-surface-100 dark:border-surface-800/50">
      {/* Header */}
      <div className="p-3 border-b border-surface-100 dark:border-surface-800/50">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wide flex-1">
            Notes
          </span>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onCreate} title="New note">
            <Plus size={14} />
          </Button>
        </div>
        <Input
          icon={<Search size={12} />}
          placeholder="Search notes…"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-7 text-xs"
        />
      </div>

      {/* Notes list */}
      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5">
        {notes.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <p className="text-xs text-surface-400 dark:text-surface-600">
              {searchQuery ? "No notes match your search." : "No notes yet."}
            </p>
            {!searchQuery && (
              <button
                onClick={onCreate}
                className="mt-2 text-xs text-primary-500 hover:underline"
              >
                Create one
              </button>
            )}
          </div>
        )}
        {notes.map((note) => (
          <NoteCard
            key={note.id}
            note={note}
            active={note.id === currentNoteId}
            onSelect={onSelect}
            onDelete={onDelete}
            onTogglePin={onTogglePin}
          />
        ))}
      </div>
    </div>
  );
};
