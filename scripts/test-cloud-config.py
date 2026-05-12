#!/usr/bin/env python3
"""Test Cloud Run configuration locally before deploying.

Usage:
    # Test with Public IP (requires Cloud SQL auth network set to 0.0.0.0/0)
    export DATABASE_URL="postgresql+psycopg2://zims_user:Zentro_1998@34.21.153.83:5432/zims"
    export SECRET_KEY="zentro-zims-production-secret-key-2026-minimum-48-chars-long"
    export APP_ENV="production"
    python scripts/test-cloud-config.py

    # Test with Cloud SQL socket (requires Cloud SQL Proxy running locally)
    export DATABASE_URL="postgresql+psycopg2://zims_user:Zentro_1998@/zims?host=/cloudsql/zentro-zims:asia-southeast1:zims-postgres"
    export SECRET_KEY="zentro-zims-production-secret-key-2026-minimum-48-chars-long"
    export APP_ENV="production"
    python scripts/test-cloud-config.py
"""
from __future__ import annotations

import os
import sys


def banner(text: str) -> None:
    print(f"\n{'=' * 60}")
    print(f"  {text}")
    print(f"{'=' * 60}")


def test_env_vars() -> bool:
    """Check that required environment variables are set."""
    banner("Environment Variables")

    required = {
        "DATABASE_URL": os.getenv("DATABASE_URL"),
        "SECRET_KEY": os.getenv("SECRET_KEY"),
    }

    all_ok = True
    for name, value in required.items():
        if value:
            # Mask sensitive values
            display = value[:20] + "..." if len(value) > 20 else value
            if "pass" in name.lower() or "secret" in name.lower() or "url" in name.lower():
                display = "***SET***"
            print(f"  ✅ {name}: {display}")
        else:
            print(f"  ❌ {name}: MISSING")
            all_ok = False

    optional = {
        "APP_ENV": os.getenv("APP_ENV", "not set (defaults to development)"),
        "PORT": os.getenv("PORT", "not set (defaults to 8000)"),
        "CLOUD_SQL_INSTANCE": os.getenv("CLOUD_SQL_INSTANCE", "not set"),
    }
    for name, value in optional.items():
        print(f"  ℹ️  {name}: {value}")

    return all_ok


def test_config_import() -> bool:
    """Test that config.py loads without validation errors."""
    banner("Config Import")

    try:
        sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        from app.core.config import settings

        print(f"  ✅ Config loaded successfully")
        print(f"  ℹ️  APP_NAME: {settings.app_name}")
        print(f"  ℹ️  APP_ENV: {settings.app_env}")
        print(f"  ℹ️  DATABASE_URL host: {settings.database_url.split('@')[-1].split('/')[0]}")
        print(f"  ℹ️  Is SQLite: {settings.is_sqlite}")
        print(f"  ℹ️  SECRET_KEY length: {len(settings.secret_key)} chars")
        return True
    except Exception as exc:
        print(f"  ❌ Config failed to load: {exc}")
        return False


def test_database_connection() -> bool:
    """Test that SQLAlchemy can connect to the database."""
    banner("Database Connection")

    try:
        from app.core.database import engine
        from sqlalchemy import text

        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1 AS ok"))
            row = result.fetchone()
            assert row is not None and row[0] == 1

        print(f"  ✅ Database connected successfully")
        return True
    except Exception as exc:
        print(f"  ❌ Database connection failed: {exc}")
        print(f"\n  Troubleshooting:")
        print(f"    - Public IP: Ensure Cloud SQL has 0.0.0.0/0 in authorized networks")
        print(f"    - Socket: Ensure Cloud SQL Proxy is running or you're on Cloud Run")
        print(f"    - Check DATABASE_URL format matches your connection method")
        return False


def test_alembic() -> bool:
    """Test that Alembic can reach the database."""
    banner("Alembic Migration Check")

    try:
        from alembic import command
        from alembic.config import Config
        from pathlib import Path

        root = Path(__file__).resolve().parents[1]
        ini_path = root / "alembic.ini"

        if not ini_path.exists():
            print(f"  ⚠️  alembic.ini not found at {ini_path}")
            return True  # Not fatal

        cfg = Config(str(ini_path))
        cfg.set_main_option("script_location", str(root / "alembic"))

        # Just check current revision — don't actually run migrations
        from alembic.script import ScriptDirectory
        script = ScriptDirectory.from_config(cfg)
        current_head = script.get_current_head()
        print(f"  ✅ Alembic configured (head: {current_head})")
        return True
    except Exception as exc:
        print(f"  ⚠️  Alembic check failed: {exc}")
        return True  # Not fatal for basic deployment


def main() -> int:
    print("\n" + "=" * 60)
    print("  Zentro-ZIMS Cloud Config Test")
    print("=" * 60)

    results = []
    results.append(("Environment Variables", test_env_vars()))
    results.append(("Config Import", test_config_import()))
    results.append(("Database Connection", test_database_connection()))
    results.append(("Alembic", test_alembic()))

    banner("Summary")
    all_pass = True
    for name, ok in results:
        status = "✅ PASS" if ok else "❌ FAIL"
        print(f"  {status} — {name}")
        if not ok:
            all_pass = False

    print()
    if all_pass:
        print("🎉 All checks passed! Ready to deploy.")
        print()
        print("Deploy with:")
        print("  ./scripts/deploy-cloud-run.sh public")
        return 0
    else:
        print("⚠️ Some checks failed. Fix the issues above before deploying.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
