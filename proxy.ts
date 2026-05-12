import { NextResponse, type NextRequest } from "next/server";

/**
 * Gate every /app/* route behind a session cookie.
 *
 * We deliberately check only for the cookie's *presence* here — full JWT
 * validation happens on the backend when the app makes its first API call.
 * That keeps middleware edge-fast while still blocking anonymous traffic.
 */
const AUTH_COOKIE = process.env.AUTH_COOKIE_NAME ?? "zentro_session";

// Paths that require an authenticated session. All live under the (app)
// route group; their URLs are listed here explicitly since route groups
// don't alter URLs.
const PROTECTED_PREFIXES = [
  "/ai-tools",
  "/analytics",
  "/billing",
  "/broadcasts",
  "/dashboard",
  "/onboarding",
  "/policies",
  "/quotes",
  "/leads",
  "/customers",
  "/tasks",
  "/interactions",
  "/team",
  "/settings",
];

// Logged-in users shouldn't hit auth pages.
const AUTH_PAGES = new Set(["/login", "/register"]);

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = req.cookies.get(AUTH_COOKIE)?.value;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAuthPage = AUTH_PAGES.has(pathname);

  if (isProtected && !session) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname + req.nextUrl.search);
    return NextResponse.redirect(url);
  }

  if (isAuthPage && session) {
    const url = req.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Skip static assets + Next internals.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)",
  ],
};
