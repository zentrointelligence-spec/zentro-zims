/**
 * Typed client for the ZIMS FastAPI backend.
 *
 * Usage:
 *  - On the server (Server Components, Route Handlers, Server Actions):
 *        import { api } from "@/lib/api";
 *        const { items } = await api.policies.list({ status: "active" });
 *    The server-side code pulls the JWT from the httpOnly cookie via
 *    `getServerToken()`; callers never handle tokens manually.
 *
 *  - On the client (React components, forms):
 *        We never call this module directly from the browser. Instead,
 *        client code hits our Next.js Route Handlers under /api/*, which
 *        read the cookie and forward to this client.
 */
import "server-only";

import { cookies } from "next/headers";

import { env } from "@/lib/env";
import {
  AIGenerateRequestSchema,
  AIGenerateResponseSchema,
  AnalyticsMonthlySchema,
  AnalyticsSummarySchema,
  BroadcastListSchema,
  BroadcastPreviewSchema,
  BroadcastSchema,
  BroadcastSendResponseSchema,
  CreateBroadcastSchema,
  type Agency,
  type AIGenerateRequest,
  type AIGenerateResponse,
  type AnalyticsMonthlyRow,
  type AnalyticsSummary,
  BillingStatusSchema,
  type BillingStatus,
  CheckoutResponseSchema,
  type Broadcast,
  type BroadcastPreview,
  type BroadcastSegment,
  type BroadcastSendResponse,
  type CreateBroadcastPayload,
  type CreateCustomerPayload,
  type CreateInteractionPayload,
  type CreateUserPayload,
  type Customer,
  type ImportResult,
  type Lead,
  type LeadStatus,
  type PaginatedResponse,
  type Policy,
  type PolicyCreatePayload,
  type PolicyStatus,
  PortalResponseSchema,
  type QuoteStatus,
  type Task,
  type TaskStatus,
  type TaskType,
  type UpdateAgencySettingsPayload,
  type UpdateCustomerPayload,
  type User,
} from "@/lib/schemas";

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  public readonly status: number;
  public readonly detail: unknown;

  constructor(status: number, detail: unknown, message?: string) {
    super(message ?? humanizeDetail(detail) ?? `Request failed (${status})`);
    this.status = status;
    this.detail = detail;
  }
}

export function humanizeDetail(detail: unknown): string | null {
  if (!detail) return null;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => {
        if (item && typeof item === "object" && "msg" in item) {
          const loc = "loc" in item && Array.isArray(item.loc)
            ? item.loc.slice(1).join(".")
            : "";
          return loc
            ? `${loc}: ${(item as { msg: string }).msg}`
            : (item as { msg: string }).msg;
        }
        return JSON.stringify(item);
      })
      .join(" · ");
  }
  if (typeof detail === "object" && "detail" in (detail as object)) {
    return humanizeDetail((detail as { detail: unknown }).detail);
  }
  return JSON.stringify(detail);
}

// ---------------------------------------------------------------------------
// Token access (server only)
// ---------------------------------------------------------------------------

export async function getServerToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(env.authCookieName)?.value ?? null;
}

// ---------------------------------------------------------------------------
// Raw fetch wrapper
// ---------------------------------------------------------------------------

type FetchOpts = {
  method?: "GET" | "POST" | "PATCH" | "DELETE" | "PUT";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  /** When true, skip the Authorization header. */
  anonymous?: boolean;
  /** Override the default /api/v1 prefix (e.g. for /health). */
  prefixed?: boolean;
  /**
   * Forward a multipart FormData body. Bypasses JSON encoding.
   */
  form?: FormData;
  /**
   * Revalidate / cache hints passed through to fetch().
   */
  cache?: RequestCache;
  next?: { revalidate?: number; tags?: string[] };
  /** Explicit token for situations where cookies aren't readable. */
  token?: string | null;
};

