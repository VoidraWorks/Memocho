import { create } from "zustand";
import { tasksService } from "../services/tasks";
import type { Task, CreateTaskInput, UpdateTaskInput, Priority } from "../types";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

interface TasksState {
  tasks: Task[];
  selectedDate: string;

  // Actions
  loadTasks: () => void;
  createTask: (input: CreateTaskInput) => Task;
  updateTask: (id: string, input: UpdateTaskInput) => void;
  deleteTask: (id: string) => void;
  toggleComplete: (id: string) => void;
  togglePin: (id: string) => void;
  setPriority: (id: string, priority: Priority) => void;
  reorderTasks: (date: string, orderedIds: string[]) => void;
  setSelectedDate: (date: string) => void;
}

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  selectedDate: todayISO(),

  loadTasks: async () => {
    const tasks = await tasksService.getAll();
    set({ tasks });
  },

  createTask: (input) => {
    const optimisticTask = {
      id: crypto.randomUUID(),
      title: input.title,
      description: input.description,
      completed: false,
      priority: input.priority ?? "none",
      date: input.date,
      order: 0,
      pinned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as Task;
    set((s) => ({ tasks: [...s.tasks, optimisticTask] }));
    void tasksService.create(input).then((task) => {
      set((s) => ({ tasks: s.tasks.map((entry) => (entry.id === optimisticTask.id ? task : entry)) }));
    });
    return optimisticTask;
  },

  updateTask: (id, input) => {
    void tasksService.update(id, input).then((updated) => {
      if (updated) {
        set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? updated : t)) }));
      }
    });
  },

  deleteTask: (id) => {
    void tasksService.delete(id);
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
  },

  toggleComplete: (id) => {
    void tasksService.toggleComplete(id).then((updated) => {
      if (updated) {
        set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? updated : t)) }));
      }
    });
  },

  togglePin: (id) => {
    void tasksService.togglePin(id).then((updated) => {
      if (updated) {
        set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? updated : t)) }));
      }
    });
  },

  setPriority: (id, priority) => {
    get().updateTask(id, { priority });
  },

  reorderTasks: (date, orderedIds) => {
    void tasksService.reorder(date, orderedIds).then(() => {
      set((s) => {
        const updated = s.tasks.map((t) => {
          const idx = orderedIds.indexOf(t.id);
          return t.date === date && idx !== -1 ? { ...t, order: idx } : t;
        });
        return { tasks: updated };
      });
    });
  },

  setSelectedDate: (date) => set({ selectedDate: date }),
}));

// ── Selector helpers (stable, safe to use in component hooks) ─────────────────

export function selectTasksForDate(tasks: Task[], date: string): Task[] {
  return tasks
    .filter((t) => t.date === date)
    .sort((a, b) => a.order - b.order);
}

export function selectTodayTasks(tasks: Task[]): Task[] {
  return selectTasksForDate(tasks, new Date().toISOString().slice(0, 10));
}

export function selectPinnedTasks(tasks: Task[]): Task[] {
  return tasks.filter((t) => t.pinned);
}
