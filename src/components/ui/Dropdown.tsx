import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../lib/cn";

interface DropdownOption<T extends string = string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

interface DropdownProps<T extends string = string> {
  value: T;
  options: DropdownOption<T>[];
  onChange: (val: T) => void;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
}

export function Dropdown<T extends string = string>({
  value,
  options,
  onChange,
  placeholder,
  className,
  triggerClassName,
}: DropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className={cn("relative inline-block", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-1.5 h-8 px-3 text-sm rounded border transition-colors duration-fast",
          "bg-surface-50 dark:bg-surface-800 border-surface-200 dark:border-surface-700",
          "text-surface-800 dark:text-surface-200 hover:bg-surface-100 dark:hover:bg-surface-700",
          "focus:outline-none focus:ring-1 focus:ring-primary-400",
          triggerClassName
        )}
      >
        {selected?.icon}
        <span>{selected?.label ?? placeholder ?? "Select"}</span>
        <ChevronDown size={12} className="ml-auto text-surface-400 flex-shrink-0" />
      </button>

      {open && (
        <div
          className={cn(
            "absolute z-40 top-full left-0 mt-1 min-w-full",
            "bg-surface-0 dark:bg-surface-850 border border-surface-100 dark:border-surface-700/60",
            "rounded-md shadow-md py-1 animate-in fade-in slide-in-from-top-1 duration-fast"
          )}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={cn(
                "flex items-center gap-2 w-full px-3 py-1.5 text-sm text-left transition-colors duration-fast",
                "hover:bg-surface-50 dark:hover:bg-surface-800",
                opt.value === value
                  ? "text-primary-600 dark:text-primary-400 font-medium"
                  : "text-surface-700 dark:text-surface-300"
              )}
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
