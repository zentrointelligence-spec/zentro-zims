# Zentro Insurance Management System (ZIMS)

A production-grade, multi-tenant SaaS for insurance agencies.

**Full program documentation (living + per-phase):** phase-by-phase shipped work [`docs/PHASES-SHIPPED-SUMMARY.md`](docs/PHASES-SHIPPED-SUMMARY.md); living core [`docs/00-CORE-ZIMS-PROGRAM.md`](docs/00-CORE-ZIMS-PROGRAM.md); index [`docs/README.md`](docs/README.md); public marketing [`docs/PHASE-3-MARKETING-WEB.md`](docs/PHASE-3-MARKETING-WEB.md); app UX polish [`docs/WEB-APP-UI-POLISH.md`](docs/WEB-APP-UI-POLISH.md).

| Surface | Path | Stack |
|---|---|---|
| **Backend API** | `app/` | FastAPI · SQLAlchemy · Pydantic · JWT · APScheduler |
| **Web app** | `web/` | Next.js 16 · shadcn/ui · Tailwind v4 · TanStack Query · public marketing at `/`, `/pricing`, `/blog` |

## Features

- Multi-tenant architecture (strict `agency_id` isolation on every table)
- JWT authentication + role-based access (`admin`, `agent`)
- Leads → Customers → Policies pipeline
- **Quotes** (pre-policy offers) with accept → auto-create policy (API + Next.js `/quotes`)
- **Agency settings** per tenant (branding, renewal copy, timezone, message templates — API + Next.js `/settings`, admin-only)
- Automated renewal detection (APScheduler runs daily)
- Bulk Excel import for customers + policies (with dry-run)
- WhatsApp integration (Twilio) with incoming webhook
- AI sales-assistant powered by OpenAI
- Pagination, logging, validation, dependency injection
- Health check at `/health`

## Project Structure

```
app/                        # FastAPI backend (API on :8000)
├── main.py                 # FastAPI app + startup/shutdown
├── core/                   # config, database, security, DI, logging
├── models/                 # SQLAlchemy ORM models
├── schemas/                # Pydantic request/response schemas
├── routes/                 # FastAPI routers (auth, leads, ...)
├── services/               # Renewal engine + APScheduler
├── ai/                     # OpenAI assistant
├── integrations/           # Twilio WhatsApp
└── utils/                  # Excel parser, pagination helpers

web/                        # Next.js 16 frontend (dev on :3000)
├── app/                    # App Router — (marketing), (auth), (app)
├── components/             # shadcn UI + Zentro-specific widgets
├── lib/                    # api client, schemas, auth helpers
└── proxy.ts                # edge-gated session cookie check
```

## Setup

### 1. Install Python deps

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 2. Configure environment

```bash
cp .env.example .env
# edit .env with your DATABASE_URL, SECRET_KEY, API keys, etc.
```

### 3. Run the backend API

```bash
python -m uvicorn app.main:app --reload --port 8000
```

- API docs: http://localhost:8000/docs
- Health: http://localhost:8000/health

> Tables are auto-created on first start. The renewal scheduler starts automatically.

### 4. Run the Next.js frontend

In a second terminal, install dependencies **inside `web/`** (required once):

```bash
cd web
cp .env.example .env.local   # first time only
npm install                  # first time only
npm run dev                  # http://localhost:3000
```

From the **repo root** you can start the same dev server after `web/node_modules` exists:

```bash
npm run dev                  # or: npm run dev:web — same as cd web && npm run dev
```

If the browser tab never finishes loading, see [`web/README.md`](web/README.md) (stuck dev server, try `npm run dev:web:webpack`).

See [`web/README.md`](web/README.md) for the frontend architecture and the
roadmap of what's in Phase 1 vs. Phase 2.

## Quickstart: Register + Use

```bash
# 1. Register agency + admin
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "agency_name": "Acme Insurance",
    "subscription_plan": "starter",
    "admin_name": "Alice",
    "admin_email": "alice@acme.com",
    "admin_password": "Secret123!"
  }'

# 2. Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@acme.com","password":"Secret123!"}'

# 3. Use the returned access_token in Authorization: Bearer <token>
```

## Key Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | Register agency + admin user |
| POST | `/api/v1/auth/login` | Login, returns JWT |
| GET  | `/api/v1/users/me` | Current user |
| POST | `/api/v1/users` | Create agent (admin only) |
| POST/GET | `/api/v1/leads` | Lead CRUD |
| POST | `/api/v1/leads/{id}/convert` | Lead → customer |
| POST/GET | `/api/v1/customers` | Customers |
| POST/GET | `/api/v1/policies` | Policies |
| GET/PATCH | `/api/v1/agency/settings` | Agency settings (GET any authenticated user; **PATCH admin only**) |
| GET/POST/PATCH/DELETE | `/api/v1/quotes` | Quotes list + CRUD; `POST /quotes/{id}/accept` creates policy |
| POST | `/api/v1/policies/import` | Bulk-import customers + policies from `.xlsx` (supports `?dry_run=true`) |
| POST | `/api/v1/policies/renewals/run` | Manually trigger renewal engine (admin only) |
| GET  | `/api/v1/tasks` | Tasks (renewals/followups) |
| POST | `/api/v1/interactions` | Log interaction |
| POST | `/api/v1/webhooks/whatsapp` | Twilio incoming webhook |
| GET  | `/health` | Health check |

## Multi-Tenancy Model

Every domain row stores `agency_id`. All service queries are filtered by the
current user's `agency_id` via dependency injection — no cross-tenant leakage
is possible through the API surface.

## Renewal Automation

APScheduler runs daily at `RENEWAL_JOB_HOUR:RENEWAL_JOB_MINUTE` (default 02:00):

1. Flags policies expiring within `RENEWAL_WINDOW_DAYS` (default 30) as `renewal_due`
2. Flags already-expired policies as `expired`
3. Creates a `renewal` task per flagged policy (idempotent)

## Excel Import

`POST /api/v1/policies/import` accepts a multipart upload (`file=<your.xlsx>`)
and imports customers + policies in bulk. Headers are matched case-insensitively
with common aliases (e.g. `Policy #`, `Customer Name`, `Expiry`, `Amount`).

- **Required columns:** `customer_name`, `policy_number`, `expiry_date`
- **Optional columns:** `policy_type`, `start_date`, `premium`, `phone`, `email`
- **Size limit:** `MAX_IMPORT_FILE_SIZE_MB` (default 5 MB)
- **Query flag:** `?dry_run=true` simulates the full pipeline and rolls back — nothing is persisted.
- Per-row errors are reported in the response; a single bad row never aborts the whole upload.
- Policies whose expiry falls within the renewal window are auto-flagged as `renewal_due` and get a renewal Task created — idempotent across re-imports.

The Next.js frontend surfaces this as the **Import Excel** dialog on the
Policies page, with a drop-zone, dry-run toggle, and a results view that lists
row-level errors inline.
