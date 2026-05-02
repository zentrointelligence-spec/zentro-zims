# What we have shipped — phase by phase

This page is the **high-level narrative** of completed work in order: **Phase 0 → Phase 1 → Phase 2 → Phase 3**, plus **authenticated app UX polish** (cross-cutting on the Next.js app). Deep detail stays in each phase doc (links below).

| Phase | Document | Code (main) |
|-------|----------|-------------|
| **0** | [`PHASE-0-BACKEND-PLATFORM.md`](./PHASE-0-BACKEND-PLATFORM.md) | `app/` |
| **1** | [`PHASE-1-NEXTJS-WEB.md`](./PHASE-1-NEXTJS-WEB.md) | `web/` — shell, auth, policies, infrastructure |
| **2** | [`PHASE-2-ROADMAP.md`](./PHASE-2-ROADMAP.md) | `web/app/(app)/` — CRM + extensions (still “in progress” for some items) |
| **3** | [`PHASE-3-MARKETING-WEB.md`](./PHASE-3-MARKETING-WEB.md) | `web/app/(marketing)/` |
| **Polish** | [`WEB-APP-UI-POLISH.md`](./WEB-APP-UI-POLISH.md) | `web/components/zims/`, `web/hooks/`, `loading.tsx` |

---

## Phase 0 — Backend platform (FastAPI)

**What we did**

- Shipped a **multi-tenant** REST API under **`/api/v1`**: auth (JWT, bcrypt, roles `admin` / `agent`), agencies, users, **leads**, **customers**, **policies**, **tasks**, **interactions**, and related reads/writes.
- **Scoped every business query by `agency_id`** so tenants stay isolated.
- **Renewal automation**: APScheduler runs daily — flags policies **renewal_due** / **expired**, creates renewal tasks idempotently.
- **Excel bulk import** for customers + policies: multipart `.xlsx`, **dry-run**, per-row errors, transactional safety.
- **Integrations**: Twilio WhatsApp path (stub or live), OpenAI assistant with safe fallback.
- **Quality**: Pydantic v2, pagination helpers, consistent error JSON, **`GET /health`**, HTTP tests; removed legacy Streamlit so the API + Next.js are the product surfaces.

**Where to read more:** [`PHASE-0-BACKEND-PLATFORM.md`](./PHASE-0-BACKEND-PLATFORM.md), root [`README.md`](../README.md) (endpoint table).

---

## Phase 1 — Next.js application (foundation + first vertical slice)

**What we did**

- **Single Next.js 16 app** (`web/`) with App Router + Turbopack: route groups **`(marketing)`** (later filled in Phase 3), **`(auth)`**, **`(app)`**, and **`app/api/auth/*`** route handlers.
- **Cookie session** aligned with FastAPI: httpOnly JWT + readable `zentro_user` JSON for UI; login / register / logout flows.
- **`proxy.ts`** gates authenticated prefixes; missing session → **`/login?next=…`**.
- **`lib/api.ts`** (server-only) attaches the JWT to FastAPI; **`lib/schemas.ts`** (Zod) mirrors backend contracts.
- **Server Actions** for mutations (starting with **policies**); **TanStack Query** in the client provider for cache/refetch patterns.
- **Policies vertical slice** in the app: list, filters, pagination, status chips, create dialog, row actions, **Excel import** (with dry-run + row errors), **run renewals** control.
- **Dashboard** first version: KPIs + recent lists (leads, renewals, tasks) fed from the API.
- **UI system**: shadcn/ui (Base UI), Tailwind v4, mesh/grid backgrounds, **light + dark** via **`@wrksz/themes`** (React 19–safe theme injection).
- **Resilience**: normalize **`localhost` → `127.0.0.1`** for server `fetch`; map network failures to a clear **503-style** `ApiError`.

**Where to read more:** [`PHASE-1-NEXTJS-WEB.md`](./PHASE-1-NEXTJS-WEB.md), [`web/README.md`](../web/README.md).

---

## Phase 2 — CRM & agency features in the authenticated app

