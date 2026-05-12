/**
 * Browser-safe interactions API (TanStack Query).
 *
 * Calls same-origin `/api/zims/interactions` so the httpOnly session cookie
 * is sent; the Route Handler forwards to FastAPI with `Authorization`.
 *
 * Do not import `lib/api.ts` from the client — it is `server-only`.
 */
import {
  InteractionListSchema,
  type InteractionListResponse,
} from "@/lib/schemas";

function buildQuery(leadId: number, params?: { page?: number; page_size?: number }) {
  const sp = new URLSearchParams();
  sp.set("lead_id", String(leadId));
  sp.set("page", String(params?.page ?? 1));
  sp.set("page_size", String(params?.page_size ?? 100));
  return sp.toString();
}

/**
 * Fetch paginated interactions for a lead (client-side; credentials forwarded).
 */
export async function getInteractions(
  leadId: number,
  params?: { page?: number; page_size?: number },
): Promise<InteractionListResponse> {
  const qs = buildQuery(leadId, params);
  const res = await fetch(`/api/zims/interactions?${qs}`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  if (!res.ok) {
    const detail =
      body && typeof body === "object" && "detail" in body
        ? (body as { detail: unknown }).detail
        : body;
    const msg =
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? "Validation error"
          : `Request failed (${res.status})`;
    throw new Error(msg);
  }

  const parsed = InteractionListSchema.safeParse(body);
  if (!parsed.success) {
    throw new Error("Unexpected response shape from interactions API");
  }
  return parsed.data;
}
