import React from "react";
import { FileText, Plus, Sparkles } from "lucide-react";
import { NotesSidebar } from "../components/notes/NotesSidebar";
import { NoteEditor } from "../components/notes/NoteEditor";
import { useNotesStore, selectCurrentNote, selectFilteredNotes } from "../stores/notesStore";

export const NotesPage: React.FC = () => {
  const notes          = useNotesStore(selectFilteredNotes);
  const currentNoteId  = useNotesStore((s) => s.currentNoteId);
  const currentNote    = useNotesStore(selectCurrentNote);
  const searchQuery    = useNotesStore((s) => s.searchQuery);
  const isSaving       = useNotesStore((s) => s.isSaving);
  const createNote     = useNotesStore((s) => s.createNote);
  const updateNote     = useNotesStore((s) => s.updateNote);
  const deleteNote     = useNotesStore((s) => s.deleteNote);
  const togglePin      = useNotesStore((s) => s.togglePin);
  const setCurrentNote = useNotesStore((s) => s.setCurrentNote);
  const setSearchQuery = useNotesStore((s) => s.setSearchQuery);

  const handleCreate = () => {
    createNote({ title: "Untitled", content: "" });
  };

  const handleDeleteNote = (id: string) => {
    deleteNote(id);
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left panel — note list */}
      <NotesSidebar
        notes={notes}
        currentNoteId={currentNoteId}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSelect={setCurrentNote}
        onCreate={handleCreate}
        onDelete={handleDeleteNote}
        onTogglePin={togglePin}
      />

      {/* Right panel — editor or empty state */}
      <div className="flex-1 overflow-hidden">
        {currentNote ? (
          <NoteEditor
            note={currentNote}
            isSaving={isSaving}
            onUpdateTitle={(title) => updateNote(currentNote.id, { title })}
            onUpdateContent={(content) => updateNote(currentNote.id, { content })}
            onTogglePin={togglePin}
            onDelete={handleDeleteNote}
          />
        ) : (
          <EmptyState onCreateNote={handleCreate} noteCount={notes.length} />
        )}
      </div>
    </div>
  );
};

// ─── Premium empty state ──────────────────────────────────────────────────────

const EmptyState: React.FC<{ onCreateNote: () => void; noteCount: number }> = ({
  onCreateNote,
  noteCount,
}) => (
  <div className="flex flex-col items-center justify-center h-full bg-surface-0 dark:bg-surface-900 select-none">
    {/* Icon */}
    <div className="relative mb-6">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/40 dark:to-primary-800/20 flex items-center justify-center shadow-md">
        <FileText size={28} className="text-primary-500 dark:text-primary-400" />
      </div>
      <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 dark:bg-amber-500 flex items-center justify-center shadow-sm">
        <Sparkles size={10} className="text-white" />
      </div>
    </div>

    {noteCount === 0 ? (
      <>
        <h3 className="text-base font-semibold text-surface-800 dark:text-surface-200 mb-1.5">
          Your notebook is empty
        </h3>
        <p className="text-sm text-surface-500 dark:text-surface-600 text-center max-w-xs mb-6">
          Start capturing ideas, thoughts, and anything worth remembering.
        </p>
        <button
          onClick={onCreateNote}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium transition-colors shadow-md hover:shadow-lg"
        >
          <Plus size={15} />
          Create your first note
        </button>
      </>
    ) : (
      <>
        <h3 className="text-base font-semibold text-surface-800 dark:text-surface-200 mb-1.5">
          {noteCount} {noteCount === 1 ? "note" : "notes"}
        </h3>
        <p className="text-sm text-surface-500 dark:text-surface-600 text-center max-w-xs mb-5">
          Select a note from the panel to open it, or create a new one.
        </p>
        <button
          onClick={onCreateNote}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-surface-200 dark:border-surface-700 hover:border-primary-300 dark:hover:border-primary-700 text-sm text-surface-600 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-all"
        >
          <Plus size={13} />
          New note
        </button>
      </>
    )}
  </div>
);
