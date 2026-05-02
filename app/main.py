"""FastAPI application entrypoint.

Run with:
    uvicorn app.main:app --reload
"""
from __future__ import annotations

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
from app.routes import api_router
from app.routes import billing
from app.services.scheduler import shutdown_scheduler, start_scheduler

configure_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(_app: FastAPI):
    logger.info("Starting %s v%s (%s)", settings.app_name, __version__, settings.app_env)
    run_alembic_upgrade_head()
    init_db()
    start_scheduler()
    try:
        yield
    finally:
        shutdown_scheduler()
        logger.info("Shutdown complete.")


app = FastAPI(
    title=settings.app_name,
    version=__version__,
    description="Multi-tenant SaaS backend for insurance agencies.",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

_wildcard_cors = settings.cors_origins == ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    # Credentials (cookies) require explicit origins; wildcards are rejected by browsers.
    allow_credentials=not _wildcard_cors,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    _request: Request, exc: RequestValidationError
) -> JSONResponse:
    # jsonable_encoder safely serializes ctx payloads (e.g. raw ValueError
    # objects coming from Pydantic model_validators) that json.dumps can't.
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": jsonable_encoder(exc.errors())},
    )


@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(
    _request: Request, exc: SQLAlchemyError
) -> JSONResponse:
    logger.exception("Database error: %s", exc)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Database error"},
    )


@app.get("/", tags=["meta"], summary="Service root")
def root() -> dict:
    return {
        "service": settings.app_name,
        "version": __version__,
        "env": settings.app_env,
        "docs": "/docs",
    }


@app.get("/health", tags=["meta"], summary="Liveness + DB health check")
def health() -> JSONResponse:
    db_ok = True
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as exc:  # pragma: no cover
        logger.exception("Health check DB failure: %s", exc)
        db_ok = False

    payload = {
        "status": "ok" if db_ok else "degraded",
        "service": settings.app_name,
        "version": __version__,
        "database": "ok" if db_ok else "error",
    }
    return JSONResponse(content=payload, status_code=200 if db_ok else 503)


# API v1 — includes auth, CRM, quotes, dependents, agency settings, documents,
# analytics, WhatsApp broadcasts, AI content, audit logs, policies, tasks,
# interactions, webhooks (see app.routes.api_router), and billing (Stripe).
app.include_router(api_router, prefix=settings.api_v1_prefix)
app.include_router(billing.router, prefix=settings.api_v1_prefix)
