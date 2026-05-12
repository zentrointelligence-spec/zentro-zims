#!/usr/bin/env bash
# =============================================================================
# wait-for-postgres.sh
# =============================================================================
# Waits until PostgreSQL is accepting connections.
# Used in entrypoint scripts before running migrations or starting the app.
#
# Usage:
#   ./wait-for-postgres.sh "postgresql://user:pass@host:5432/db" [timeout_seconds]
# =============================================================================

set -e

DB_URL="${1:-${DATABASE_URL}}"
TIMEOUT="${2:-30}"

if [ -z "$DB_URL" ]; then
    echo "Error: DATABASE_URL not provided"
    exit 1
fi

# Parse host and port from URL using Python (more reliable than regex)
PYTHON_CODE="
from urllib.parse import urlparse
url = urlparse('$DB_URL')
print(f'{url.hostname}:{url.port or 5432}')
"
HOSTPORT=$(python3 -c "$PYTHON_CODE")

echo "⏳ Waiting for PostgreSQL at $HOSTPORT (timeout: ${TIMEOUT}s)..."

for i in $(seq 1 "$TIMEOUT"); do
    if python3 -c "
import socket, sys
try:
    host, port = '$HOSTPORT'.split(':')
    socket.create_connection((host, int(port)), timeout=2)
    sys.exit(0)
except Exception:
    sys.exit(1)
" 2>/dev/null; then
        echo "✅ PostgreSQL is ready"
        exit 0
    fi
    echo "  attempt $i/$TIMEOUT..."
    sleep 1
done

echo "❌ Timeout waiting for PostgreSQL"
exit 1
