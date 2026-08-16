import React from "react";
import { TaskList } from "../tasks/TaskList";
import { AddTaskRow } from "../tasks/AddTaskRow";
import type { Task, Priority } from "../../types";

interface DayColumnProps {
  date: string;
  tasks: Task[];
  onAdd: (title: string) => void;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  onSetPriority: (id: string, priority: Priority) => void;
  onUpdateTitle: (id: string, title: string) => void;
  onUpdateDescription: (id: string, desc: string) => void;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export const DayColumn: React.FC<DayColumnProps> = ({
  date,
  tasks,
  onAdd,
  onToggleComplete,
  onDelete,
  onTogglePin,
  onSetPriority,
  onUpdateTitle,
  onUpdateDescription,
}) => {
  const today = new Date().toISOString().slice(0, 10);
  const isToday = date === today;

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="text-base font-semibold text-surface-900 dark:text-surface-100">
          {formatDate(date)}
        </h2>
        {isToday && (
          <span className="text-xs text-primary-500 font-medium uppercase tracking-wide">
            Today
          </span>
        )}
      </div>

      <TaskList
        tasks={tasks}
        onToggleComplete={onToggleComplete}
        onDelete={onDelete}
        onTogglePin={onTogglePin}
        onSetPriority={onSetPriority}
        onUpdateTitle={onUpdateTitle}
        onUpdateDescription={onUpdateDescription}
        emptyMessage="No tasks for this day."
      />
      <AddTaskRow onAdd={onAdd} placeholder="Add task for this day…" />
    </div>
  );
};
