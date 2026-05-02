# Zentro — Next.js frontend

The public-facing and customer-facing surface for the Zentro Insurance
Management System. Everything under `web/` is a **Next.js 16 app** that talks
to the existing FastAPI backend (in `../app/`); the backend is unchanged.

**Phase 1** delivered auth, the **Policies** vertical slice, and the app shell.
**Phase 2 (in progress)** adds the CRM UI: leads, customers, tasks,
interactions, team, **quotes**, and **agency settings** (admin-only), using
`lib/api.ts` + Server Components / Server Actions.

**Phase 3** refreshed the **public marketing** experience in `(marketing)/`:
landing, dedicated `/pricing` + FAQ, `/blog` with static posts
(`lib/blog-posts.ts`) — **no** FastAPI calls, **no** auth, prerendered static/SSG.
See [`../docs/PHASE-3-MARKETING-WEB.md`](../docs/PHASE-3-MARKETING-WEB.md).

**Authenticated app polish** (loading skeletons, empty states, toasts, page fade-in, confirm dialogs, **`N`** for new-item dialogs, inline submit spinners) is documented in [`../docs/WEB-APP-UI-POLISH.md`](../docs/WEB-APP-UI-POLISH.md).

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack, Server Components) |
| UI | shadcn/ui (`base-nova` style, Base UI primitives) + Tailwind v4 |
| Forms | React Hook Form + zod resolvers |
| Data | TanStack Query (client) + direct `fetch` (server components) |
| Theme | Neutral zinc canvas + indigo accent; light/dark via `@wrksz/themes` |
| Auth | FastAPI-issued JWT stored in an httpOnly cookie |
| Deploy | Designed for Vercel; marketing at `zentro.io`, app at `app.zentro.io` |

---

## Local dev

```bash
# 1) Start the FastAPI backend (from repo root).
#    Use `python -m uvicorn` — the bare `uvicorn` CLI isn't guaranteed
#    to be on PATH when the package is installed into the active Python.
python -m uvicorn app.main:app --reload --port 8000

# 2) Start the Next.js frontend
cd web
cp .env.example .env.local   # first time only
npm install                  # first time only
npm run dev                  # http://localhost:3000
```

If the browser stays on a **blank page** with the tab stuck on **“Loading…”**, the dev server may still be listening on `:3000` but not completing responses (for example after a crash or hot-reload glitch). From another shell, `curl -m 5 http://127.0.0.1:3000/` should return HTML quickly; if it **hangs with 0 bytes**, stop the process (`ss -ltnp | grep 3000` to find the PID, then `kill` / `kill -9`) and run `npm run dev` again. As a fallback you can use **`npm run dev:webpack`** (webpack dev instead of Turbopack). For a stable preview without hot reload, use **`npm run build && npm run start`**.

The dev server calls the backend from **Node** using `ZIMS_API_URL` in `.env.local`. Prefer **`http://127.0.0.1:8000`** (not `localhost`) so server `fetch` matches uvicorn’s IPv4 bind.

Program-level docs: [`../docs/00-CORE-ZIMS-PROGRAM.md`](../docs/00-CORE-ZIMS-PROGRAM.md). Phase-by-phase shipped summary: [`../docs/PHASES-SHIPPED-SUMMARY.md`](../docs/PHASES-SHIPPED-SUMMARY.md).

### Verification

```bash
npm run lint        # ESLint
npx tsc --noEmit    # strict TypeScript
npm run build       # full production build
```

Optional: maintain a local smoke script (e.g. curl-based) for registration, login, gated routes, and logout — not checked into the repo by default.

---

## Architecture

### Route groups

Route groups in Next.js don't affect URLs — they're purely for applying
shared layouts:

```
app/
├── (marketing)/        → public site: /, /pricing, /blog, /blog/[slug]
│   ├── layout.tsx      MarketingNav + Footer (no app shell)
│   ├── page.tsx        Landing
│   ├── pricing/
│   └── blog/
├── (auth)/             → /login, /register
│   └── layout.tsx      (split-screen marketing pane)
├── (app)/              → authenticated app
│   ├── layout.tsx      (sidebar + topbar via AppShell)
│   ├── dashboard/
│   ├── policies/       ← Phase 1 vertical slice + actions
│   ├── leads/          ← Phase 2 list + actions
│   ├── customers/      ← Phase 2 list + profile + actions
│   ├── tasks/
│   ├── interactions/   ← timeline + actions
│   ├── quotes/         ← quotes module + actions
│   ├── analytics/      ← KPIs + charts
│   ├── broadcasts/     ← WhatsApp campaign drafts + send
│   ├── billing/        ← admin-only subscription UI
│   ├── ai-tools/       ← AI content helpers (client)
│   ├── settings/       ← admin-only agency settings + actions
│   └── team/           ← admin-gated + actions
└── api/
    └── auth/           → login / register / logout route handlers
```

### Auth flow

