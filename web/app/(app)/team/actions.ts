"use server";

import { revalidatePath } from "next/cache";

import { createUser, deleteUser, ApiError, humanizeDetail } from "@/lib/api";
import { CreateUserSchema, type User } from "@/lib/schemas";

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

export async function inviteUserAction(
  formData: FormData,
): Promise<ActionResult<User>> {
  const raw = formDataToObject(formData);
  const parsed = CreateUserSchema.safeParse({
    name: raw.name,
    email: raw.email,
    password: raw.password,
    role: raw.role,
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues.map((i) => i.message).join("; "),
    };
  }
  try {
    const user = await createUser(parsed.data);
    revalidatePath("/team");
    return { ok: true, data: user };
  } catch (err) {
    return fail(err);
  }
}

export async function removeUserAction(
  id: number,
): Promise<ActionResult<true>> {
  try {
    await deleteUser(id);
    revalidatePath("/team");
    return { ok: true, data: true };
  } catch (err) {
    return fail(err);
  }
}
