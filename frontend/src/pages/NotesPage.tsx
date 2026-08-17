import React from "react";
import { FileText } from "lucide-react";
import { NotesSidebar } from "../components/notes/NotesSidebar";
import { NoteEditor } from "../components/notes/NoteEditor";
import { useNotesStore, selectCurrentNote, selectFilteredNotes } from "../stores/notesStore";

export const NotesPage: React.FC = () => {
  const notes         = useNotesStore(selectFilteredNotes);
  const currentNoteId = useNotesStore((s) => s.currentNoteId);
  const currentNote   = useNotesStore(selectCurrentNote);
  const searchQuery   = useNotesStore((s) => s.searchQuery);
  const isSaving      = useNotesStore((s) => s.isSaving);
  const createNote    = useNotesStore((s) => s.createNote);
  const updateNote    = useNotesStore((s) => s.updateNote);
  const deleteNote    = useNotesStore((s) => s.deleteNote);
  const togglePin     = useNotesStore((s) => s.togglePin);
  const setCurrentNote = useNotesStore((s) => s.setCurrentNote);
  const setSearchQuery = useNotesStore((s) => s.setSearchQuery);

  const handleCreate = () => {
    createNote({ title: "Untitled", content: "" });
  };

  return (
    <div className="flex h-full overflow-hidden">
      <NotesSidebar
        notes={notes}
        currentNoteId={currentNoteId}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSelect={setCurrentNote}
        onCreate={handleCreate}
        onDelete={deleteNote}
        onTogglePin={togglePin}
      />

      <div className="flex-1 overflow-hidden">
        {currentNote ? (
          <NoteEditor
            note={currentNote}
            isSaving={isSaving}
            onUpdateTitle={(title) => updateNote(currentNote.id, { title })}
            onUpdateContent={(content) => updateNote(currentNote.id, { content })}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-12 h-12 rounded-xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-3">
              <FileText size={20} className="text-surface-400 dark:text-surface-600" />
            </div>
            <p className="text-sm text-surface-500 dark:text-surface-500">
              Select a note to view it, or create a new one.
            </p>
            <button
              onClick={handleCreate}
              className="mt-3 text-sm text-primary-500 hover:underline"
            >
              Create note
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
