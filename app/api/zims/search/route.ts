import { NextResponse } from "next/server";

import { apiFetch } from "@/lib/api";
import {
  Customer,
  Lead,
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

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();

  const empty = {
    leads: [] as Lead[],
    customers: [] as Customer[],
    policies: [] as Policy[],
    tasks: [] as Task[],
  };

  if (!q) {
    return NextResponse.json(empty);
  }

  const commonQuery = { search: q, page: 1, page_size: 5 };

  const [lr, cr, pr, tr] = await Promise.allSettled([
    apiFetch<unknown>("/leads", { query: commonQuery }),
    apiFetch<unknown>("/customers", { query: commonQuery }),
    apiFetch<unknown>("/policies", { query: commonQuery }),
    apiFetch<unknown>("/tasks", { query: commonQuery }),
  ]);

  const leads =
    lr.status === "fulfilled" ? (itemsFromPaginated(lr.value, Lead) as Lead[]) : [];
  const customers =
    cr.status === "fulfilled"
      ? (itemsFromPaginated(cr.value, Customer) as Customer[])
      : [];
  const policies =
    pr.status === "fulfilled"
      ? (itemsFromPaginated(pr.value, Policy) as Policy[])
      : [];
  const tasks =
    tr.status === "fulfilled" ? (itemsFromPaginated(tr.value, Task) as Task[]) : [];

  return NextResponse.json({ leads, customers, policies, tasks });
}
