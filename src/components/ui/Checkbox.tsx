import React from "react";
import { cn } from "../../lib/cn";

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
  id?: string;
  size?: "sm" | "md";
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  className,
  id,
  size = "md",
}) => {
  const dim = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";
  return (
    <button
      type="button"
      role="checkbox"
      id={id}
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "flex-shrink-0 rounded-[4px] border transition-all duration-fast focus:outline-none focus:ring-1 focus:ring-primary-400 focus:ring-offset-1",
        dim,
        checked
          ? "bg-primary-500 border-primary-500 text-white"
          : "border-surface-300 dark:border-surface-600 bg-transparent hover:border-primary-400",
        className
      )}
    >
      {checked && (
        <svg viewBox="0 0 10 10" fill="none" className="w-full h-full p-[2px]">
          <path
            d="M1.5 5L4 7.5L8.5 2.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
};
