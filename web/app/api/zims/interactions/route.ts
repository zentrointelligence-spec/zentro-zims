import { NextResponse } from "next/server";

import { apiFetch, ApiError } from "@/lib/api";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const leadRaw = url.searchParams.get("lead_id");
  if (!leadRaw) {
    return NextResponse.json({ detail: "lead_id is required" }, { status: 422 });
  }
  const leadId = Number(leadRaw);
  if (!Number.isFinite(leadId) || leadId <= 0) {
    return NextResponse.json({ detail: "Invalid lead_id" }, { status: 422 });
  }

  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1") || 1);
  const pageSize = Math.min(
    200,
    Math.max(1, Number(url.searchParams.get("page_size") ?? "100") || 100),
  );

  try {
    const data = await apiFetch<unknown>("/interactions", {
      query: { lead_id: leadId, page, page_size: pageSize },
    });
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json(
        { detail: err.detail ?? err.message },
        { status: err.status },
      );
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ detail: message }, { status: 500 });
  }
}
