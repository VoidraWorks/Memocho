// ─── Tasks service — mock implementation (localStorage) ──────────────────────

import type { Task, CreateTaskInput, UpdateTaskInput } from "../types";
import { storage } from "./storage";
import { nanoid } from "./nanoid";

const KEY = "tasks";

function now() {
  return new Date().toISOString();
}

export const tasksService = {
  getAll(): Task[] {
    return storage.get<Task[]>(KEY, []);
  },

  getByDate(date: string): Task[] {
    return this.getAll()
      .filter((t) => t.date === date)
      .sort((a, b) => a.order - b.order);
  },

  create(input: CreateTaskInput): Task {
    const tasks = this.getAll();
    const dateTaskCount = tasks.filter((t) => t.date === input.date).length;
    const task: Task = {
      id: nanoid(),
      title: input.title,
      description: input.description,
      completed: false,
      priority: input.priority ?? "none",
      date: input.date,
      order: dateTaskCount,
      pinned: false,
      createdAt: now(),
      updatedAt: now(),
    };
    storage.set(KEY, [...tasks, task]);
    return task;
  },

  update(id: string, input: UpdateTaskInput): Task | undefined {
    const tasks = this.getAll();
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx === -1) return undefined;
    const updated: Task = { ...tasks[idx], ...input, updatedAt: now() };
    tasks[idx] = updated;
    storage.set(KEY, tasks);
    return updated;
  },

  delete(id: string): void {
    storage.set(KEY, this.getAll().filter((t) => t.id !== id));
  },

  toggleComplete(id: string): Task | undefined {
    const task = this.getAll().find((t) => t.id === id);
    if (!task) return undefined;
    return this.update(id, { completed: !task.completed });
  },

  togglePin(id: string): Task | undefined {
    const task = this.getAll().find((t) => t.id === id);
    if (!task) return undefined;
    return this.update(id, { pinned: !task.pinned });
  },

  reorder(_date: string, orderedIds: string[]): void {
    const tasks = this.getAll();
    orderedIds.forEach((id, idx) => {
      const i = tasks.findIndex((t) => t.id === id);
      if (i !== -1) {
        tasks[i] = { ...tasks[i], order: idx, updatedAt: now() };
      }
    });
    storage.set(KEY, tasks);
  },
};
