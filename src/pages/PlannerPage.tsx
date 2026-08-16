import React, { useMemo } from "react";
import { MiniCalendar } from "../components/planner/MiniCalendar";
import { DayColumn } from "../components/planner/DayColumn";
import { useTasksStore, selectTasksForDate } from "../stores/tasksStore";

export const PlannerPage: React.FC = () => {
  const selectedDate    = useTasksStore((s) => s.selectedDate);
  const setSelectedDate = useTasksStore((s) => s.setSelectedDate);
  const tasks           = useTasksStore((s) => s.tasks);
  const tasksForDate    = selectTasksForDate(tasks, selectedDate);
  const createTask      = useTasksStore((s) => s.createTask);
  const toggleComplete  = useTasksStore((s) => s.toggleComplete);
  const deleteTask      = useTasksStore((s) => s.deleteTask);
  const togglePin       = useTasksStore((s) => s.togglePin);
  const setPriority     = useTasksStore((s) => s.setPriority);
  const updateTask      = useTasksStore((s) => s.updateTask);

  // Count tasks per date for calendar dots
  const tasksCountByDate = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.forEach((t) => {
      counts[t.date] = (counts[t.date] ?? 0) + 1;
    });
    return counts;
  }, [tasks]);

  return (
    <div className="flex h-full overflow-hidden">
      {/* Calendar sidebar */}
      <div className="w-56 flex-shrink-0 border-r border-surface-100 dark:border-surface-800 p-4 overflow-y-auto">
        <MiniCalendar
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          tasksCountByDate={tasksCountByDate}
        />
      </div>

      {/* Day column */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <DayColumn
          date={selectedDate}
          tasks={tasksForDate}
          onAdd={(title) => createTask({ title, date: selectedDate })}
          onToggleComplete={toggleComplete}
          onDelete={deleteTask}
          onTogglePin={togglePin}
          onSetPriority={setPriority}
          onUpdateTitle={(id, title) => updateTask(id, { title })}
          onUpdateDescription={(id, desc) => updateTask(id, { description: desc })}
        />
      </div>
    </div>
  );
};
