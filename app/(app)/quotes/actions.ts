"use server";

import { revalidatePath } from "next/cache";

import {
  acceptQuote,
  apiFetch,
  createQuote,
  deleteQuote,
  updateQuote,
  ApiError,
  humanizeDetail,
} from "@/lib/api";
import {
  CreateQuoteSchema,
  Policy,
  QuoteSchema,
  UpdateQuoteSchema,
  type Policy as PolicyRow,
  type Quote,
  type QuoteStatus,
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

function parseQuote(raw: unknown): ActionResult<Quote> {
  const parsed = QuoteSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Unexpected response shape from quotes API",
    };
  }
  return { ok: true, data: parsed.data };
}

export async function createQuoteAction(
  raw: unknown,
): Promise<ActionResult<Quote>> {
  const parsed = CreateQuoteSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((i) => i.message).join("; "),
    };
  }
  const l = parsed.data.lead_id?.trim();
  const c = parsed.data.customer_id?.trim();
  const body = {
    lead_id: l ? Number(l) : undefined,
    customer_id: c ? Number(c) : undefined,
    policy_type: parsed.data.policy_type,
    insurer: parsed.data.insurer,
    premium_quoted: parsed.data.premium_quoted,
    valid_until: parsed.data.valid_until,
    notes: parsed.data.notes?.trim() ? parsed.data.notes.trim() : null,
  };
  try {
    const created = await createQuote(body);
    const out = parseQuote(created);
    if (!out.ok) return out;
    revalidatePath("/quotes");
    return out;
  } catch (err) {
    return fail(err);
  }
}

export async function updateQuoteAction(
  id: string,
  raw: unknown,
): Promise<ActionResult<Quote>> {
  const parsed = UpdateQuoteSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((i) => i.message).join("; "),
    };
  }
  try {
    const updated = await updateQuote(id, {
      policy_type: parsed.data.policy_type,
      insurer: parsed.data.insurer,
      premium_quoted: parsed.data.premium_quoted,
      valid_until: parsed.data.valid_until,
      notes: parsed.data.notes?.trim() ? parsed.data.notes.trim() : null,
    });
    const out = parseQuote(updated);
    if (!out.ok) return out;
    revalidatePath("/quotes");
    return out;
  } catch (err) {
    return fail(err);
  }
}

export async function updateQuoteStatusAction(
  id: string,
  status: QuoteStatus,
): Promise<ActionResult<Quote>> {
  try {
    let raw: unknown;
    if (status === "rejected") {
      raw = await apiFetch<unknown>(`/quotes/${id}/reject`, {
        method: "POST",
      });
    } else {
      raw = await updateQuote(id, { status });
    }
    const out = parseQuote(raw);
    if (!out.ok) return out;
    revalidatePath("/quotes");
    return out;
  } catch (err) {
    return fail(err);
  }
}

export async function acceptQuoteAction(
  id: string,
): Promise<ActionResult<PolicyRow>> {
  try {
    const raw = await acceptQuote(id);
    const policyParsed = Policy.safeParse(raw);
    if (!policyParsed.success) {
      return {
        ok: false,
        error: "Unexpected response when accepting quote (policy shape)",
      };
    }
    revalidatePath("/quotes");
    revalidatePath("/policies");
    return { ok: true, data: policyParsed.data };
  } catch (err) {
    return fail(err);
  }
}

export async function deleteQuoteAction(
  id: string,
): Promise<ActionResult<true>> {
  try {
    await deleteQuote(id);
    revalidatePath("/quotes");
    return { ok: true, data: true };
  } catch (err) {
    return fail(err);
  }
}
