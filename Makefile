# =============================================================================
# Zentro-ZIMS — Development Makefile
# =============================================================================
# Provides consistent commands across macOS, Linux, and Docker environments.
#
# Quickstart:
#   make install          # Install Python deps
#   make dev              # Start backend + frontend (local)
#   make docker-up        # Start full Docker stack
#   make test             # Run test suite
#   make migrate          # Run Alembic migrations
# =============================================================================

.PHONY: help install dev docker-up docker-down docker-logs migrate migrate-auto \
        test test-cov lint format clean reset-db seed

# Default target
help:
	@echo "Zentro-ZIMS — Available commands:"
	@echo ""
	@echo "  make install        Install Python dependencies"
	@echo "  make dev            Start backend on :8000 (local uvicorn)"
	@echo "  make docker-up      Start full Docker stack (PostgreSQL + Redis + API + Nginx)"
	@echo "  make docker-down    Stop Docker stack"
	@echo "  make docker-logs    Tail API logs from Docker"
	@echo "  make migrate        Run pending Alembic migrations"
	@echo "  make migrate-auto   Autogenerate new migration (requires MESSAGE=...)"
	@echo "  make test           Run pytest"
	@echo "  make test-cov       Run pytest with coverage report"
	@echo "  make lint           Run ruff linter"
	@echo "  make format         Run ruff formatter"
	@echo "  make clean          Remove pycache, build artifacts"
	@echo "  make reset-db       Reset local SQLite DB (dev only — destroys data!)"
	@echo ""

# ---------------------------------------------------------------------------
# Local development
# ---------------------------------------------------------------------------
install:
	python -m pip install --upgrade pip
	pip install -r requirements.txt

dev:
	@echo "Starting ZIMS backend on http://localhost:8000"
	python -m uvicorn app.main:app --reload --port 8000

# ---------------------------------------------------------------------------
# Docker Compose
# ---------------------------------------------------------------------------
docker-up:
	docker compose up --build -d

docker-down:
	docker compose down

docker-logs:
	docker compose logs -f api

docker-shell:
	docker compose exec api bash

# ---------------------------------------------------------------------------
# Database migrations
# ---------------------------------------------------------------------------
migrate:
	alembic upgrade head

migrate-auto:
	@if [ -z "$(MESSAGE)" ]; then \
		echo "Usage: make migrate-auto MESSAGE='add users table'"; \
		exit 1; \
	fi
	alembic revision --autogenerate -m "$(MESSAGE)"

migrate-down:
	alembic downgrade -1

# ---------------------------------------------------------------------------
# Testing
# ---------------------------------------------------------------------------
test:
	pytest -xvs

test-cov:
	pytest --cov=app --cov-report=term-missing --cov-report=html

# ---------------------------------------------------------------------------
# Code quality
# ---------------------------------------------------------------------------
lint:
	ruff check app

format:
	ruff format app

# ---------------------------------------------------------------------------
# Maintenance
# ---------------------------------------------------------------------------
clean:
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	find . -type d -name .pytest_cache -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .ruff_cache -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name htmlcov -exec rm -rf {} + 2>/dev/null || true

reset-db:
	@echo "⚠️  This will delete zims.db and re-create tables."
	@read -p "Are you sure? [y/N] " confirm && [ "$$confirm" = "y" ] || exit 1
	rm -f zims.db
	python -c "from app.core.database import init_db; init_db()"
	@echo "✅ Database reset"
