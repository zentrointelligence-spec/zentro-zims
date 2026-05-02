"use server";

import { revalidatePath } from "next/cache";

import { apiFetch, ApiError, humanizeDetail } from "@/lib/api";
import {
  Task,
  TaskStatus as TaskStatusSchema,
  TaskType as TaskTypeSchema,
  type TaskStatus,
  type TaskType,
} from "@/lib/schemas";

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status?: number };

function fail(err: unknown): ActionResult<never> {
  if (err instanceof ApiError) {
    return {
      ok: false,
      status: err.status,
      error: humanizeDetail(err.detail) ?? err.message,
    };
  }
  const message = err instanceof Error ? err.message : "Unknown error";
  return { ok: false, error: message };
}

function readTrim(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}

export async function createTaskAction(
  formData: FormData,
): Promise<ActionResult<Task>> {
  const title = readTrim(formData, "title");
  if (title.length < 1) {
    return { ok: false, error: "Title is required" };
  }
  const typeRaw = readTrim(formData, "type");
  const typeParsed = TaskTypeSchema.safeParse(typeRaw);
  if (!typeParsed.success) {
    return { ok: false, error: "Select a valid task type" };
  }
  const dueRaw = readTrim(formData, "due_date");
  if (!dueRaw) {
    return { ok: false, error: "Due date is required" };
  }
  const desc = readTrim(formData, "description");
  const relatedRaw = readTrim(formData, "related_id");
  let related_id: number | null = null;
  if (relatedRaw) {
    const n = Number(relatedRaw);
    if (!Number.isFinite(n)) {
      return { ok: false, error: "Related ID must be a number" };
    }
    related_id = n;
  }

  const body: {
    title: string;
    type: TaskType;
    due_date: string;
    description?: string | null;
    related_id?: number | null;
  } = {
    title,
    type: typeParsed.data,
    due_date: dueRaw,
    description: desc.length ? desc : null,
    related_id,
  };

  try {
    const task = await apiFetch<Task>("/tasks", { method: "POST", body });
    revalidatePath("/tasks");
    return { ok: true, data: task };
  } catch (err) {
    return fail(err);
  }
}

export async function updateTaskStatusAction(
  id: number,
  status: TaskStatus,
): Promise<ActionResult<Task>> {
  const parsed = TaskStatusSchema.safeParse(status);
  if (!parsed.success) {
    return { ok: false, error: "Invalid status" };
  }
  try {
    const task = await apiFetch<Task>(`/tasks/${id}`, {
      method: "PATCH",
      body: { status: parsed.data },
    });
    revalidatePath("/tasks");
    return { ok: true, data: task };
  } catch (err) {
    return fail(err);
  }
}

export async function updateTaskAction(
  id: number,
  formData: FormData,
): Promise<ActionResult<Task>> {
  const title = readTrim(formData, "title");
  if (title.length < 1) {
    return { ok: false, error: "Title is required" };
  }
  const typeRaw = readTrim(formData, "type");
  const typeParsed = TaskTypeSchema.safeParse(typeRaw);
  if (!typeParsed.success) {
    return { ok: false, error: "Select a valid task type" };
  }
  const dueRaw = readTrim(formData, "due_date");
  if (!dueRaw) {
    return { ok: false, error: "Due date is required" };
  }
  const desc = readTrim(formData, "description");

  const body: {
    title: string;
    type: TaskType;
    due_date: string;
    description?: string | null;
  } = {
    title,
    type: typeParsed.data,
    due_date: dueRaw,
    description: desc.length ? desc : null,
  };

  try {
    const task = await apiFetch<Task>(`/tasks/${id}`, {
      method: "PATCH",
      body,
    });
    revalidatePath("/tasks");
    return { ok: true, data: task };
  } catch (err) {
    return fail(err);
  }
}

export async function deleteTaskAction(id: number): Promise<ActionResult<true>> {
  try {
    await apiFetch<void>(`/tasks/${id}`, { method: "DELETE" });
    revalidatePath("/tasks");
    return { ok: true, data: true };
  } catch (err) {
    return fail(err);
  }
}
