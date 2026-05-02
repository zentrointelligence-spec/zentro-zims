# Phase 1 — Next.js web application

**Status:** Shipped (vertical slice + marketing + auth + shell).  
**Code:** `web/` (Next.js **16**, App Router, Turbopack).

---

## 1. Goals delivered

- **Single Next.js app** with route groups:
  - `(marketing)/` — public marketing: `/`, `/pricing`, `/blog` ([`PHASE-3-MARKETING-WEB.md`](./PHASE-3-MARKETING-WEB.md))
  - `(auth)/` — login, register
  - `(app)/` — authenticated shell: dashboard, **policies** (full slice), plus Phase 2 routes for leads, customers, tasks, interactions, team, **quotes**, and **settings** (see `web/README.md` for the current route list)
- **Cookie-based session** aligned with existing FastAPI JWT (backend unchanged):
  - Route handlers: `web/app/api/auth/login`, `register`, `logout`
  - httpOnly JWT cookie + non-httpOnly `zentro_user` JSON for UI hints
- **Server-only API client** — `web/lib/api.ts` reads cookies and calls FastAPI
- **Server Actions** — `web/app/(app)/policies/actions.ts` for mutations + Excel import
- **Zod** — `web/lib/schemas.ts` mirrors backend contracts
- **TanStack Query** — provider in `web/components/providers.tsx` (client cache)
- **Gate** — `web/proxy.ts` protects app routes, redirects to `/login`
- **Policies vertical slice** — list/filter/paginate, create dialog, row actions, Excel import + dry-run, run renewals
- **UI** — shadcn/ui (Base UI), Tailwind v4, neutral mesh/grid backgrounds, **light + dark** theme toggle
- **Theme implementation** — `@wrksz/themes/next` async `ThemeProvider` in root `app/layout.tsx` (avoids React 19 `next-themes` inline `<script>` warning)
- **Resilience** — `ZIMS_API_URL` normalizes `localhost` → `127.0.0.1` for Node→uvicorn IPv4; `apiFetch` maps network failure to `ApiError(503, …)`
- **App UX polish (presentation only)** — loading skeletons per route, `EmptyState` CTAs, consistent mutation toasts, form error styling, submit spinners, `PageFade`, confirm-dialog copy, **`N`** shortcut for create flows — see [`WEB-APP-UI-POLISH.md`](./WEB-APP-UI-POLISH.md)

---

## 2. Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16, React 19 |
| Styling | Tailwind CSS v4, CSS variables in `app/globals.css` |
| Components | shadcn/ui (Base UI primitives) |
| Forms | React Hook Form + Zod |
| Theme | `@wrksz/themes` (`/next` + `/client` imports) |
| Data fetching | RSC + server `fetch`; TanStack Query for client patterns |

---

## 3. Directory map (high level)

```
web/
├── app/
│   ├── layout.tsx              # Fonts, ThemeProvider (@wrksz/themes/next), Providers, Toaster
│   ├── globals.css             # Design tokens + mesh/grid backgrounds
│   ├── (marketing)/            # Public site
│   ├── (auth)/                 # Login / register layouts + pages
│   ├── (app)/                  # Authenticated app + policies slice
│   └── api/auth/               # Cookie-setting proxies to FastAPI
├── components/
│   ├── ui/                     # shadcn primitives
│   └── zims/                   # App shell, nav, skeletons, empty states, PageFade, toasts helpers, status chips
├── lib/
│   ├── api.ts                  # server-only fetch wrapper
│   ├── auth.ts                 # cookie session helpers, requireUser
│   ├── env.ts                  # env + API URL normalization
│   └── schemas.ts              # Zod models
├── hooks/                      # e.g. useKeyboardShortcut (global key handlers)
├── proxy.ts                    # Session gate (protected prefixes)
└── package.json
```

---

## 4. Environment (frontend)

File: `web/.env.example` → copy to **`web/.env.local`**.

| Variable | Purpose |
|----------|---------|
| `ZIMS_API_URL` | FastAPI origin — use **`http://127.0.0.1:8000`** locally |
| `ZIMS_API_PREFIX` | Usually `/api/v1` |
| `AUTH_COOKIE_NAME` | Session cookie name (must match handlers) |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL for metadata |

---

## 5. Auth & data flow (short)

1. Browser POST `/api/auth/login` with JSON body.
2. Next route handler calls FastAPI `POST /api/v1/auth/login`.
3. On success, sets cookies via `lib/auth.ts` `setSession`.
4. `(app)/layout.tsx` calls `requireUser()` → `api.users.me()` to validate JWT still good.
5. On 401/403, session cleared and redirect to `/login?reason=expired`.
6. On connection failure, `apiFetch` throws **503** with actionable text (backend down / wrong host).

---

## 6. Base UI / React 19 notes (maintainer)

- **`Button` + `Link`:** set `nativeButton={false}` when using `render={<Link … />}`.
- **`DropdownMenuLabel`:** implemented inside `MenuPrimitive.Group` in `components/ui/dropdown-menu.tsx`.
- **`ThemeToggle`:** uses `useSyncExternalStore` to avoid hydration flicker; `useTheme` from `@wrksz/themes/client`.
- **Sonner:** `useTheme` from `@wrksz/themes/client`; `Toaster` must stay inside the theme + query provider tree (root layout nests correctly).

---

## 7. Verification commands

```bash
cd web
npm run lint
npx tsc --noEmit
npm run build
```

---

## 8. Phase 1 changelog (subset)

| Date | Note |
|------|------|
| 2026-04-20 | **App polish:** Documented in `docs/WEB-APP-UI-POLISH.md` — route `loading.tsx`, `Skeleton`/`PageFade`/`app-toast`, `EmptyState`+CTAs, form/button/confirm patterns, `N` shortcut, `?create=1` for leads/customers/policies. |
| 2026-04-21 | **Phase 3 marketing:** `(marketing)/` routes and `PHASE-3-MARKETING-WEB.md`; goals bullet updated to list `/`, `/pricing`, `/blog`. |
| 2026-04-20 | **Phase 2 overlap:** Documented that `(app)/` now includes shipped CRM pages (quotes, settings, etc.); canonical feature list lives in `web/README.md` + `docs/PHASE-2-ROADMAP.md`. |
| 2026-04-18 | Theme system + `@wrksz/themes`; mesh backgrounds; sidebar semantic colors; marketing/auth dark mode. |
| 2026-04-18 | Base UI menu/button fixes; fetch/env hardening for local API. |
| 2026-04-18 | Initial Phase 1 scaffold: route groups, auth, policies slice, proxy gate. |

---

*Update this file when routes, auth, env, or UI architecture change. For a **phase-by-phase shipped** narrative (0→1→2→3), see [`PHASES-SHIPPED-SUMMARY.md`](./PHASES-SHIPPED-SUMMARY.md). For authenticated-app UX polish (skeletons, empty states, toasts, shortcuts), see [`WEB-APP-UI-POLISH.md`](./WEB-APP-UI-POLISH.md). For Phase 2 UI delivery status, prefer [`PHASE-2-ROADMAP.md`](./PHASE-2-ROADMAP.md) and the root changelog in [`00-CORE-ZIMS-PROGRAM.md`](./00-CORE-ZIMS-PROGRAM.md).*
