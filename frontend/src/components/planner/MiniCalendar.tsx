import React, { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../lib/cn";
import { Button } from "../ui/Button";

interface MiniCalendarProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  tasksCountByDate?: Record<string, number>; // date → count for dot indicators
}

function toYMD(date: Date): string {
  return date.toISOString().slice(0, 10);
}

const DAYS_OF_WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export const MiniCalendar: React.FC<MiniCalendarProps> = ({
  selectedDate,
  onSelectDate,
  tasksCountByDate = {},
}) => {
  const [viewYear, setViewYear] = React.useState(() => new Date(selectedDate).getFullYear());
  const [viewMonth, setViewMonth] = React.useState(() => new Date(selectedDate).getMonth());

  const todayStr = toYMD(new Date());

  const { weeks } = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay = new Date(viewYear, viewMonth + 1, 0);
    const startPad = firstDay.getDay();
    const days: (Date | null)[] = Array(startPad).fill(null);
    for (let d = 1; d <= lastDay.getDate(); d++) {
      days.push(new Date(viewYear, viewMonth, d));
    }
    // Pad to complete last week
    while (days.length % 7 !== 0) days.push(null);
    const weeks: (Date | null)[][] = [];
    for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
    return { weeks };
  }, [viewYear, viewMonth]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={prevMonth}>
          <ChevronLeft size={12} />
        </Button>
        <span className="text-xs font-semibold text-surface-700 dark:text-surface-300">
          {monthLabel}
        </span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={nextMonth}>
          <ChevronRight size={12} />
        </Button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS_OF_WEEK.map((d) => (
          <div key={d} className="text-center text-xs text-surface-400 dark:text-surface-600 pb-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7">
          {week.map((date, di) => {
            if (!date) return <div key={di} />;
            const dateStr = toYMD(date);
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;
            const hasTasks = (tasksCountByDate[dateStr] ?? 0) > 0;

            return (
              <button
                key={di}
                onClick={() => onSelectDate(dateStr)}
                className={cn(
                  "relative flex items-center justify-center h-7 w-full rounded transition-colors duration-fast text-xs",
                  isSelected
                    ? "bg-primary-500 text-white font-semibold"
                    : isToday
                    ? "text-primary-600 dark:text-primary-400 font-semibold bg-primary-50 dark:bg-primary-900/20"
                    : "text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800"
                )}
              >
                {date.getDate()}
                {hasTasks && !isSelected && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary-400" />
                )}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
};
