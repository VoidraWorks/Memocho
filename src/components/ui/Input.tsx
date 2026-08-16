import React from "react";
import { cn } from "../../lib/cn";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  label?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ icon, label, className, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1 w-full">
        {label && (
          <label htmlFor={id} className="text-xs font-medium text-surface-500 dark:text-surface-400">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <span className="absolute left-2.5 text-surface-400 dark:text-surface-500 pointer-events-none">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={id}
            className={cn(
              "w-full h-8 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700",
              "rounded text-sm text-surface-900 dark:text-surface-100 placeholder:text-surface-400 dark:placeholder:text-surface-600",
              "focus:outline-none focus:ring-1 focus:ring-primary-400 focus:border-primary-400",
              "transition-colors duration-fast",
              icon ? "pl-8 pr-3" : "px-3",
              className
            )}
            {...props}
          />
        </div>
      </div>
    );
  }
);
Input.displayName = "Input";
