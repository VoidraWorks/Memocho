import React from "react";
import { Pin, FileText, CheckSquare } from "lucide-react";
import { useNotesStore } from "../stores/notesStore";
import { useTasksStore, selectPinnedTasks } from "../stores/tasksStore";
import { useUIStore } from "../stores/uiStore";
import { cn } from "../lib/cn";

export const PinnedPage: React.FC = () => {
  const allNotes       = useNotesStore((s) => s.notes);
  const toggleNotePin  = useNotesStore((s) => s.togglePin);
  const setCurrentNote = useNotesStore((s) => s.setCurrentNote);
  const setActiveSection = useUIStore((s) => s.setActiveSection);

  const allTasks       = useTasksStore((s) => s.tasks);
  const toggleTaskPin  = useTasksStore((s) => s.togglePin);
  const toggleComplete = useTasksStore((s) => s.toggleComplete);

  const pinnedNotes = allNotes.filter((n) => n.pinned);
  const pinnedTasks = selectPinnedTasks(allTasks);

  const isEmpty = pinnedNotes.length === 0 && pinnedTasks.length === 0;

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto px-6 py-8">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center min-h-64 text-center">
            <div className="w-12 h-12 rounded-xl bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-3">
              <Pin size={20} className="text-surface-400 dark:text-surface-600" />
            </div>
            <p className="text-sm text-surface-500 dark:text-surface-500">No pinned items yet.</p>
            <p className="text-xs text-surface-400 dark:text-surface-600 mt-1">
              Pin notes or tasks to access them quickly here.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {/* Pinned Notes */}
            {pinnedNotes.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <FileText size={14} className="text-surface-400 dark:text-surface-600" />
                  <h2 className="text-xs font-semibold text-surface-500 dark:text-surface-500 uppercase tracking-wide">
                    Notes
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {pinnedNotes.map((note) => (
                    <div
                      key={note.id}
                      onClick={() => { setCurrentNote(note.id); setActiveSection("notes"); }}
                      className="group relative p-4 rounded-xl border cursor-pointer transition-all bg-surface-0 dark:bg-surface-850 border-surface-100 dark:border-surface-800 hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-sm"
                    >
                      <Pin size={10} className="absolute top-3 right-3 text-primary-500 fill-primary-500" />
                      <h3 className="text-sm font-semibold text-surface-900 dark:text-surface-100 pr-4 truncate">
                        {note.title || "Untitled"}
                      </h3>
                      {note.preview && (
                        <p className="text-xs text-surface-500 mt-1 line-clamp-3 leading-relaxed">
                          {note.preview}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-surface-400 dark:text-surface-600">
                          {new Date(note.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </p>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleNotePin(note.id); }}
                          className="opacity-0 group-hover:opacity-100 text-xs text-surface-400 hover:text-primary-500 transition-all"
                        >
                          Unpin
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Pinned Tasks */}
            {pinnedTasks.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <CheckSquare size={14} className="text-surface-400 dark:text-surface-600" />
                  <h2 className="text-xs font-semibold text-surface-500 dark:text-surface-500 uppercase tracking-wide">
                    Tasks
                  </h2>
                </div>
                <div className="flex flex-col gap-1.5">
                  {pinnedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-surface-0 dark:bg-surface-850 border-surface-100 dark:border-surface-800 group"
                    >
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleComplete(task.id)}
                        className="w-3.5 h-3.5 accent-primary-500 rounded"
                      />
                      <span className={cn(
                        "flex-1 text-sm text-surface-800 dark:text-surface-200",
                        task.completed && "line-through text-surface-400 dark:text-surface-600"
                      )}>
                        {task.title}
                      </span>
                      <span className="text-xs text-surface-400 dark:text-surface-600">
                        {new Date(task.date + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </span>
                      <button
                        onClick={() => toggleTaskPin(task.id)}
                        className="opacity-0 group-hover:opacity-100 text-xs text-surface-400 hover:text-primary-500 transition-all"
                      >
                        Unpin
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
