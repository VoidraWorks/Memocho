import React, { useState, useRef } from "react";
import { Plus } from "lucide-react";
import { cn } from "../../lib/cn";

interface AddTaskRowProps {
  onAdd: (title: string) => void;
  placeholder?: string;
  className?: string;
}

export const AddTaskRow: React.FC<AddTaskRowProps> = ({
  onAdd,
  placeholder = "Add task…",
  className,
}) => {
  const [active, setActive] = useState(false);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleActivate = () => {
    setActive(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (trimmed) {
      onAdd(trimmed);
      setValue("");
    }
    setActive(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
    if (e.key === "Escape") {
      setValue("");
      setActive(false);
    }
  };

  if (!active) {
    return (
      <button
        onClick={handleActivate}
        className={cn(
          "flex items-center gap-2 w-full px-1 py-1.5 rounded-md text-sm",
          "text-surface-400 dark:text-surface-600 hover:text-surface-600 dark:hover:text-surface-400",
          "hover:bg-surface-50 dark:hover:bg-surface-800/40 transition-colors duration-fast",
          className
        )}
      >
        <Plus size={14} className="flex-shrink-0" />
        <span>{placeholder}</span>
      </button>
    );
  }

  return (
    <div className={cn("flex items-center gap-2 px-1 py-1", className)}>
      <Plus size={14} className="flex-shrink-0 text-primary-500" />
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleSubmit}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-sm text-surface-900 dark:text-surface-100 placeholder:text-surface-400 focus:outline-none border-b border-primary-400"
      />
    </div>
  );
};
