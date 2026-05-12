#!/usr/bin/env bash
# =============================================================================
# Zentro-ZIMS — Local Development Setup Script
# =============================================================================
# This script bootstraps a fresh clone for local development.
#
# Usage:
#   ./scripts/setup.sh
#
# What it does:
#   1. Checks Python 3.12+
#   2. Creates virtual environment
#   3. Installs dependencies
#   4. Creates .env from .env.example
#   5. Runs Alembic migrations (or creates SQLite tables)
#   6. Verifies the setup by hitting /health
# =============================================================================

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "🚀 Zentro-ZIMS Development Setup"
echo "================================="

# ---------------------------------------------------------------------------
# 1. Python version check
# ---------------------------------------------------------------------------
PYTHON_VERSION=$(python3 --version 2>/dev/null | awk '{print $2}' || echo "")
if [[ -z "$PYTHON_VERSION" ]]; then
    echo "❌ Python 3 is not installed. Please install Python 3.12+."
    exit 1
fi

MAJOR=$(echo "$PYTHON_VERSION" | cut -d. -f1)
MINOR=$(echo "$PYTHON_VERSION" | cut -d. -f2)
if [[ "$MAJOR" -lt 3 || ("$MAJOR" -eq 3 && "$MINOR" -lt 12) ]]; then
    echo "❌ Python $PYTHON_VERSION detected. Python 3.12+ is required."
    exit 1
fi

echo "✅ Python $PYTHON_VERSION"

# ---------------------------------------------------------------------------
# 2. Virtual environment
# ---------------------------------------------------------------------------
if [[ ! -d ".venv" ]]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv .venv
fi

source .venv/bin/activate

# ---------------------------------------------------------------------------
# 3. Install dependencies
# ---------------------------------------------------------------------------
echo "📦 Installing dependencies..."
pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt

# ---------------------------------------------------------------------------
# 4. Environment file
# ---------------------------------------------------------------------------
if [[ ! -f ".env" ]]; then
    echo "📝 Creating .env from .env.example..."
    cp .env.example .env
    echo ""
    echo "⚠️  Please edit .env and set a strong SECRET_KEY:"
    echo "   openssl rand -hex 32"
    echo ""
fi

# ---------------------------------------------------------------------------
# 5. Database setup
# ---------------------------------------------------------------------------
source .venv/bin/activate

# Reload settings after .env creation
DATABASE_URL=$(python3 -c "from app.core.config import settings; print(settings.database_url)" 2>/dev/null || echo "")

if [[ "$DATABASE_URL" == sqlite* ]]; then
    echo "🗄️  SQLite detected — creating tables..."
    python3 -c "from app.core.database import init_db; init_db()"
else
    echo "🗄️  PostgreSQL detected — running Alembic migrations..."
    alembic upgrade head || {
        echo "⚠️  Migration failed. Is PostgreSQL running?"
        echo "   docker compose up -d postgres redis"
        exit 1
    }
fi

# ---------------------------------------------------------------------------
# 6. Verification
# ---------------------------------------------------------------------------
echo "🔍 Verifying setup..."
python3 -c "
import urllib.request, json
req = urllib.request.Request('http://127.0.0.1:8000/health')
try:
    resp = urllib.request.urlopen(req, timeout=5)
    data = json.loads(resp.read())
    print(f\"✅ Health check: {data['status']} (db={data['checks']['database']})\")
except Exception as e:
    print(f\"⚠️  Health check failed: {e}\")
    print(\"   The API server may not be running yet.\")
    print(\"   Start it with: make dev\")
" || true

echo ""
echo "================================="
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  make dev          → Start backend on http://localhost:8000"
echo "  make test         → Run test suite"
echo "  make docker-up    → Start full Docker stack"
echo ""
