import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TaskList } from "../components/tasks/TaskList";
import { AddTaskRow } from "../components/tasks/AddTaskRow";
import { useTasksStore, selectTasksForDate } from "../stores/tasksStore";

function formatFullDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export const TasksPage: React.FC = () => {
  const todayISO = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(todayISO);

  const tasks          = useTasksStore((s) => s.tasks);
  const tasksForDate   = selectTasksForDate(tasks, selectedDate);
  const createTask     = useTasksStore((s) => s.createTask);
  const toggleComplete = useTasksStore((s) => s.toggleComplete);
  const deleteTask     = useTasksStore((s) => s.deleteTask);
  const togglePin      = useTasksStore((s) => s.togglePin);
  const setPriority    = useTasksStore((s) => s.setPriority);
  const updateTask     = useTasksStore((s) => s.updateTask);

  const isToday   = selectedDate === todayISO;
  const pending   = tasksForDate.filter((t) => !t.completed);
  const completed = tasksForDate.filter((t) => t.completed);

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-xl mx-auto px-6 py-8">
        {/* Date navigation */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setSelectedDate((d) => addDays(d, -1))}
            className="p-1.5 rounded-md hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors text-surface-500 dark:text-surface-400"
          >
            <ChevronLeft size={16} />
          </button>

          <div className="flex-1">
            <h2 className="text-xl font-bold text-surface-900 dark:text-surface-100">
              {formatFullDate(selectedDate)}
            </h2>
            {isToday && (
              <p className="text-xs text-primary-500 font-semibold uppercase tracking-widest">Today</p>
            )}
          </div>

          <button
            onClick={() => setSelectedDate((d) => addDays(d, 1))}
            className="p-1.5 rounded-md hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors text-surface-500 dark:text-surface-400"
          >
            <ChevronRight size={16} />
          </button>

          {!isToday && (
            <button
              onClick={() => setSelectedDate(todayISO)}
              className="text-xs text-primary-500 hover:underline"
            >
              Today
            </button>
          )}
        </div>

        {/* Tasks */}
        <TaskList
          tasks={pending}
          onToggleComplete={toggleComplete}
          onDelete={deleteTask}
          onTogglePin={togglePin}
          onSetPriority={setPriority}
          onUpdateTitle={(id, title) => updateTask(id, { title })}
          onUpdateDescription={(id, desc) => updateTask(id, { description: desc })}
          emptyMessage={completed.length > 0 ? "All done for this day! 🎉" : "No tasks for this day."}
        />
        <AddTaskRow
          onAdd={(title) => createTask({ title, date: selectedDate })}
          placeholder="Add task…"
          className="mt-1"
        />

        {completed.length > 0 && (
          <section className="mt-4">
            <p className="text-xs font-semibold text-surface-400 dark:text-surface-600 uppercase tracking-wide mb-2">
              Completed
            </p>
            <TaskList
              tasks={completed}
              onToggleComplete={toggleComplete}
              onDelete={deleteTask}
              onTogglePin={togglePin}
              onSetPriority={setPriority}
              onUpdateTitle={(id, title) => updateTask(id, { title })}
              onUpdateDescription={(id, desc) => updateTask(id, { description: desc })}
            />
          </section>
        )}
      </div>
    </div>
  );
};
