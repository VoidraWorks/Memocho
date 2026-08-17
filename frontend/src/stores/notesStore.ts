import { create } from "zustand";
import { notesService } from "../services/notes";
import type { Note, CreateNoteInput, UpdateNoteInput } from "../types";

interface NotesState {
  notes: Note[];
  currentNoteId: string | null;
  searchQuery: string;
  isSaving: boolean;

  // Actions
  loadNotes: () => void;
  createNote: (input: CreateNoteInput) => Note;
  updateNote: (id: string, input: UpdateNoteInput) => void;
  deleteNote: (id: string) => void;
  togglePin: (id: string) => void;
  setCurrentNote: (id: string | null) => void;
  setSearchQuery: (q: string) => void;
}

export const useNotesStore = create<NotesState>((set) => ({
  notes: [],
  currentNoteId: null,
  searchQuery: "",
  isSaving: false,

  loadNotes: () => {
    const notes = notesService.getAll();
    set({ notes });
  },

  createNote: (input) => {
    const note = notesService.create(input);
    set((s) => ({ notes: [note, ...s.notes], currentNoteId: note.id }));
    return note;
  },

  updateNote: (id, input) => {
    set({ isSaving: true });
    const updated = notesService.update(id, input);
    if (updated) {
      set((s) => ({
        notes: s.notes.map((n) => (n.id === id ? updated : n)),
        isSaving: false,
      }));
    } else {
      set({ isSaving: false });
    }
  },

  deleteNote: (id) => {
    notesService.delete(id);
    set((s) => ({
      notes: s.notes.filter((n) => n.id !== id),
      currentNoteId: s.currentNoteId === id ? null : s.currentNoteId,
    }));
  },

  togglePin: (id) => {
    const updated = notesService.togglePin(id);
    if (updated) {
      set((s) => ({ notes: s.notes.map((n) => (n.id === id ? updated : n)) }));
    }
  },

  setCurrentNote: (id) => set({ currentNoteId: id }),
  setSearchQuery: (q) => set({ searchQuery: q }),
}));

// ── Selector helpers (stable references, safe to use in useNotesStore) ────────

export function selectCurrentNote(state: NotesState): Note | undefined {
  return state.notes.find((n) => n.id === state.currentNoteId);
}

export function selectFilteredNotes(state: NotesState): Note[] {
  const { notes, searchQuery } = state;
  if (!searchQuery.trim()) {
    return [...notes].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }
  const q = searchQuery.toLowerCase();
  return notes.filter(
    (n) =>
      n.title.toLowerCase().includes(q) ||
      n.preview.toLowerCase().includes(q) ||
      n.tags.some((t) => t.toLowerCase().includes(q))
  );
}
