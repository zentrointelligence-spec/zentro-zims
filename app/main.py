"""FastAPI application entrypoint.

Run with::

    uvicorn app.main:app --reload

Or in Docker (production)::

    gunicorn -w 2 -k uvicorn.workers.UvicornWorker app.main:app

Architecture:
- Lifespan runs Alembic migrations + scheduler startup/shutdown.
- Middleware stack (outer → inner):
  1. CORS
  2. AuditContextMiddleware — captures client IP / UA
  3. TenantMiddleware — injects agency_id from JWT, request logging
- Health check validates both PostgreSQL and Redis connectivity.
- Global exception handlers prevent raw SQLAlchemy errors from leaking.
"""
from __future__ import annotations

import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app import __version__
from app.core.config import settings
from app.core.database import engine, init_db, run_alembic_upgrade_head
from app.core.logging import configure_logging, get_logger
from app.middleware.audit import AuditContextMiddleware
from app.middleware.tenant import TenantMiddleware
from app.routes import api_router
from app.routes import billing
from app.services.scheduler import shutdown_scheduler, start_scheduler

configure_logging()
logger = get_logger(__name__)

# =============================================================================
# Optional Redis client (lazy import — graceful degradation if Redis is down)
# =============================================================================
_redis_client = None


def _get_redis_client():  # pragma: no cover
    """Lazy singleton for Redis client.

    Returns None if redis-py is not installed or connection fails.
    This keeps the app bootable even when Redis is temporarily unavailable.
    """
    global _redis_client
    if _redis_client is not None:
        return _redis_client
    try:
        import redis

        _redis_client = redis.from_url(
            settings.redis_url, decode_responses=True
        )
        _redis_client.ping()
        logger.info("Redis connection established: %s", settings.redis_url)
        return _redis_client
    except Exception as exc:
        logger.warning("Redis unavailable: %s", exc)
        return None


# =============================================================================
# Lifespan — startup / shutdown hooks
# =============================================================================
@asynccontextmanager
async def lifespan(_app: FastAPI):
    logger.info(
        "Starting %s v%s (%s) database=%s redis=%s",
        settings.app_name,
        __version__,
        settings.app_env,
        "sqlite" if settings.is_sqlite else "postgresql",
        settings.redis_url,
    )

    # --- Database setup (non-fatal — health check will report actual status) ---
    try:
        run_alembic_upgrade_head()
    except Exception as exc:
        logger.error("Alembic migration failed (app will still start): %s", exc)

    try:
        init_db()
    except Exception as exc:
        logger.error("init_db failed (app will still start): %s", exc)

    # --- Scheduler (non-fatal) ---
    try:
        start_scheduler()
    except Exception as exc:
        logger.error("Scheduler startup failed (app will still start): %s", exc)

    # --- Redis (non-fatal — already graceful) ---
    _get_redis_client()  # warm the connection

    try:
        yield
    finally:
        try:
            shutdown_scheduler()
        except Exception as exc:
            logger.warning("Scheduler shutdown error: %s", exc)
        if _redis_client is not None:
            try:
                _redis_client.close()
            except Exception:
                pass
        logger.info("Shutdown complete.")


# =============================================================================
# FastAPI App Factory
# =============================================================================
app = FastAPI(
    title=settings.app_name,
    version=__version__,
    description="Multi-tenant SaaS backend for insurance agencies.",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# ---------------------------------------------------------------------------
# Middleware stack (order matters — first added = outermost)
# ---------------------------------------------------------------------------
_wildcard_cors = settings.cors_origins == ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=not _wildcard_cors,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(AuditContextMiddleware)
app.add_middleware(TenantMiddleware)


# =============================================================================
# Exception Handlers
# =============================================================================
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    _request: Request, exc: RequestValidationError
) -> JSONResponse:
    """Return structured 422 errors.

    ``jsonable_encoder`` safely serialises ctx payloads (e.g. raw ValueError
    objects coming from Pydantic model_validators) that ``json.dumps`` can't.
    """
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": jsonable_encoder(exc.errors())},
    )


@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(
    _request: Request, exc: SQLAlchemyError
) -> JSONResponse:
    """Catch-all database error handler — prevents raw SQL from leaking."""
    logger.exception("Database error: %s", exc)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Database error"},
    )


# =============================================================================
# Meta Endpoints
# =============================================================================
@app.get("/", tags=["meta"], summary="Service root")
def root() -> dict:
    """Return service identity."""
    return {
        "service": settings.app_name,
        "version": __version__,
        "env": settings.app_env,
        "docs": "/docs",
    }


@app.get("/health", tags=["meta"], summary="Liveness + dependency health check")
def health() -> JSONResponse:
    """Comprehensive health check for load balancers and monitoring.

    Checks:
    1. Database connectivity (SELECT 1)
    2. Redis connectivity (PING) — optional; failure does not degrade status
    3. Response time

    Returns:
        200 OK — all critical dependencies healthy
        503 Service Unavailable — database or other critical dependency down
    """
    start = time.perf_counter()
    checks = {"database": "ok", "redis": "ok"}
    status_code = 200

    # --- Database check ---
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as exc:  # pragma: no cover
        logger.exception("Health check DB failure: %s", exc)
        checks["database"] = "error"
        status_code = 503

    # --- Redis check (best-effort) ---
    try:
        r = _get_redis_client()
        if r is not None:
            r.ping()
        else:
            checks["redis"] = "not_configured"
    except Exception as exc:  # pragma: no cover
        logger.warning("Health check Redis failure: %s", exc)
        checks["redis"] = "error"
        # Redis is not critical for Phase 1 — don't flip status to 503

    elapsed_ms = round((time.perf_counter() - start) * 1000, 2)

    payload = {
        "status": "ok" if status_code == 200 else "degraded",
        "service": settings.app_name,
        "version": __version__,
        "env": settings.app_env,
        "checks": checks,
        "response_time_ms": elapsed_ms,
    }
    return JSONResponse(content=payload, status_code=status_code)


# =============================================================================
# API Routers
# =============================================================================
# API v1 — includes auth, CRM, quotes, dependents, agency settings, documents,
# analytics, WhatsApp broadcasts, AI content, audit logs, policies, tasks,
# interactions, webhooks (see app.routes.api_router), and billing (Stripe).
app.include_router(api_router, prefix=settings.api_v1_prefix)
app.include_router(billing.router, prefix=settings.api_v1_prefix)
