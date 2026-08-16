import React from "react";
import { TaskRow } from "./TaskRow";
import type { Task, Priority } from "../../types";

interface TaskListProps {
  tasks: Task[];
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  onSetPriority: (id: string, priority: Priority) => void;
  onUpdateTitle: (id: string, title: string) => void;
  onUpdateDescription: (id: string, description: string) => void;
  compact?: boolean;
  emptyMessage?: string;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  onToggleComplete,
  onDelete,
  onTogglePin,
  onSetPriority,
  onUpdateTitle,
  onUpdateDescription,
  compact = false,
  emptyMessage = "No tasks",
}) => {
  if (tasks.length === 0) {
    return (
      <p className="text-sm text-surface-400 dark:text-surface-600 py-3">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      {tasks.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          onToggleComplete={onToggleComplete}
          onDelete={onDelete}
          onTogglePin={onTogglePin}
          onSetPriority={onSetPriority}
          onUpdateTitle={onUpdateTitle}
          onUpdateDescription={onUpdateDescription}
          compact={compact}
        />
      ))}
    </div>
  );
};
