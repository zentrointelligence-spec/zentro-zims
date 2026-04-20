/**
 * Typed environment access. Throws at import-time in dev if anything
 * required is missing, so misconfiguration is loud, not silent.
 */

/** Node + uvicorn often disagree on `localhost` (::1 vs 127.0.0.1). Force IPv4 loopback. */
function normalizeBackendOrigin(raw: string): string {
  const trimmed = raw.replace(/\/+$/, "");
  try {
    const u = new URL(
      /^[a-z]+:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`,
    );
    if (u.hostname === "localhost" || u.hostname === "::1") {
      u.hostname = "127.0.0.1";
    }
    return `${u.protocol}//${u.host}`;
  } catch {
    return trimmed;
  }
}

const required = {
  ZIMS_API_URL: process.env.ZIMS_API_URL ?? "http://127.0.0.1:8000",
  ZIMS_API_PREFIX: process.env.ZIMS_API_PREFIX ?? "/api/v1",
  AUTH_COOKIE_NAME: process.env.AUTH_COOKIE_NAME ?? "zentro_session",
} as const;

for (const [key, value] of Object.entries(required)) {
  if (!value) {
    throw new Error(`Missing env var: ${key}`);
  }
}

export const env = {
  apiUrl: normalizeBackendOrigin(required.ZIMS_API_URL),
  apiPrefix: required.ZIMS_API_PREFIX.startsWith("/")
    ? required.ZIMS_API_PREFIX
    : `/${required.ZIMS_API_PREFIX}`,
  authCookieName: required.AUTH_COOKIE_NAME,
  publicSiteUrl:
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  isProduction: process.env.NODE_ENV === "production",
} as const;
