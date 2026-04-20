"use server";

import { revalidatePath } from "next/cache";

import { api, ApiError, humanizeDetail } from "@/lib/api";
import {
  PolicyCreatePayload,
  type ImportResult,
  type Policy,
  type PolicyStatus,
} from "@/lib/schemas";

type ActionResult<T> =
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

export async function createPolicyAction(
  raw: unknown,
): Promise<ActionResult<Policy>> {
  const parsed = PolicyCreatePayload.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((i) => i.message).join("; "),
    };
  }
  try {
    const policy = await api.policies.create(parsed.data);
    revalidatePath("/policies");
    return { ok: true, data: policy };
  } catch (err) {
    return fail(err);
  }
}

export async function updatePolicyStatusAction(
  id: number,
  status: PolicyStatus,
): Promise<ActionResult<Policy>> {
  try {
    const policy = await api.policies.update(id, { status });
    revalidatePath("/policies");
    return { ok: true, data: policy };
  } catch (err) {
    return fail(err);
  }
}

export async function deletePolicyAction(
  id: number,
): Promise<ActionResult<true>> {
  try {
    await api.policies.remove(id);
    revalidatePath("/policies");
    return { ok: true, data: true };
  } catch (err) {
    return fail(err);
  }
}

export async function runRenewalsAction(): Promise<
  ActionResult<{
    flagged_renewal_due: number;
    marked_expired: number;
    tasks_created: number;
  }>
> {
  try {
    const result = await api.policies.runRenewals();
    revalidatePath("/policies");
    revalidatePath("/tasks");
    return { ok: true, data: result };
  } catch (err) {
    return fail(err);
  }
}

export async function importPoliciesAction(
  form: FormData,
): Promise<ActionResult<ImportResult>> {
  const file = form.get("file");
  const dryRun = form.get("dry_run") === "true";

  if (!(file instanceof File)) {
    return { ok: false, error: "No file provided" };
  }
  if (!file.name.toLowerCase().endsWith(".xlsx")) {
    return { ok: false, error: "Please upload a .xlsx file" };
  }

  try {
    const buf = await file.arrayBuffer();
    const result = await api.policies.import({
      filename: file.name,
      content: buf,
      contentType: file.type,
      dryRun,
    });
    if (!dryRun) {
      revalidatePath("/policies");
      revalidatePath("/tasks");
    }
    return { ok: true, data: result };
  } catch (err) {
    return fail(err);
  }
}