function buildUrl(path: string, opts: FetchOpts): string {
  const base = env.apiUrl;
  const prefix = opts.prefixed === false ? "" : env.apiPrefix;
  const url = new URL(`${base}${prefix}${path.startsWith("/") ? path : `/${path}`}`);
  if (opts.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      if (v === undefined || v === null || v === "") continue;
      url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

export async function apiFetch<T = unknown>(
  path: string,
  opts: FetchOpts = {},
): Promise<T> {
  const url = buildUrl(path, opts);

  const headers: Record<string, string> = {};
  if (!opts.anonymous) {
    const token = opts.token ?? (await getServerToken());
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  let body: BodyInit | undefined;
  if (opts.form) {
    body = opts.form;
    // let fetch set the multipart boundary
  } else if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.body);
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method: opts.method ?? "GET",
      headers,
      body,
      cache: opts.cache ?? "no-store",
      next: opts.next,
    });
  } catch {
    const base = env.apiUrl;
    const detail =
      `Cannot reach the ZIMS API at ${base}. ` +
      `Start the FastAPI app from the repo root: python -m uvicorn app.main:app --host 127.0.0.1 --port 8000. ` +
      `In web/.env.local use ZIMS_API_URL=http://127.0.0.1:8000 (not localhost) if you still see connection errors.`;
    throw new ApiError(503, detail);
  }

  if (res.status === 204) return undefined as T;

  let payload: unknown;
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    payload = await res.json().catch(() => null);
  } else {
    payload = await res.text().catch(() => "");
  }

  if (!res.ok) {
    const detail =
      payload && typeof payload === "object" && "detail" in payload
        ? (payload as { detail: unknown }).detail
        : payload;
    throw new ApiError(res.status, detail);
  }

  return payload as T;
}

// ---------------------------------------------------------------------------
// Typed resource helpers
// ---------------------------------------------------------------------------

function listQuery(params?: {
  page?: number;
  page_size?: number;
  [extra: string]: unknown;
}) {
  if (!params) return undefined;
  return Object.fromEntries(
    Object.entries(params).map(([k, v]) => [k, v as string | number]),
  );
}

export const api = {
  health: () => apiFetch<{ status: string; database: string }>(
    "/health",
    { anonymous: true, prefixed: false },
  ),

  auth: {
    login: (payload: { email: string; password: string }) =>
      apiFetch<{ access_token: string; user: User }>(
        "/auth/login",
        { method: "POST", body: payload, anonymous: true },
      ),
    register: (payload: {
      agency_name: string;
      admin_name: string;
      admin_email: string;
      admin_password: string;
      subscription_plan?: string;
    }) =>
      apiFetch<{ access_token: string; user: User; agency: Agency }>(
        "/auth/register",
        { method: "POST", body: payload, anonymous: true },
      ),
  },

  users: {
    me: () => apiFetch<User>("/users/me"),
    list: () => apiFetch<PaginatedResponse<User>>("/users"),
  },

  leads: {
    list: (p?: {
      page?: number;
      page_size?: number;
      status?: LeadStatus;
      q?: string;
    }) => apiFetch<PaginatedResponse<Lead>>("/leads", { query: listQuery(p) }),
    get: (id: number) => apiFetch<Lead>(`/leads/${id}`),
  },

  customers: {
    list: (p?: { page?: number; page_size?: number; q?: string }) =>
      apiFetch<PaginatedResponse<Customer>>("/customers", {
        query: listQuery(p),
      }),
    get: (id: number) => apiFetch<Customer>(`/customers/${id}`),
  },

  policies: {
    list: (p?: {
      page?: number;
      page_size?: number;
      status?: PolicyStatus;
      customer_id?: number;
    }) =>
      apiFetch<PaginatedResponse<Policy>>("/policies", {
        query: listQuery(p),
      }),
    get: (id: number) => apiFetch<Policy>(`/policies/${id}`),
    create: (payload: PolicyCreatePayload) =>
      apiFetch<Policy>("/policies", { method: "POST", body: payload }),
    update: (
      id: number,
      payload: Partial<{ status: PolicyStatus; premium: number }>,
    ) =>
      apiFetch<Policy>(`/policies/${id}`, { method: "PATCH", body: payload }),
    remove: (id: number) =>
      apiFetch<void>(`/policies/${id}`, { method: "DELETE" }),
    runRenewals: () =>
      apiFetch<{
        status: string;
        flagged_renewal_due: number;
        marked_expired: number;
        tasks_created: number;
      }>("/policies/renewals/run", { method: "POST" }),
    import: async ({
      filename,
      content,
      contentType,
      dryRun,
    }: {
      filename: string;
      content: ArrayBuffer | Blob;
      contentType: string;
      dryRun: boolean;
    }) => {
      const form = new FormData();
      const blob =
        content instanceof Blob
          ? content
          : new Blob([content], { type: contentType });
      form.append("file", blob, filename);
      return apiFetch<ImportResult>("/policies/import", {
        method: "POST",
        form,
        query: { dry_run: String(dryRun) },
      });
    },
  },

  tasks: {
    list: (p?: {
      page?: number;
      page_size?: number;
      status?: TaskStatus;
      type?: TaskType;
    }) =>
      apiFetch<PaginatedResponse<Task>>("/tasks", { query: listQuery(p) }),
  },
};

