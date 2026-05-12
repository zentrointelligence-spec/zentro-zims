import { NextResponse } from "next/server";

import { apiFetch } from "@/lib/api";
import {
  type Interaction,
  InteractionSchema,
  Paginated,
  Policy,
  Task,
} from "@/lib/schemas";

function itemsFromPaginated(
  raw: unknown,
  itemSchema: Parameters<typeof Paginated>[0],
): unknown[] {
  const parsed = Paginated(itemSchema).safeParse(raw);
  return parsed.success ? parsed.data.items : [];
}

export async function GET() {
  const [tasksR, renewR, expR, intR] = await Promise.allSettled([
    apiFetch<unknown>("/tasks", {
      query: { status: "pending", page: 1, page_size: 20 },
    }),
    apiFetch<unknown>("/policies", {
      query: { status: "renewal_due", page: 1, page_size: 10 },
    }),
    apiFetch<unknown>("/policies", {
      query: { status: "expired", page: 1, page_size: 10 },
    }),
    apiFetch<unknown>("/interactions", {
      query: { page: 1, page_size: 10 },
    }),
  ]);

  const tasks =
    tasksR.status === "fulfilled"
      ? (itemsFromPaginated(tasksR.value, Task) as Task[])
      : [];
  const renewalPolicies =
    renewR.status === "fulfilled"
      ? (itemsFromPaginated(renewR.value, Policy) as Policy[])
      : [];
  const expiredPolicies =
    expR.status === "fulfilled"
      ? (itemsFromPaginated(expR.value, Policy) as Policy[])
      : [];
  const interactions =
    intR.status === "fulfilled"
      ? (itemsFromPaginated(intR.value, InteractionSchema) as Interaction[])
      : [];

  return NextResponse.json({
    tasks,
    renewalPolicies,
    expiredPolicies,
    interactions,
  });
}
