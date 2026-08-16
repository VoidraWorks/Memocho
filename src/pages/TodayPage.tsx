import React from "react";
import { TaskList } from "../components/tasks/TaskList";
import { AddTaskRow } from "../components/tasks/AddTaskRow";
import { useTasksStore, selectTodayTasks } from "../stores/tasksStore";

function formatFullDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export const TodayPage: React.FC = () => {
  const todayISO = new Date().toISOString().slice(0, 10);
  const tasks       = useTasksStore((s) => s.tasks);
  const todayTasks  = selectTodayTasks(tasks);
  const createTask  = useTasksStore((s) => s.createTask);
  const toggleComplete = useTasksStore((s) => s.toggleComplete);
  const deleteTask  = useTasksStore((s) => s.deleteTask);
  const togglePin   = useTasksStore((s) => s.togglePin);
  const setPriority = useTasksStore((s) => s.setPriority);
  const updateTask  = useTasksStore((s) => s.updateTask);

  const pending   = todayTasks.filter((t) => !t.completed);
  const completed = todayTasks.filter((t) => t.completed);

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-xl mx-auto px-6 py-8">
        {/* Date header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-surface-900 dark:text-surface-100">
            {formatFullDate(todayISO)}
          </h2>
          <p className="text-xs text-primary-500 font-semibold uppercase tracking-widest mt-0.5">
            Today
          </p>
        </div>

        {/* Task count summary */}
        {todayTasks.length > 0 && (
          <div className="flex gap-4 mb-5">
            <div className="text-center">
              <p className="text-lg font-bold text-surface-900 dark:text-surface-100">{pending.length}</p>
              <p className="text-xs text-surface-400 dark:text-surface-600">remaining</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-surface-900 dark:text-surface-100">{completed.length}</p>
              <p className="text-xs text-surface-400 dark:text-surface-600">done</p>
            </div>
          </div>
        )}

        {/* Pending tasks */}
        <section className="mb-4">
          <TaskList
            tasks={pending}
            onToggleComplete={toggleComplete}
            onDelete={deleteTask}
            onTogglePin={togglePin}
            onSetPriority={setPriority}
            onUpdateTitle={(id, title) => updateTask(id, { title })}
            onUpdateDescription={(id, description) => updateTask(id, { description })}
            emptyMessage={completed.length > 0 ? "All tasks done! 🎉" : "No tasks yet."}
          />
          <AddTaskRow
            onAdd={(title) => createTask({ title, date: todayISO })}
            placeholder="Add task…"
            className="mt-1"
          />
        </section>

        {/* Completed tasks */}
        {completed.length > 0 && (
          <section>
            <p className="text-xs font-semibold text-surface-400 dark:text-surface-600 uppercase tracking-wide mb-2 mt-4">
              Completed
            </p>
            <TaskList
              tasks={completed}
              onToggleComplete={toggleComplete}
              onDelete={deleteTask}
              onTogglePin={togglePin}
              onSetPriority={setPriority}
              onUpdateTitle={(id, title) => updateTask(id, { title })}
              onUpdateDescription={(id, description) => updateTask(id, { description })}
            />
          </section>
        )}
      </div>
    </div>
  );
};
