import React, { useState } from "react";
import { Search, Plus, FileText, Pin, SortAsc, SortDesc } from "lucide-react";
import { NoteCard } from "./NoteCard";
import type { Note } from "../../types";
import { cn } from "../../lib/cn";

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

type SortOrder = "updated" | "created" | "title";

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
  const [sortOrder, setSortOrder] = useState<SortOrder>("updated");
  const [sortAsc, setSortAsc] = useState(false);

  // Sort notes
  const sorted = [...notes].sort((a, b) => {
    let cmp = 0;
    if (sortOrder === "title") {
      cmp = a.title.localeCompare(b.title);
    } else if (sortOrder === "created") {
      cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else {
      cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
    }
    return sortAsc ? cmp : -cmp;
  });

  // Pinned on top regardless of sort
  const pinned = sorted.filter((n) => n.pinned);
  const unpinned = sorted.filter((n) => !n.pinned);

  const cycleSortOrder = () => {
    const orders: SortOrder[] = ["updated", "created", "title"];
    const idx = orders.indexOf(sortOrder);
    setSortOrder(orders[(idx + 1) % orders.length]!);
  };

  const sortLabel = sortOrder === "updated" ? "Modified" : sortOrder === "created" ? "Created" : "A–Z";

  return (
    <div className="flex flex-col h-full w-60 flex-shrink-0 border-r border-surface-100 dark:border-surface-800/50 bg-surface-50 dark:bg-surface-900">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-surface-900 dark:text-surface-100 tracking-tight">
            Notes
          </h2>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-surface-400 dark:text-surface-600 tabular-nums">
              {notes.length}
            </span>
            <button
              onClick={onCreate}
              className="ml-1 w-6 h-6 rounded-lg bg-primary-500 hover:bg-primary-600 flex items-center justify-center transition-colors shadow-sm"
              title="New note"
            >
              <Plus size={13} className="text-white" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search
            size={12}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-surface-400 dark:text-surface-600 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search notes…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-7 pl-7 pr-3 text-xs rounded-lg bg-surface-100 dark:bg-surface-800 border border-transparent focus:border-primary-300 dark:focus:border-primary-600 focus:outline-none text-surface-800 dark:text-surface-200 placeholder:text-surface-400 dark:placeholder:text-surface-600 transition-colors"
          />
        </div>

        {/* Sort control */}
        <div className="flex items-center gap-1 mt-2">
          <button
            onClick={cycleSortOrder}
            className="flex items-center gap-1 text-[10px] text-surface-500 dark:text-surface-500 hover:text-surface-700 dark:hover:text-surface-300 transition-colors"
          >
            <span>{sortLabel}</span>
          </button>
          <button
            onClick={() => setSortAsc((v) => !v)}
            className="ml-auto text-surface-400 dark:text-surface-600 hover:text-surface-600 dark:hover:text-surface-400 transition-colors"
          >
            {sortAsc ? <SortAsc size={11} /> : <SortDesc size={11} />}
          </button>
        </div>
      </div>

      {/* Notes list */}
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center pt-12">
            <div className="w-10 h-10 rounded-2xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-3">
              <FileText size={18} className="text-surface-400 dark:text-surface-600" />
            </div>
            <p className="text-xs text-surface-500 dark:text-surface-600 mb-3">
              {searchQuery ? "No notes match your search." : "Your notes will appear here."}
            </p>
            {!searchQuery && (
              <button
                onClick={onCreate}
                className="text-xs font-medium text-primary-500 hover:text-primary-600 transition-colors"
              >
                Create your first note →
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {/* Pinned section */}
            {pinned.length > 0 && (
              <>
                <div className={cn(
                  "flex items-center gap-1.5 px-1 mb-0.5",
                  unpinned.length > 0 ? "mt-1" : "mt-1"
                )}>
                  <Pin size={9} className="text-amber-500 fill-amber-400" />
                  <span className="text-[9px] font-semibold uppercase tracking-widest text-surface-400 dark:text-surface-600">
                    Pinned
                  </span>
                </div>
                {pinned.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    active={note.id === currentNoteId}
                    onSelect={onSelect}
                    onDelete={onDelete}
                    onTogglePin={onTogglePin}
                  />
                ))}
              </>
            )}

            {/* All / Recent section */}
            {unpinned.length > 0 && (
              <>
                {pinned.length > 0 && (
                  <div className="flex items-center gap-1.5 px-1 mt-2 mb-0.5">
                    <span className="text-[9px] font-semibold uppercase tracking-widest text-surface-400 dark:text-surface-600">
                      All Notes
                    </span>
                  </div>
                )}
                {unpinned.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    active={note.id === currentNoteId}
                    onSelect={onSelect}
                    onDelete={onDelete}
                    onTogglePin={onTogglePin}
                  />
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
