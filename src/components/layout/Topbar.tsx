import React from "react";
import { PanelLeftClose, PanelLeftOpen, Minimize2, Maximize2 } from "lucide-react";
import { cn } from "../../lib/cn";
import { Button } from "../ui/Button";
import { Tooltip } from "../ui/Tooltip";
import type { NavSection } from "../../types";

interface TopbarProps {
  section: NavSection;
  sidebarCollapsed: boolean;
  isFloating: boolean;
  onToggleSidebar: () => void;
  onToggleFloating: () => void;
  children?: React.ReactNode;
}

const SECTION_LABELS: Record<NavSection, string> = {
  today:    "Today",
  notes:    "Notes",
  tasks:    "Tasks",
  planner:  "Planner",
  pinned:   "Pinned",
  settings: "Settings",
};

export const Topbar: React.FC<TopbarProps> = ({
  section,
  sidebarCollapsed,
  isFloating,
  onToggleSidebar,
  onToggleFloating,
  children,
}) => {
  return (
    <header
      className={cn(
        "flex items-center gap-2 px-3 h-12 border-b border-surface-100 dark:border-surface-800/50",
        "bg-surface-0/80 dark:bg-surface-900/80 backdrop-blur-sm"
      )}
    >
      {/* Sidebar toggle */}
      <Tooltip content={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}>
        <Button variant="ghost" size="icon" onClick={onToggleSidebar}>
          {sidebarCollapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
        </Button>
      </Tooltip>

      {/* Section title */}
      <h1 className="text-sm font-semibold text-surface-900 dark:text-surface-100">
        {SECTION_LABELS[section]}
      </h1>

      {/* Contextual actions slot */}
      <div className="flex items-center gap-1 ml-auto">
        {children}

        {/* Floating toggle */}
        <Tooltip content={isFloating ? "Expand workspace" : "Switch to floating"}>
          <Button variant="ghost" size="icon" onClick={onToggleFloating}>
            {isFloating ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
          </Button>
        </Tooltip>
      </div>
    </header>
  );
};
