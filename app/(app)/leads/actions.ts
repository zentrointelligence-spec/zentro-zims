"use server";

import { revalidatePath } from "next/cache";

import { apiFetch, ApiError, humanizeDetail } from "@/lib/api";
import {
  LeadCreatePayload,
  type Customer,
  type Lead,
  type LeadStatus,
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

export async function createLeadAction(
  raw: unknown,
): Promise<ActionResult<Lead>> {
  const parsed = LeadCreatePayload.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((i) => i.message).join("; "),
    };
  }
  try {
    const lead = await apiFetch<Lead>("/leads", {
      method: "POST",
      body: parsed.data,
    });
    revalidatePath("/leads");
    return { ok: true, data: lead };
  } catch (err) {
    return fail(err);
  }
}

export async function updateLeadStatusAction(
  id: number,
  status: LeadStatus,
): Promise<ActionResult<Lead>> {
  try {
    const lead = await apiFetch<Lead>(`/leads/${id}`, {
      method: "PATCH",
      body: { status },
    });
    revalidatePath("/leads");
    return { ok: true, data: lead };
  } catch (err) {
    return fail(err);
  }
}

export async function convertLeadAction(
  id: number,
): Promise<ActionResult<Customer>> {
  try {
    const customer = await apiFetch<Customer>(`/leads/${id}/convert`, {
      method: "POST",
    });
    revalidatePath("/leads");
    revalidatePath("/customers");
    return { ok: true, data: customer };
  } catch (err) {
    return fail(err);
  }
}

export async function deleteLeadAction(id: number): Promise<ActionResult<true>> {
  try {
    await apiFetch<void>(`/leads/${id}`, { method: "DELETE" });
    revalidatePath("/leads");
    return { ok: true, data: true };
  } catch (err) {
    return fail(err);
  }
}
