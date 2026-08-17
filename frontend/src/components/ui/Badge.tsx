import React from "react";
import { cn } from "../../lib/cn";
import type { Priority } from "../../types";

interface BadgeProps {
  children?: React.ReactNode;
  variant?: "default" | "priority" | "pinned";
  priority?: Priority;
  className?: string;
}

const priorityClasses: Record<Priority, string> = {
  none:   "bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-400",
  low:    "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",
  medium: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
  high:   "bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400",
};

const priorityDotClasses: Record<Priority, string> = {
  none:   "bg-surface-300 dark:bg-surface-600",
  low:    "bg-blue-400",
  medium: "bg-amber-400",
  high:   "bg-red-400",
};

export const PriorityDot: React.FC<{ priority: Priority; className?: string }> = ({
  priority,
  className,
}) => {
  if (priority === "none") return null;
  return (
    <span
      className={cn(
        "w-1.5 h-1.5 rounded-full flex-shrink-0",
        priorityDotClasses[priority],
        className
      )}
    />
  );
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  priority,
  className,
}) => {
  const base = "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-xs text-xs font-medium";

  if (variant === "priority" && priority) {
    return (
      <span className={cn(base, priorityClasses[priority], className)}>
        <PriorityDot priority={priority} />
        {priority !== "none" && priority}
      </span>
    );
  }

  return (
    <span
      className={cn(
        base,
        variant === "pinned"
          ? "bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400"
          : "bg-surface-100 text-surface-500 dark:bg-surface-800 dark:text-surface-400",
        className
      )}
    >
      {children}
    </span>
  );
};
