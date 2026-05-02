# Phase 2 — Roadmap (planned + shipped)

**Status:** **In progress** — core CRM + quotes + agency settings UI shipped in the Next.js app; remaining items below are still planned.  
**Depends on:** Phase 0 (API) + Phase 1 (shell + Policies) remaining stable.

**UX polish reference:** Authenticated CRM/shell polish (skeletons, empty states, toasts, shortcuts) is documented in [`WEB-APP-UI-POLISH.md`](./WEB-APP-UI-POLISH.md).

---

## 1. Intended scope (high level)

These areas already have **FastAPI endpoints**; Phase 2 is primarily **Next.js UI** and polish.

| Area | Outcome | Web status (2026-04) |
|------|---------|----------------------|
| **Leads** | Full list/detail, filters, status pipeline (consider Kanban later) | **Shipped** — list, filters, server actions (`/leads`) |
| **Customers** | Profiles, linked policies, quick actions | **Shipped** — list + profile route (`/customers`, `/customers/[id]`) |
| **Tasks** | Work queue, filters, complete/snooze | **Partial** — `/tasks` shows `ComingSoon` placeholder; full queue UI TBD |
| **Interactions** | Timeline, WhatsApp-oriented UX (where Twilio is enabled) | **Shipped** — timeline page + actions (`/interactions`) |
| **Team** | Invite users, roles, admin-only surfaces | **Shipped** — admin-gated team page + actions (`/team`) |
| **Quotes** | Pre-policy offers, accept → policy | **Shipped** — full module (`/quotes`) |
| **Agency settings** | Tenant branding, renewal copy, timezone, templates | **Shipped** — admin-only `/settings` (PATCH `/agency/settings`) |
| **AI assistant** | Chat or command surface wired to existing backend assistant | Planned |
| **Billing** | Stripe (or similar) per-seat — align with marketing tiers | Planned |
| **SEO / marketing** | Blog, legal pages, richer pricing as needed | **Shipped (v1)** — landing, `/pricing`, `/blog` + posts ([`PHASE-3-MARKETING-WEB.md`](./PHASE-3-MARKETING-WEB.md)); legal links mailto placeholders |
| **Mobile** | Responsive shell refinements, optional bottom nav | Partial (responsive layouts); dedicated mobile nav TBD |

---

## 2. Deployment targets (reminder)

- **Marketing:** `zentro.io` (or apex domain of choice)
- **App:** `app.zentro.io`
- **API:** separate host (e.g. `api.zentro.io`) — configure `ZIMS_API_URL` on Vercel accordingly

---

## 3. Phase 2 changelog

| Date | Note |
|------|------|
| 2026-04-20 | **Docs:** `PHASES-SHIPPED-SUMMARY.md` — narrative of shipped work phase-by-phase (0→1→2→3 + polish). |
| 2026-04-20 | **Docs:** `WEB-APP-UI-POLISH.md` — catalog of app-shell UX patterns for shipped CRM pages. |
| 2026-04-20 | **Roadmap table:** `/tasks` status set to **Partial** (`ComingSoon` in app). |
| 2026-04-21 | **Marketing (Phase 3):** Public site + blog + pricing pages; doc `PHASE-3-MARKETING-WEB.md`. |
| 2026-04-20 | **Quotes:** Next.js `/quotes` — table, filters, CRUD, accept flow, `lib/api` + `lib/schemas`; `StatusChip` quote variant. |
| 2026-04-20 | **Settings:** Next.js `/settings` — admin gate, three save sections, agency settings API wiring. |
| 2026-04-20 | **Docs:** Roadmap + core changelog updated to reflect shipped routes and remaining Phase 2 scope. |

---

*For program-wide history, see the **Changelog** in [`00-CORE-ZIMS-PROGRAM.md`](./00-CORE-ZIMS-PROGRAM.md). Link PRs or commits in this table as you ship.*
