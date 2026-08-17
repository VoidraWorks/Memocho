import React from "react";
import { cn } from "../../lib/cn";

interface TooltipProps {
  content: string;
  children: React.ReactElement;
  side?: "top" | "bottom" | "left" | "right";
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  side = "top",
}) => {
  const positionClasses: Record<string, string> = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-1.5",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-1.5",
    left: "right-full top-1/2 -translate-y-1/2 mr-1.5",
    right: "left-full top-1/2 -translate-y-1/2 ml-1.5",
  };

  return (
    <div className="relative group inline-flex">
      {children}
      <div
        className={cn(
          "absolute z-50 px-2 py-1 rounded-sm text-xs font-medium whitespace-nowrap pointer-events-none",
          "bg-surface-800 dark:bg-surface-100 text-surface-100 dark:text-surface-900",
          "opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-fast",
          positionClasses[side]
        )}
      >
        {content}
      </div>
    </div>
  );
};
