# Phase 0 — Backend platform (FastAPI)

**Status:** Complete (ongoing small fixes as needed).  
**Code:** Repository root — directory `app/`.

---

## 1. Goals delivered

- **Multi-tenant SaaS** — every business table carries `agency_id`; all queries scoped by authenticated user’s agency.
- **Auth** — JWT access tokens, bcrypt passwords, roles (`admin`, `agent`), register agency + admin.
- **Domain model** — Agency, User, Lead, Customer, Policy, Task, Interaction (and related enums/statuses).
- **REST API** under prefix **`/api/v1`** (see root `README.md` for the endpoint table).
- **Renewal automation** — APScheduler daily job: flag `renewal_due` / `expired`, create renewal tasks idempotently.
- **Integrations** — Twilio WhatsApp (stub or live), OpenAI assistant with safe fallback.
- **Excel import** — `POST /policies/import` multipart `.xlsx`, dry-run, per-row errors, nested transactions/savepoints.
- **Quality** — Pydantic v2 schemas, custom error handling (including JSON-serializable validation errors), pagination helpers, health check `GET /health`.

---

## 2. Stack

| Concern | Technology |
|---------|------------|
| Framework | FastAPI |
| ORM | SQLAlchemy 2.x |
| DB | PostgreSQL (recommended) or SQLite (`DATABASE_URL`) |
| Validation | Pydantic v2 / pydantic-settings |
| Auth | python-jose (JWT), passlib/bcrypt |
| Jobs | APScheduler |
| Excel | openpyxl + **pandas** (used by `app/utils/excel_parser.py`) |
| HTTP client (tests/tools) | httpx |

---

## 3. Important files (orientation)

```
app/
├── main.py              # App factory, routers, lifespan (DB init, scheduler)
├── core/                # config, database session, security, dependencies
├── models/              # SQLAlchemy models
├── schemas/             # Pydantic request/response (+ import_schema)
├── routes/              # auth, users, leads, customers, policies, tasks, …
├── services/            # renewal engine, import_service
├── ai/                  # OpenAI assistant
├── integrations/      # Twilio
└── utils/               # excel_parser, pagination, …
```

---

## 4. Environment (backend)

Copy `.env.example` → `.env`. Notable variables:

- `DATABASE_URL` — Postgres DSN or `sqlite:///./zims.db`
- `SECRET_KEY`, `ACCESS_TOKEN_EXPIRE_MINUTES`
- `OPENAI_*`, `TWILIO_*` (optional for stubs)
- `RENEWAL_*` scheduler windows
- `MAX_IMPORT_FILE_SIZE_MB` — Excel upload cap

---

## 5. Run & verify

```bash
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Open **http://127.0.0.1:8000/docs** for interactive API documentation.

---

## 6. Explicit non-goals for Phase 0

- No first-party web UI in this phase (handled in Phase 1 Next.js).
- ~~Streamlit admin~~ — **removed** from the repo to avoid duplicate UX; Excel import and admin flows live in API + Next.js.

---

## 7. Phase 0 changelog (subset; mirror major entries in `00-CORE-ZIMS-PROGRAM.md`)

| Date | Note |
|------|------|
| 2026-04-18 | Excel import pipeline, `ImportResult` schema, row-level rollback strategy. |
| *Earlier* | DELETE endpoints return empty body with 204; validation error handler uses `jsonable_encoder`; HTTP tests use `TestClient` context manager for lifespan/DB. |

---

*Update this file when backend behavior, env vars, or integrations change materially. For how Phase 0 fits into everything shipped so far (with later web phases), see [`PHASES-SHIPPED-SUMMARY.md`](./PHASES-SHIPPED-SUMMARY.md).*
