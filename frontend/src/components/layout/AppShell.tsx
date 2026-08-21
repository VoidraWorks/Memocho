import React, { lazy, Suspense } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { ErrorBoundary } from "../ui/ErrorBoundary";
import { useUIStore } from "../../stores/uiStore";
import type { NavSection } from "../../types";

const TodayPage   = lazy(() => import("../../pages/TodayPage").then((m) => ({ default: m.TodayPage })));
const NotesPage   = lazy(() => import("../../pages/NotesPage").then((m) => ({ default: m.NotesPage })));
const TasksPage   = lazy(() => import("../../pages/TasksPage").then((m) => ({ default: m.TasksPage })));
const PlannerPage = lazy(() => import("../../pages/PlannerPage").then((m) => ({ default: m.PlannerPage })));
const PinnedPage  = lazy(() => import("../../pages/PinnedPage").then((m) => ({ default: m.PinnedPage })));
const SettingsPage = lazy(() => import("../../pages/SettingsPage").then((m) => ({ default: m.SettingsPage })));

const PAGE_MAP: Record<NavSection, React.ReactNode> = {
  today:    <TodayPage />,
  notes:    <NotesPage />,
  tasks:    <TasksPage />,
  planner:  <PlannerPage />,
  pinned:   <PinnedPage />,
  settings: <SettingsPage />,
};

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-full">
    <div className="w-5 h-5 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
  </div>
);

export const AppShell: React.FC = () => {
  const activeSection     = useUIStore((s) => s.activeSection);
  const sidebarCollapsed  = useUIStore((s) => s.sidebarCollapsed);
  const isFloating        = useUIStore((s) => s.isFloating);
  const setActiveSection  = useUIStore((s) => s.setActiveSection);
  const toggleSidebar     = useUIStore((s) => s.toggleSidebar);
  const toggleFloating    = useUIStore((s) => s.toggleFloating);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-surface-0 dark:bg-surface-900 text-surface-900 dark:text-surface-100">
      {/* Sidebar */}
      <Sidebar
        active={activeSection}
        onChange={setActiveSection}
        collapsed={sidebarCollapsed}
      />

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar
          section={activeSection}
          sidebarCollapsed={sidebarCollapsed}
          isFloating={isFloating}
          onToggleSidebar={toggleSidebar}
          onToggleFloating={toggleFloating}
        />

        {/* Page content */}
        <main className="flex-1 min-h-0 overflow-hidden">
          <ErrorBoundary key={activeSection}>
            <Suspense fallback={<LoadingFallback />}>
              {PAGE_MAP[activeSection]}
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
};
