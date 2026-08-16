import React from "react";
import { cn } from "../../lib/cn";

type Variant = "primary" | "ghost" | "danger" | "outline";
type Size = "xs" | "sm" | "md" | "icon";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children?: React.ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700 shadow-subtle",
  ghost:
    "bg-transparent text-surface-500 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800",
  danger:
    "bg-transparent text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40",
  outline:
    "border border-surface-200 dark:border-surface-700 text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-800/60 bg-surface-0 dark:bg-surface-850",
};

const sizeClasses: Record<Size, string> = {
  xs:   "h-6 px-2 text-xs rounded-sm gap-1",
  sm:   "h-7 px-3 text-sm rounded gap-1.5",
  md:   "h-8 px-4 text-sm rounded-md gap-2",
  icon: "h-7 w-7 rounded flex-shrink-0",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "ghost", size = "md", className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-colors duration-fast select-none disabled:opacity-40 disabled:pointer-events-none",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