**What we did** (Next.js **`(app)`** routes + Server Actions / RSC + `lib/api` where applicable)

| Area | What shipped (summary) |
|------|-------------------------|
| **Leads** | `/leads` — list, filters, pagination, create, status updates, convert, delete |
| **Customers** | `/customers`, `/customers/[id]` — directory, search, profile, edit/delete, **linked policies** panel |
| **Policies** | (Phase 1 slice) extended in lockstep with imports/renewals; still the core policy hub |
| **Tasks** | `/tasks` — **placeholder** (`ComingSoon`); full task queue UI still TBD |
| **Interactions** | `/interactions` — lead picker + timeline, send message actions |
| **Team** | `/team` — **admin-only**; invite users, roles, remove members |
| **Quotes** | `/quotes` — pipeline: filters, create/edit, status transitions, **accept → creates policy**, delete |
| **Agency settings** | `/settings` — **admin-only**; profile (WhatsApp, email sender, logo URL), renewal window + template, notification templates |
| **Analytics** | `/analytics` — summary KPIs + charts (server-fetched summaries / monthly series) |
| **Broadcasts** | `/broadcasts` — WhatsApp-oriented campaigns: list, create, preview recipients, send, delete |
| **Billing** | `/billing` — **admin-only** Stripe-oriented UI (plan display, checkout/portal hooks per env) |
| **AI Tools** | `/ai-tools` — client surface for agency AI helpers (content generation UX; evolves with backend) |

**Still planned / partial** (see roadmap): full **AI assistant** chat as a first-class product, **Stripe billing** depth vs marketing tiers, **Kanban** for leads, richer **mobile shell**, i18n, etc.

**Where to read more:** [`PHASE-2-ROADMAP.md`](./PHASE-2-ROADMAP.md), [`web/README.md`](../web/README.md) route list.

---

## Phase 3 — Public marketing site (Next.js)

**What we did**

- **Public routes** (no `lib/api.ts`, no auth cookie required for these paths):
  - **`/`** — landing: hero, features, how-it-works, pricing preview, CTA
  - **`/pricing`** — three tiers, FAQ accordion, CTA
  - **`/blog`** — index of static posts
  - **`/blog/[slug]`** — articles with **`generateStaticParams`** (SSG)
- **SEO**: `metadata` + Open Graph on marketing pages.
- **Layout**: `MarketingNav` + `Footer`, max width **1200px**, **no** app sidebar; **no theme toggle** on marketing shell (per spec).
- **Content**: static blog copy in **`web/lib/blog-posts.ts`** (not Zod-inline in route folders).

**Where to read more:** [`PHASE-3-MARKETING-WEB.md`](./PHASE-3-MARKETING-WEB.md).

---

## Authenticated app — UX polish (cross-cutting)

**What we did** (presentation only; no API/schema changes)

- **Route `loading.tsx`** skeletons for main data pages (leads, customers, policies, tasks, quotes, broadcasts, dashboard, analytics, interactions).
- **`EmptyState`** patterns with correct copy + CTAs; **analytics** zero-data banner.
- **Toasts**: consistent success strings + **`toastMutationError`** for failures.
- **Forms**: inline field errors, invalid **Input** styling, **submit spinners** without swapping button text to “Loading…”.
- **`PageFade`** on major client data shells; **`ConfirmDialog`** titles/variants; global **`N`** shortcut to open “new” dialogs where applicable; **`?create=1`** deep links for several create flows.

**Where to read more:** [`WEB-APP-UI-POLISH.md`](./WEB-APP-UI-POLISH.md).

---

## Changelog (this summary file)

| Date | Note |
|------|------|
| 2026-04-20 | Initial **phase-by-phase shipped** summary; links to Phase 0–3 + polish docs. |

---

*When you ship a new phase milestone, add a section or extend the tables above, then add one line to the **Changelog** in [`00-CORE-ZIMS-PROGRAM.md`](./00-CORE-ZIMS-PROGRAM.md).*
