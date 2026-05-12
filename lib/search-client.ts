/**
 * Browser-safe global search. Calls the Next.js BFF at `/api/zims/search`
 * with `credentials: "include"` so the httpOnly session cookie is sent.
 *
 * Do not import `lib/api.ts` from the client — it is `server-only`.
 */
import {
  GlobalSearchApiResponseSchema,
  type Customer,
  type Lead,
  type LeadStatus,
  type Policy,
  type PolicyStatus,
  type Task,
  type TaskStatus,
  type TaskType,
} from "@/lib/schemas";

export type SearchLeadRow = {
  id: string;
  name: string;
  phone: string | null;
  status: LeadStatus;
};

export type SearchCustomerRow = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
};

export type SearchPolicyRow = {
  id: string;
  policy_number: string;
  policy_type: string;
  status: PolicyStatus;
};

export type SearchTaskRow = {
  id: string;
  title: string;
  type: TaskType;
  status: TaskStatus;
  due_date: string;
};

export type SearchAllResult = {
  leads: SearchLeadRow[];
  customers: SearchCustomerRow[];
  policies: SearchPolicyRow[];
  tasks: SearchTaskRow[];
};

const EMPTY: SearchAllResult = {
  leads: [],
  customers: [],
  policies: [],
  tasks: [],
};

function mapLead(l: Lead): SearchLeadRow {
  return {
    id: String(l.id),
    name: l.name,
    phone: l.phone?.trim() ? l.phone : null,
    status: l.status,
  };
}

function mapCustomer(c: Customer): SearchCustomerRow {
  return {
    id: String(c.id),
    name: c.name,
    phone: c.phone?.trim() && c.phone !== "00000" ? c.phone : null,
    email: c.email ?? null,
  };
}

function mapPolicy(p: Policy): SearchPolicyRow {
  return {
    id: String(p.id),
    policy_number: p.policy_number,
    policy_type: p.policy_type,
    status: p.status,
  };
}

function mapTask(t: Task): SearchTaskRow {
  return {
    id: String(t.id),
    title: t.title,
    type: t.type,
    status: t.status,
    due_date: t.due_date,
  };
}

/**
 * Runs all four entity searches in one BFF round-trip.
 * Never throws — returns empty slices for failures or bad payloads.
 */
export async function searchAll(query: string): Promise<SearchAllResult> {
  const q = query.trim();
  if (q.length < 2) {
    return { ...EMPTY };
  }

  let body: unknown;
  try {
    const res = await fetch(
      `/api/zims/search?${new URLSearchParams({ q })}`,
      {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      },
    );
    try {
      body = await res.json();
    } catch {
      body = null;
    }
    if (!res.ok) {
      return { ...EMPTY };
    }
  } catch {
    return { ...EMPTY };
  }

  const parsed = GlobalSearchApiResponseSchema.safeParse(body);
  if (!parsed.success) {
    return { ...EMPTY };
  }

  const d = parsed.data;
  return {
    leads: d.leads.map(mapLead),
    customers: d.customers.map(mapCustomer),
    policies: d.policies.map(mapPolicy),
    tasks: d.tasks.map(mapTask),
  };
}
