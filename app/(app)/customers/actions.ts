"use server";

import { revalidatePath } from "next/cache";

import {
  createCustomer,
  deleteCustomer,
  updateCustomer,
  ApiError,
  humanizeDetail,
} from "@/lib/api";
import {
  CreateCustomerSchema,
  UpdateCustomerSchema,
  type CreateCustomerPayload,
  type Customer,
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

function formDataToObject(fd: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of fd.entries()) {
    if (typeof value === "string") out[key] = value;
  }
  return out;
}

export async function createCustomerAction(
  formData: FormData,
): Promise<ActionResult<Customer>> {
  const raw = formDataToObject(formData);
  const parsed = CreateCustomerSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((i) => i.message).join("; "),
    };
  }
  try {
    const phoneTrim = (parsed.data.phone ?? "").trim();
    const emailTrim = parsed.data.email?.trim();
    const addrTrim = parsed.data.address?.trim();
    const body: CreateCustomerPayload = {
      name: parsed.data.name.trim(),
      phone: phoneTrim.length === 0 ? "00000" : phoneTrim,
      ...(emailTrim ? { email: emailTrim } : {}),
      ...(addrTrim ? { address: addrTrim } : {}),
    };
    const customer = await createCustomer(body);
    revalidatePath("/customers");
    return { ok: true, data: customer };
  } catch (err) {
    return fail(err);
  }
}

export async function updateCustomerAction(
  id: number,
  formData: FormData,
): Promise<ActionResult<Customer>> {
  const raw = formDataToObject(formData);
  const parsed = UpdateCustomerSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((i) => i.message).join("; "),
    };
  }
  const body = parsed.data;
  if (Object.keys(body).length === 0) {
    return { ok: false, error: "Nothing to update" };
  }
  try {
    const customer = await updateCustomer(id, body);
    revalidatePath("/customers");
    revalidatePath(`/customers/${id}`);
    return { ok: true, data: customer };
  } catch (err) {
    return fail(err);
  }
}

export async function deleteCustomerAction(
  id: number,
): Promise<ActionResult<true>> {
  try {
    await deleteCustomer(id);
    revalidatePath("/customers");
    revalidatePath(`/customers/${id}`);
    return { ok: true, data: true };
  } catch (err) {
    return fail(err);
  }
}
