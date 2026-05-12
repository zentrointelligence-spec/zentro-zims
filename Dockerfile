# =============================================================================
# Zentro-ZIMS — Multi-stage Dockerfile
# =============================================================================
# Targets:
#   development  — uvicorn reload for local dev inside Docker
#   production   — gunicorn + uvicorn workers for production
#
# Build:
#   docker build --target production -t zims-api .
#   docker build --target development -t zims-api:dev .
# =============================================================================

FROM python:3.12-slim-bookworm AS base

# Security: run as non-root
RUN groupadd -r zims && useradd -r -g zims zims

# System dependencies for psycopg2, pandas, openpyxl
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies first (layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY alembic.ini .
COPY alembic/ ./alembic/
COPY app/ ./app/
COPY scripts/ ./scripts/

# Create upload directory with correct permissions
RUN mkdir -p /app/var/uploads && chown -R zims:zims /app

# Switch to non-root user
USER zims

# Cloud Run sets PORT env var (default 8080)
ENV PORT=8080
EXPOSE 8080

# ---------------------------------------------------------------------------
# Development target — auto-reload via uvicorn
# ---------------------------------------------------------------------------
FROM base AS development
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UVICORN_RELOAD=true
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --reload"]

# ---------------------------------------------------------------------------
# Production target — gunicorn + uvicorn workers
# ---------------------------------------------------------------------------
FROM base AS production
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UVICORN_RELOAD=false

# Install gunicorn for production WSGI/ASGI serving
RUN pip install --no-cache-dir gunicorn==23.0.0

# Gunicorn config:
#   -w 2          → 2 worker processes (scale via K8s/Docker replicas)
#   -k uvicorn.workers.UvicornWorker → ASGI worker class
#   --access-logfile - → stdout
#   --error-logfile -  → stderr
#   --capture-output   → capture print() output
# Port is read from $PORT env var (Cloud Run sets this to 8080)
CMD ["sh", "-c", "gunicorn -w 2 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:${PORT:-8080} --access-logfile - --error-logfile - --capture-output --enable-stdio-inheritance app.main:app"]