// ---------------------------------------------------------------------------
// Customers (Phase 2A) — explicit helpers (search param matches FastAPI)
// ---------------------------------------------------------------------------

export async function getCustomers(params?: {
  page?: number;
  page_size?: number;
  search?: string;
}) {
  return apiFetch<PaginatedResponse<Customer>>("/customers", {
    query: listQuery(params),
  });
}

export async function getCustomer(id: number) {
  return apiFetch<Customer>(`/customers/${id}`);
}

export async function createCustomer(data: CreateCustomerPayload) {
  return apiFetch<Customer>("/customers", { method: "POST", body: data });
}

export async function updateCustomer(id: number, data: UpdateCustomerPayload) {
  return apiFetch<Customer>(`/customers/${id}`, { method: "PATCH", body: data });
}

export async function deleteCustomer(id: number) {
  return apiFetch<void>(`/customers/${id}`, { method: "DELETE" });
}

export async function getCustomerPolicies(
  customerId: number,
  params?: { page?: number; page_size?: number },
) {
  return apiFetch<PaginatedResponse<Policy>>("/policies", {
    query: listQuery({
      ...params,
      customer_id: customerId,
    }),
  });
}

// ---------------------------------------------------------------------------
// Team / users (Phase 2A)
// ---------------------------------------------------------------------------

export async function getUsers(params?: { page?: number; page_size?: number }) {
  return apiFetch<PaginatedResponse<User>>("/users", {
    query: listQuery(params),
  });
}

export async function createUser(data: CreateUserPayload) {
  return apiFetch<User>("/users", { method: "POST", body: data });
}

