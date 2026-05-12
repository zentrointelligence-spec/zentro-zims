#!/usr/bin/env bash
# =============================================================================
# Zentro-ZIMS Cloud Run Deployment Script
# =============================================================================
# Usage:
#   ./scripts/deploy-cloud-run.sh [public|socket]
#
# Modes:
#   public  → Use Cloud SQL Public IP (fastest to get working)
#   socket  → Use Cloud SQL Unix socket (more secure, requires IAM setup)
#
# Prerequisites:
#   - gcloud CLI authenticated: gcloud auth login
#   - Docker installed OR Cloud Build enabled
#   - Project set: gcloud config set project zentro-zims
# =============================================================================

set -euo pipefail

PROJECT_ID="zentro-zims"
REGION="asia-southeast1"
SERVICE_NAME="zims-api"
DB_USER="zims_user"
DB_PASS="Zentro_1998"
DB_NAME="zims"
# Cloud SQL Public IP (from your instance)
DB_PUBLIC_IP="34.21.153.83"
# Cloud SQL instance connection name
CLOUD_SQL_INSTANCE="zentro-zims:asia-southeast1:zims-postgres"

# Strong 48+ char secret for production
SECRET_KEY="zentro-zims-production-secret-key-2026-minimum-48-chars-long"

MODE="${1:-public}"

echo "============================================================"
echo "  Zentro-ZIMS Cloud Run Deployment"
echo "  Mode: $MODE"
echo "  Project: $PROJECT_ID"
echo "  Region: $REGION"
echo "  Service: $SERVICE_NAME"
echo "============================================================"

# ---------------------------------------------------------------------------
# Verify gcloud setup
# ---------------------------------------------------------------------------
echo ""
echo "[1/6] Verifying gcloud configuration..."
CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null || true)
if [ "$CURRENT_PROJECT" != "$PROJECT_ID" ]; then
    echo "Setting gcloud project to $PROJECT_ID..."
    gcloud config set project "$PROJECT_ID"
fi

# Enable required APIs
echo "[2/6] Enabling required APIs..."
gcloud services enable run.googleapis.com --project="$PROJECT_ID" || true
gcloud services enable cloudbuild.googleapis.com --project="$PROJECT_ID" || true
gcloud services enable sqladmin.googleapis.com --project="$PROJECT_ID" || true

# ---------------------------------------------------------------------------
# Build environment variables based on mode
# ---------------------------------------------------------------------------
echo ""
echo "[3/6] Configuring environment variables..."

BASE_ENV_VARS=(
    "APP_ENV=production"
    "SECRET_KEY=${SECRET_KEY}"
    "LOG_LEVEL=INFO"
    "RUN_ALEMBIC_ON_STARTUP=true"
    "CORS_ORIGINS=[\"*\"]"
)

if [ "$MODE" == "public" ]; then
    echo "  → Using Public IP connection"
    DB_URL="postgresql+psycopg2://${DB_USER}:${DB_PASS}@${DB_PUBLIC_IP}:5432/${DB_NAME}"
    BASE_ENV_VARS+=("DATABASE_URL=${DB_URL}")
    CLOUD_SQL_FLAG=""

elif [ "$MODE" == "socket" ]; then
    echo "  → Using Cloud SQL Unix socket"
    # URL format: postgresql+psycopg2://user:pass@/db?host=/cloudsql/...
    DB_URL="postgresql+psycopg2://${DB_USER}:${DB_PASS}@/${DB_NAME}?host=/cloudsql/${CLOUD_SQL_INSTANCE}"
    BASE_ENV_VARS+=("DATABASE_URL=${DB_URL}")
    BASE_ENV_VARS+=("CLOUD_SQL_INSTANCE=${CLOUD_SQL_INSTANCE}")
    CLOUD_SQL_FLAG="--add-cloudsql-instances=${CLOUD_SQL_INSTANCE}"

    # Grant Cloud SQL Client role to Cloud Run service account
    echo "  → Granting Cloud SQL Client IAM role..."
    SA="${PROJECT_ID}@appspot.gserviceaccount.com"
    gcloud projects add-iam-policy-binding "$PROJECT_ID" \
        --member="serviceAccount:${SA}" \
        --role="roles/cloudsql.client" \
        --condition=None || true
else
    echo "ERROR: Unknown mode '$MODE'. Use 'public' or 'socket'."
    exit 1
fi

# Join env vars with commas for gcloud
ENV_VARS_STRING=$(IFS=,; echo "${BASE_ENV_VARS[*]}")

# ---------------------------------------------------------------------------
# Build and deploy
# ---------------------------------------------------------------------------
echo ""
echo "[4/6] Building container image..."
echo "  → This may take 2-5 minutes..."

# Use Cloud Build for faster builds (no local Docker needed)
gcloud builds submit --tag "gcr.io/${PROJECT_ID}/${SERVICE_NAME}" . || {
    echo "ERROR: Cloud Build failed. Check logs above."
    exit 1
}

echo ""
echo "[5/6] Deploying to Cloud Run..."
gcloud run deploy "$SERVICE_NAME" \
    --project="$PROJECT_ID" \
    --region="$REGION" \
    --image="gcr.io/${PROJECT_ID}/${SERVICE_NAME}" \
    --platform=managed \
    --set-env-vars="$ENV_VARS_STRING" \
    ${CLOUD_SQL_FLAG:-} \
    --memory=1Gi \
    --cpu=1 \
    --concurrency=80 \
    --max-instances=10 \
    --timeout=300 \
    --port=8080 || {
    echo "ERROR: Cloud Run deployment failed."
    exit 1
}

# ---------------------------------------------------------------------------
# Make service public
# ---------------------------------------------------------------------------
echo ""
echo "[6/6] Making service public..."
gcloud run services add-iam-policy-binding "$SERVICE_NAME" \
    --project="$PROJECT_ID" \
    --region="$REGION" \
    --member="allUsers" \
    --role="roles/run.invoker" || true

# ---------------------------------------------------------------------------
# Show results
# ---------------------------------------------------------------------------
echo ""
echo "============================================================"
echo "  ✅ Deployment Complete!"
echo "============================================================"
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
    --project="$PROJECT_ID" \
    --region="$REGION" \
    --format='value(status.url)')

echo ""
echo "  Service URL: $SERVICE_URL"
echo "  Health Check: ${SERVICE_URL}/health"
echo "  API Docs: ${SERVICE_URL}/docs"
echo ""
echo "  Test it:"
echo "    curl ${SERVICE_URL}/health"
echo ""
echo "  View logs:"
echo "    gcloud logging tail 'resource.type=cloud_run_revision' --project=$PROJECT_ID"
echo ""

if [ "$MODE" == "public" ]; then
    echo "  ⚠️  SECURITY WARNING: Using Public IP mode."
    echo "     Restrict Cloud SQL authorized networks before going live:"
    echo "     https://console.cloud.google.com/sql/instances/zims-postgres/connections"
    echo ""
    echo "     Once verified, switch to socket mode for production:"
    echo "       ./scripts/deploy-cloud-run.sh socket"
fi
