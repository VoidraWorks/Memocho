import React from "react";
import {
  Sun, FileText, CheckSquare, Calendar, Pin, Settings,
} from "lucide-react";
import { cn } from "../../lib/cn";
import { Tooltip } from "../ui/Tooltip";
import type { NavSection } from "../../types";

interface SidebarProps {
  active: NavSection;
  onChange: (s: NavSection) => void;
  collapsed?: boolean;
}

interface NavItem {
  id: NavSection;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { id: "today",    label: "Today",   icon: <Sun size={16} /> },
  { id: "notes",    label: "Notes",   icon: <FileText size={16} /> },
  { id: "tasks",    label: "Tasks",   icon: <CheckSquare size={16} /> },
  { id: "planner",  label: "Planner", icon: <Calendar size={16} /> },
  { id: "pinned",   label: "Pinned",  icon: <Pin size={16} /> },
];

const SidebarItem: React.FC<{
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
}> = ({ item, active, collapsed, onClick }) => {
  const button = (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm font-medium transition-all duration-fast",
        active
          ? "bg-primary-50 dark:bg-primary-900/25 text-primary-700 dark:text-primary-300"
          : "text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800/60 hover:text-surface-900 dark:hover:text-surface-200"
      )}
    >
      <span className="flex-shrink-0">{item.icon}</span>
      {!collapsed && <span className="truncate">{item.label}</span>}
    </button>
  );

  return collapsed ? (
    <Tooltip content={item.label} side="right">
      {button}
    </Tooltip>
  ) : (
    button
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ active, onChange, collapsed = false }) => {
  return (
    <nav
      className={cn(
        "flex flex-col h-full border-r border-surface-100 dark:border-surface-800/50 bg-surface-50/80 dark:bg-surface-900/60 transition-all duration-slow",
        collapsed ? "w-12" : "w-44"
      )}
    >
      {/* Logo/brand */}
      <div className={cn("flex items-center h-12 px-3 border-b border-surface-100 dark:border-surface-800/50", collapsed ? "justify-center" : "gap-2")}>
        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary-400 to-primary-600 flex-shrink-0" />
        {!collapsed && (
          <span className="text-sm font-bold text-surface-900 dark:text-surface-100 tracking-tight">
            Memocho
          </span>
        )}
      </div>

      {/* Nav items */}
      <div className="flex-1 p-2 flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => (
          <SidebarItem
            key={item.id}
            item={item}
            active={active === item.id}
            collapsed={collapsed}
            onClick={() => onChange(item.id)}
          />
        ))}
      </div>

      {/* Settings at bottom */}
      <div className="p-2 border-t border-surface-100 dark:border-surface-800/50">
        {collapsed ? (
          <Tooltip content="Settings" side="right">
            <button
              onClick={() => onChange("settings")}
              className={cn(
                "flex items-center justify-center w-full px-3 py-2 rounded-md text-sm transition-all duration-fast",
                active === "settings"
                  ? "bg-primary-50 dark:bg-primary-900/25 text-primary-700 dark:text-primary-300"
                  : "text-surface-500 dark:text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800/60"
              )}
            >
              <Settings size={16} />
            </button>
          </Tooltip>
        ) : (
          <button
            onClick={() => onChange("settings")}
            className={cn(
              "flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm font-medium transition-all duration-fast",
              active === "settings"
                ? "bg-primary-50 dark:bg-primary-900/25 text-primary-700 dark:text-primary-300"
                : "text-surface-500 dark:text-surface-500 hover:bg-surface-100 dark:hover:bg-surface-800/60"
            )}
          >
            <Settings size={16} />
            Settings
          </button>
        )}
      </div>
    </nav>
  );
};
