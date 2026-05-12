/**
 * Server-side auth helpers.
 *
 * Architecture:
 *   1. User submits /login form → POST /api/auth/login (Next.js route handler)
 *   2. Route handler calls FastAPI /api/v1/auth/login
 *   3. On success, we set an httpOnly cookie containing the JWT, plus a
 *      `zentro_user` cookie (non-httpOnly) with the serialised user so the
 *      UI shell can render without an extra round-trip.
 *   4. Middleware on (app)/* checks the session cookie on every request;
 *      if missing, it redirects to /login.
 *   5. Server components fetch data through lib/api.ts, which reads the
 *      cookie on every call.
 */
import "server-only";

import { cookies } from "next/headers";

import { env } from "@/lib/env";
import { api, ApiError } from "@/lib/api";
import type { User } from "@/lib/schemas";

export const USER_COOKIE = "zentro_user";
const SESSION_TTL_SECONDS = 60 * 60 * 24; // 1 day — backend JWT is 24h too

export type SessionUser = Pick<
  User,
  "id" | "name" | "email" | "role" | "agency_id"
>;

export async function setSession(token: string, user: User): Promise<void> {
  const jar = await cookies();
  const common = {
    path: "/",
    sameSite: "lax" as const,
    secure: env.isProduction,
    maxAge: SESSION_TTL_SECONDS,
  };
  jar.set(env.authCookieName, token, {
    ...common,
    httpOnly: true,
  });
  const safeUser: SessionUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    agency_id: user.agency_id,
  };
  jar.set(USER_COOKIE, JSON.stringify(safeUser), {
    ...common,
    httpOnly: false,
  });
}

export async function clearSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(env.authCookieName);
  jar.delete(USER_COOKIE);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const raw = jar.get(USER_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

/**
 * Validate the session against the backend by calling /users/me. Useful for
 * server components that need to be sure the JWT hasn't expired.
 */
export async function requireUser(): Promise<User> {
  try {
    return await api.users.me();
  } catch (err) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
      await clearSession();
    }
    throw err;
  }
}
