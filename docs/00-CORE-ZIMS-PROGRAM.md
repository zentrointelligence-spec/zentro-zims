# Zentro ZIMS — Core program document (living)

This file is the **single source of truth for the whole product cycle**: what ZIMS is, how the pieces fit, where to find detail by phase, and a **running log of meaningful changes**. When you ship a feature, fix a bug, or change architecture, add a row under **Changelog** and, if needed, update the relevant **Phase** doc.

---

## 1. What ZIMS is

**Zentro Insurance Management System (ZIMS)** is a multi-tenant SaaS for insurance agencies: leads, customers, policies, renewals, tasks, interactions, optional WhatsApp (Twilio), and an AI assistant (OpenAI). Agencies are isolated by `agency_id` on every domain table.

| Surface | Location | Role |
|--------|----------|------|
| **API** | `app/` | Authoritative data, auth, jobs, integrations |
| **Web** | `web/` | Marketing site, auth UX, authenticated app (Next.js) |

There is **no** Streamlit dashboard in this repo anymore; internal tools use the API and/or the Next.js app.

---

## 2. Repository map

```
Zentro-ZIMS/
├── app/                 # FastAPI backend (see PHASE-0 doc)
├── web/                 # Next.js 16 frontend (see PHASE-1 doc)
├── docs/                # This documentation set
│   ├── 00-CORE-ZIMS-PROGRAM.md      ← you are here (living core)
│   ├── PHASE-0-BACKEND-PLATFORM.md
│   ├── PHASE-1-NEXTJS-WEB.md
│   ├── PHASE-2-ROADMAP.md
│   ├── PHASE-3-MARKETING-WEB.md
│   ├── PHASES-SHIPPED-SUMMARY.md
│   └── WEB-APP-UI-POLISH.md
├── requirements.txt     # Python dependencies
├── .env / .env.example  # Backend env
├── README.md            # Quick start + endpoints summary
└── zims.db              # Optional local SQLite (dev)
```

---

## 3. End-to-end architecture (conceptual)

```text
Browser ──► Next.js (web/)  :3000
              │
              ├── Route handlers /api/auth/*  → set httpOnly JWT cookie
              ├── Server Components + Server Actions → lib/api.ts
              │
              └── fetch ──► FastAPI (app/)  :8000  /api/v1/*
                        └── PostgreSQL or SQLite
```

- **JWT** is issued by FastAPI and stored in an **httpOnly** session cookie by Next.js route handlers.
- **Next.js** never exposes the raw JWT to browser JS for API calls; server-side code attaches `Authorization: Bearer …` when calling FastAPI.

---

## 4. Phase documents (read in order)

| Phase | Document | Status |
|-------|----------|--------|
| 0 | [PHASE-0-BACKEND-PLATFORM.md](./PHASE-0-BACKEND-PLATFORM.md) | **Done** — backend platform |
| 1 | [PHASE-1-NEXTJS-WEB.md](./PHASE-1-NEXTJS-WEB.md) | **Done** (MVP slice); polish ongoing |
| 2 | [PHASE-2-ROADMAP.md](./PHASE-2-ROADMAP.md) | **In progress** — CRM UI, quotes, agency settings shipped; billing/AI/mobile TBD |
| 3 | [PHASE-3-MARKETING-WEB.md](./PHASE-3-MARKETING-WEB.md) | **Shipped (v1)** — public marketing + blog + pricing (`web/app/(marketing)/`) |
| — | [PHASES-SHIPPED-SUMMARY.md](./PHASES-SHIPPED-SUMMARY.md) | **Index** — narrative of what shipped in each phase + link to polish doc |

---

## 5. How to run everything (minimal)

**Terminal A — backend**

```bash
cd /path/to/Zentro-ZIMS
source .venv/bin/activate   # if you use a venv
pip install -r requirements.txt
cp .env.example .env        # first time
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

**Terminal B — frontend**

```bash
cd web
cp .env.example .env.local  # first time; set ZIMS_API_URL=http://127.0.0.1:8000
npm install
npm run dev
```

- **No default login.** Register at `http://localhost:3000/register` (or call `POST /api/v1/auth/register`).
- If Next logs **`fetch failed`** on server renders, ensure uvicorn is up and `ZIMS_API_URL` uses **`127.0.0.1`**, not `localhost`, for IPv4 alignment with Node’s `fetch`.

---

## 6. Conventions for keeping this document useful

