// ─── Tasks service — connected to the Worker API ─────────────────────────────

import type { Task, CreateTaskInput, UpdateTaskInput } from "../types";
import { apiClient } from "./api";

function normalizeTask(task: any): Task {
  const order = task.position ?? task.order ?? 0;
  return {
    ...task,
    description: task.description ?? undefined,
    order,
    position: order,
  };
}

export const tasksService = {
  async getAll(): Promise<Task[]> {
    const result = await apiClient.get<{ tasks: Task[] }>("/api/tasks");
    if (!result.success) return [];
    return result.data.tasks.map(normalizeTask);
  },

  async getByDate(date: string): Promise<Task[]> {
    const result = await apiClient.get<{ tasks: Task[] }>(`/api/tasks?date=${encodeURIComponent(date)}`);
    if (!result.success) return [];
    return result.data.tasks.map(normalizeTask);
  },

  async create(input: CreateTaskInput): Promise<Task> {
    const result = await apiClient.post<{ task: Task }>("/api/tasks", {
      title: input.title,
      description: input.description ?? null,
      date: input.date,
      priority: input.priority ?? "none",
      pinned: false,
    });
    if (!result.success) {
      throw new Error(result.error.message);
    }
    return normalizeTask(result.data.task);
  },

  async update(id: string, input: UpdateTaskInput): Promise<Task | undefined> {
    const result = await apiClient.put<{ task: Task }>(`/api/tasks/${id}`, input);
    if (!result.success) return undefined;
    return normalizeTask(result.data.task);
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/api/tasks/${id}`);
  },

  async toggleComplete(id: string): Promise<Task | undefined> {
    const existing = (await this.getAll()).find((task) => task.id === id);
    if (!existing) return undefined;
    return this.update(id, { completed: !existing.completed });
  },

  async togglePin(id: string): Promise<Task | undefined> {
    const existing = (await this.getAll()).find((task) => task.id === id);
    if (!existing) return undefined;
    return this.update(id, { pinned: !existing.pinned });
  },

  async reorder(_date: string, orderedIds: string[]): Promise<void> {
    const tasks = await this.getAll();
    for (let index = 0; index < orderedIds.length; index += 1) {
      const id = orderedIds[index];
      const task = tasks.find((entry) => entry.id === id);
      if (!task) continue;
      await this.update(id, {
        position: index,
        order: index,
        updatedAt: new Date().toISOString(),
      });
    }
  },
};
