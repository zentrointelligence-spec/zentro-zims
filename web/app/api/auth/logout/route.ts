import { NextResponse } from "next/server";

import { clearSession } from "@/lib/auth";

/** Same-origin relative path only (open-redirect safe). */
function safeRelativeRedirect(path: string | null, fallback: string): string {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return fallback;
  }
  return path;
}

/**
 * Clears session cookies then redirects. Use from Server Components when the
 * backend rejected the JWT (cookies may only be mutated in Route Handlers).
 */
export async function GET(req: Request) {
  await clearSession();
  const url = new URL(req.url);
  const next = safeRelativeRedirect(
    url.searchParams.get("redirect"),
    "/login",
  );
  return NextResponse.redirect(new URL(next, url.origin));
}

export async function POST() {
  await clearSession();
  return NextResponse.json({ ok: true });
}