1. **After any merge-worthy change**, append one line to **Changelog** (date + one sentence + optional paths).
2. If the change belongs mainly to one layer, add a short subsection or bullet to that **Phase** file too.
3. Keep **README.md** (root) as a short index; deep narrative lives here + phase docs.
4. **Do not** duplicate huge API tables in three places — root `README.md` can keep the endpoint table; phase docs link here or to OpenAPI `/docs`.

---

## 7. Changelog (append new entries at the top)

| Date | Change |
|------|--------|
| 2026-04-20 | **Docs:** Added `docs/PHASES-SHIPPED-SUMMARY.md` — phase-by-phase “what we shipped” (0→1→2→3 + polish); indexed from `docs/README.md` + table in this file. |
| 2026-04-20 | **Docs:** Added `docs/WEB-APP-UI-POLISH.md` (authenticated app UX polish); linked from `docs/README.md`, `PHASE-1-NEXTJS-WEB.md`, `web/README.md`, and repo map in this file. |
| 2026-04-21 | **Docs:** Added `docs/PHASE-3-MARKETING-WEB.md`; updated roadmap, `web/README.md`, `docs/README.md`, and core map for Phase 3 marketing. |
| 2026-04-21 | **Web (Phase 3):** Public marketing site — `(marketing)/` layout + `/`, `/pricing`, `/blog`, `/blog/[slug]`; `components/marketing/*`, static `lib/blog-posts.ts`; no FastAPI fetch; static/SSG prerender. |
| 2026-04-20 | **Docs:** Synced root `README.md`, `web/README.md`, `docs/PHASE-2-ROADMAP.md`, and this changelog with shipped Phase 2B web work (quotes, settings, routes). |
| 2026-04-20 | **Web (Phase 2B):** `/settings` — admin-only page (`zentro_user` role gate); three independent RHF sections (profile, renewal window + template, timezone + birthday template); server actions + `revalidatePath("/settings")`; `getAgencySettings` / `updateAgencySettings` in `web/lib/api.ts`; schemas in `web/lib/schemas.ts`. |
| 2026-04-20 | **Web (Phase 2B):** `/quotes` — list/filter/paginate, create/edit, status actions, accept→creates policy (`revalidatePath` quotes + policies), delete; server page + `actions.ts` + components; quote schemas/API helpers; `StatusChip` supports `kind="quote"`; `/quotes` on `proxy.ts` protected list and sidebar nav. |
| 2026-04-18 | **Docs:** Added `docs/` with core + phase documents; clarified maintenance rules. |
| 2026-04-18 | **Web:** Server `fetch` hardening — `localhost`/`::1` normalized to `127.0.0.1` in `web/lib/env.ts`; `apiFetch` wraps network errors as `ApiError(503, …)` in `web/lib/api.ts`. |
| 2026-04-18 | **Web:** Replaced `next-themes` with `@wrksz/themes/next` in root layout (React 19–safe script injection via `useServerInsertedHTML`). |
| 2026-04-18 | **Web:** Neutral mesh/grid backgrounds, semantic tokens, light/dark mode, `ThemeToggle`; sidebar uses `--sidebar-*` tokens; marketing/auth layouts updated. |
| 2026-04-18 | **Web:** Base UI fixes — `DropdownMenuLabel` wrapped in `Menu.Group`; `nativeButton={false}` for `Button`+`Link`; `ThemeToggle` hydration via `useSyncExternalStore`. |
| 2026-04-18 | **Repo:** Removed `dashboard/` (Streamlit) and `client-ui/` (legacy Streamlit); `requirements.txt` no longer lists Streamlit; pandas kept for Excel import. |
| 2026-04-18 | **Web:** Phase 1 Next.js app — route groups, cookie auth, Policies vertical slice, Excel import UI, `proxy.ts` gating. |
| 2026-04-18 | **Backend:** Excel bulk import `POST /policies/import`, import service + parser, dashboard client removed (superseded by web). |
| *Earlier* | **Backend:** Initial FastAPI multi-tenant platform (auth, CRUD, renewals, Twilio, OpenAI, validation fixes, DELETE 204 bodies, tests). |

---

## 8. Security & operations notes (non-exhaustive)

- Rotate `SECRET_KEY` and JWT settings for production; never commit real `.env`.
- **CORS** is not the same as cookie auth to Next — server-side `fetch` from Next to FastAPI uses server env, not the browser.
- For **Vercel + separate API**, set `ZIMS_API_URL` to the public API origin and ensure FastAPI allows the Next origin if you add browser-direct calls later.

---

*Last updated: 2026-04-20. Update this file whenever the program meaningfully changes.*