export async function deleteUser(id: number) {
  return apiFetch<void>(`/users/${id}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Interactions (Phase 2B) — server-only POST helper for Server Actions
// ---------------------------------------------------------------------------

/** Log an interaction (`POST /interactions`). Use `sendWhatsApp` to trigger Twilio when channel is WhatsApp. */
export async function createInteraction(
  data: CreateInteractionPayload,
  opts?: { sendWhatsApp?: boolean },
) {
  return apiFetch<unknown>("/interactions", {
    method: "POST",
    body: {
      lead_id: data.lead_id,
      message: data.message,
      direction: data.direction,
      channel: data.channel,
    },
    query: opts?.sendWhatsApp ? { send: true } : undefined,
  });
}

// ---------------------------------------------------------------------------
// Quotes (Phase 2B)
// ---------------------------------------------------------------------------

export async function getQuotes(params?: {
  page?: number;
  page_size?: number;
  status?: QuoteStatus;
}) {
  return apiFetch<unknown>("/quotes", {
    query: listQuery({
      page: params?.page,
      page_size: params?.page_size,
      ...(params?.status ? { status: params.status } : {}),
    }),
  });
}

export async function createQuote(data: {
  lead_id?: number;
  customer_id?: number;
  policy_type: string;
  insurer: string;
  premium_quoted: string;
  valid_until: string;
  notes?: string | null;
}) {
  return apiFetch<unknown>("/quotes", { method: "POST", body: data });
}

export async function updateQuote(
  id: string | number,
  data: {
    policy_type?: string;
    insurer?: string;
    premium_quoted?: string;
    valid_until?: string;
    status?: QuoteStatus;
    notes?: string | null;
  },
) {
  return apiFetch<unknown>(`/quotes/${id}`, { method: "PATCH", body: data });
}

export async function acceptQuote(id: string | number) {
  return apiFetch<unknown>(`/quotes/${id}/accept`, { method: "POST" });
}

export async function deleteQuote(id: string | number) {
  return apiFetch<void>(`/quotes/${id}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// Agency settings (Phase 2B)
// ---------------------------------------------------------------------------

export async function getAgencySettings() {
  return apiFetch<unknown>("/agency/settings");
}

export async function updateAgencySettings(data: UpdateAgencySettingsPayload) {
  return apiFetch<unknown>("/agency/settings", { method: "PATCH", body: data });
}

// ---------------------------------------------------------------------------
// Analytics (Phase 4)
// ---------------------------------------------------------------------------

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const raw = await apiFetch<unknown>("/analytics/summary");
  return AnalyticsSummarySchema.parse(raw);
}

export async function getAnalyticsMonthly(): Promise<AnalyticsMonthlyRow[]> {
  const raw = await apiFetch<unknown>("/analytics/monthly");
  return AnalyticsMonthlySchema.parse(raw);
}

// ---------------------------------------------------------------------------
// Broadcasts (Phase 4)
// ---------------------------------------------------------------------------

export async function getBroadcasts(params?: {
  page?: number;
  page_size?: number;
  status?: string;
}) {
  const raw = await apiFetch<unknown>("/broadcasts", {
    query: listQuery({
      page: params?.page,
      page_size: params?.page_size ?? 20,
      ...(params?.status ? { status: params.status } : {}),
    }),
  });
  return BroadcastListSchema.parse(raw);
}

export async function createBroadcast(
  data: CreateBroadcastPayload,
): Promise<Broadcast> {
  const body = CreateBroadcastSchema.parse(data);
  const raw = await apiFetch<unknown>("/broadcasts", {
    method: "POST",
    body,
  });
  return BroadcastSchema.parse(raw);
}

export async function sendBroadcast(
  id: number,
): Promise<BroadcastSendResponse> {
  const raw = await apiFetch<unknown>(`/broadcasts/${id}/send`, {
    method: "POST",
  });
  return BroadcastSendResponseSchema.parse(raw);
}

export async function previewBroadcast(
  id: number,
  segment: BroadcastSegment,
  policyTypeFilter?: string | null,
): Promise<BroadcastPreview> {
  const raw = await apiFetch<unknown>(`/broadcasts/${id}/preview`, {
    method: "POST",
    body: {
      target_segment: segment,
      policy_type_filter: policyTypeFilter ?? null,
    },
  });
  return BroadcastPreviewSchema.parse(raw);
}

export async function deleteBroadcast(id: number): Promise<void> {
  await apiFetch<void>(`/broadcasts/${id}`, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// AI content (Phase 4)
// ---------------------------------------------------------------------------

export async function generateAIContent(
  data: AIGenerateRequest,
): Promise<AIGenerateResponse> {
  const body = AIGenerateRequestSchema.parse(data);
  const raw = await apiFetch<unknown>("/ai/generate", {
    method: "POST",
    body,
  });
  return AIGenerateResponseSchema.parse(raw);
}

// ---------------------------------------------------------------------------
// Billing (Phase 5)
// ---------------------------------------------------------------------------

export async function getBillingStatus(): Promise<BillingStatus> {
  const raw = await apiFetch<unknown>("/billing/status");
  return BillingStatusSchema.parse(raw);
}

export async function createCheckoutSession(data: {
  price_id: string;
  success_url: string;
  cancel_url: string;
}) {
  const raw = await apiFetch<unknown>("/billing/checkout", {
    method: "POST",
    body: data,
  });
  return CheckoutResponseSchema.parse(raw);
}

export async function createPortalSession(data: { return_url: string }) {
  const raw = await apiFetch<unknown>("/billing/portal", {
    method: "POST",
    body: data,
  });
  return PortalResponseSchema.parse(raw);
}

// ---------------------------------------------------------------------------
// Onboarding — `app/api/zims/*` route handlers forward to FastAPI via these.
// ---------------------------------------------------------------------------

export async function onboardingPatchAgencySettings(
  data: UpdateAgencySettingsPayload,
) {
  return updateAgencySettings(data);
}

export async function onboardingImportPolicies(args: {
  filename: string;
  content: ArrayBuffer | Blob;
  contentType: string;
  dryRun: boolean;
}) {
  return api.policies.import(args);
}

export async function onboardingCreateUser(data: CreateUserPayload) {
  return createUser(data);
}
