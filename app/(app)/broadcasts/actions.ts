"use server";

import { revalidatePath } from "next/cache";

import {
  ApiError,
  createBroadcast,
  deleteBroadcast,
  humanizeDetail,
  previewBroadcast,
  sendBroadcast,
} from "@/lib/api";
import {
  CreateBroadcastSchema,
  type Broadcast,
  type BroadcastPreview,
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

export async function createBroadcastAction(
  raw: unknown,
): Promise<ActionResult<Broadcast>> {
  const parsed = CreateBroadcastSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((i) => i.message).join("; "),
    };
  }
  try {
    const data = await createBroadcast(parsed.data);
    revalidatePath("/broadcasts");
    return { ok: true, data };
  } catch (err) {
    return fail(err);
  }
}

export async function sendBroadcastAction(
  id: number,
): Promise<ActionResult<{ status: string; broadcast_id: number }>> {
  try {
    const data = await sendBroadcast(id);
    revalidatePath("/broadcasts");
    return { ok: true, data };
  } catch (err) {
    return fail(err);
  }
}

export async function deleteBroadcastAction(
  id: number,
): Promise<ActionResult<true>> {
  try {
    await deleteBroadcast(id);
    revalidatePath("/broadcasts");
    return { ok: true, data: true };
  } catch (err) {
    return fail(err);
  }
}

/**
 * Resolves recipient preview for the current form without leaving a draft row.
 * Creates a temporary draft, calls POST preview, then deletes the draft.
 */
export async function previewBroadcastRecipientsAction(
  raw: unknown,
): Promise<ActionResult<BroadcastPreview>> {
  const parsed = CreateBroadcastSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((i) => i.message).join("; "),
    };
  }

  let tempId: number | null = null;
  try {
    const created = await createBroadcast(parsed.data);
    tempId = created.id;
    const previewData = await previewBroadcast(
      created.id,
      parsed.data.target_segment,
      parsed.data.policy_type_filter ?? null,
    );
    await deleteBroadcast(created.id);
    tempId = null;
    return { ok: true, data: previewData };
  } catch (err) {
    if (tempId !== null) {
      try {
        await deleteBroadcast(tempId);
      } catch {
        /* best-effort cleanup */
      }
    }
    return fail(err);
  }
}