1. User posts to `/api/auth/login` (a Next.js route handler)
2. Route handler forwards to FastAPI `/api/v1/auth/login`
3. On success we set two cookies:
   - `zentro_session` — httpOnly, contains the JWT
   - `zentro_user` — readable by JS, contains name/role/agency_id for UI
4. `proxy.ts` checks `zentro_session` on every protected request (explicit
   prefixes include `/dashboard`, `/policies`, `/leads`, `/customers`, `/tasks`,
   `/interactions`, `/quotes`, `/settings`, `/team`, …); redirects to
   `/login?next=...` if missing
5. Server components call `lib/api.ts`, which reads the cookie and
   Authorization-headers each request
6. On 401/403 from the backend, the `(app)` layout clears cookies and
   redirects to `/login?reason=expired`

### Typed API client (`lib/api.ts`)

Server-only module (marked with `import "server-only"`) that mirrors the
FastAPI surface:

```ts
await api.policies.list({ status: "renewal_due" })
await api.policies.import({ filename, content, contentType, dryRun })
await api.auth.login({ email, password })
```

Client code **never** calls this directly — browser-initiated writes go
through **Server Actions** under `app/(app)/*/actions.ts` (e.g. policies,
leads, customers, quotes, settings, team, interactions) so the httpOnly
cookie stays inaccessible to JS.

### Schemas (`lib/schemas.ts`)

Zod schemas mirror the Pydantic models. Used for:
- Parsing responses (defensive)
- Validating form payloads on the server (route handlers / actions)
- Inferring types across the app

---

## What's shipped (Phase 1 + Phase 2 web)

### Marketing site (Phase 3)

- `/` — landing (hero, features, how-it-works, pricing preview, CTA); `metadata` + Open Graph
- `/pricing` — three tiers, FAQ accordion, CTA
- `/blog` + `/blog/[slug]` — static posts from `lib/blog-posts.ts`; `generateStaticParams` for SSG

### Auth (Phase 1)

- `/login`, `/register` — auth forms with server-side validation
- Light / dark mode (`ThemeToggle` in **app shell** and auth panel; marketing layout has no toggle) via `@wrksz/themes`

### Authenticated app

- `/dashboard` — KPI cards (policies, leads, customers, pending tasks)
- `/policies` — vertical slice:
  - Paginated table with server-side filters (status, page size)
  - Status chips, expiry countdown, inline row actions
  - `New policy` dialog with RHF + Zod
  - `Import Excel` dialog with dry-run, row-level error reporting
  - `Run renewals` button → `/policies/renewals/run`
- `/leads` — list, filters, pagination, server actions
- `/customers` + `/customers/[id]` — directory + profile / linked policies
- `/tasks` — placeholder (`ComingSoon`); full queue UI TBD
- `/interactions` — interaction timeline + server actions
- `/team` — **admin-only** (session cookie role); invites / user management + actions
- `/quotes` — quote pipeline: filters, create/edit, status transitions, accept → creates policy, delete; `lib/api` helpers + Zod schemas
- `/analytics` — agency KPIs + charts (summary + monthly trend)
- `/broadcasts` — campaign list, create, preview recipients, send, delete
- `/billing` — **admin-only**; plan/status and Stripe checkout/portal when configured
- `/ai-tools` — AI-assisted content generation client
- `/settings` — **admin-only**; three independent save sections (profile, renewal window + template, timezone + birthday template); `GET` / `PATCH` agency settings via API client

### Conventions (maintain across new pages)

- **Server `page.tsx`** loads data; **`actions.ts`** holds mutations with `revalidatePath` where needed.
- **Zod** lives in `lib/schemas.ts` only (no inline `z.object` in route folders).
- **UI primitives:** prefer `render={<…/>}` on Base UI triggers (not `asChild`).
- **TanStack Query:** used for post-mutation cache refresh patterns where applicable; initial lists often come from the server page.

### UX polish (see `docs/WEB-APP-UI-POLISH.md`)

- Add **`app/(app)/<segment>/loading.tsx`** for any new **data** page (Server Component, skeleton layout aligned with the page).
- Use **`EmptyState`** (+ optional **`action`**) for empty lists; keep filtered-empty vs truly-empty distinct where search exists.
- Mutations: **`toastMutationError`** for failures; success strings per domain (see doc tables).
- Forms: inline **`FormMessage`**; submit buttons use **`InlineSpinner`** + fixed label.
- New list pages with a create dialog: wire **`useKeyboardShortcut("n", …)`** when dialog is closed; support **`?create=1`** if other pages deep-link to “new”.

---

## Still deferred (later Phase 2+)

- Leads Kanban view (optional)
- AI assistant chat surface (backend exists)
- i18n
- Mobile-polished shell (dedicated small-screen nav)
- Stripe billing hooks
- Logo upload to blob/S3 (settings currently uses URL text field only)

Backend endpoints for most of the above already exist — remaining work is
product polish and new surfaces, not greenfield APIs.
