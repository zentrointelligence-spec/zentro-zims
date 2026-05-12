#!/usr/bin/env bash
# =============================================================================
# Zentro-ZIMS Frontend — Cloud Run Deployment (Source-based)
# =============================================================================
# Uses `gcloud run deploy --source` which auto-handles:
#   - Cloud Build
#   - Artifact Registry
#   - Container push
#   - Service deployment
#
# Usage:
#   ./scripts/deploy-frontend.sh [BACKEND_URL]
#
# Example:
#   ./scripts/deploy-frontend.sh https://zims-api-xxx.a.run.app
# =============================================================================

set -uo pipefail

PROJECT_ID="zentro-zims"
REGION="asia-southeast1"
SERVICE_NAME="zims-web"

# Backend URL — the Cloud Run URL for zims-api
BACKEND_URL="${1:-}"

echo "============================================================"
echo "  Zentro-ZIMS Frontend Cloud Run Deploy"
echo "  Service: $SERVICE_NAME"
echo "  Region: $REGION"
echo "============================================================"

if [ -z "$BACKEND_URL" ]; then
    echo ""
    echo "Usage: $0 <backend_cloud_run_url>"
    echo ""
    echo "Get your backend URL:"
    echo "  gcloud run services describe zims-api --region=$REGION --format='value(status.url)'"
    echo ""
    exit 1
fi

echo ""
echo "Backend URL: $BACKEND_URL"

# ---------------------------------------------------------------------------
# Verify gcloud
# ---------------------------------------------------------------------------
CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null || true)
if [ "$CURRENT_PROJECT" != "$PROJECT_ID" ]; then
    echo "Setting gcloud project to $PROJECT_ID..."
    gcloud config set project "$PROJECT_ID"
fi

# ---------------------------------------------------------------------------
# Grant frontend service account permission to call backend
# ---------------------------------------------------------------------------
echo ""
echo "[1/3] Granting service-to-service IAM permissions..."

PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format='value(projectNumber)' 2>/dev/null || echo "")
if [ -n "$PROJECT_NUMBER" ]; then
    FRONTEND_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
else
    FRONTEND_SA="${PROJECT_ID}@appspot.gserviceaccount.com"
fi

echo "  Using service account: ${FRONTEND_SA}"

gcloud run services add-iam-policy-binding zims-api \
    --project="$PROJECT_ID" \
    --region="$REGION" \
    --member="serviceAccount:${FRONTEND_SA}" \
    --role="roles/run.invoker" || {
    echo ""
    echo "  ⚠️  Could not auto-grant IAM permission."
    echo "     Run this manually if the frontend can't reach the backend:"
    echo ""
    echo "  gcloud run services add-iam-policy-binding zims-api \\"
    echo "    --region=$REGION \\"
    echo "    --member=serviceAccount:${FRONTEND_SA} \\"
    echo "    --role=roles/run.invoker"
    echo ""
}

# ---------------------------------------------------------------------------
# Deploy with source (Cloud Build handles everything)
# ---------------------------------------------------------------------------
echo ""
echo "[2/3] Building & deploying from source..."
echo "  → This uses Cloud Build under the hood (3-6 minutes)..."

cd "$(dirname "$0")/../web"

gcloud run deploy "$SERVICE_NAME" \
    --project="$PROJECT_ID" \
    --region="$REGION" \
    --source . \
    --platform=managed \
    --set-env-vars="ZIMS_API_URL=${BACKEND_URL},ZIMS_API_PREFIX=/api/v1,NEXT_PUBLIC_SITE_URL=https://zentro.io,NODE_ENV=production" \
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
# Make frontend public
# ---------------------------------------------------------------------------
echo ""
echo "[3/3] Setting public access..."
gcloud run services add-iam-policy-binding "$SERVICE_NAME" \
    --project="$PROJECT_ID" \
    --region="$REGION" \
    --member="allUsers" \
    --role="roles/run.invoker" || {
    echo ""
    echo "  ⚠️  Could not make service public (org policy may block allUsers)."
    echo "     You can still test with an identity token:"
    echo "       TOKEN=\$(gcloud auth print-identity-token)"
    echo "       curl -H \"Authorization: Bearer \$TOKEN\" <service-url>"
    echo ""
}

# ---------------------------------------------------------------------------
# Results
# ---------------------------------------------------------------------------
echo ""
echo "============================================================"
echo "  ✅ Frontend Deployment Complete!"
echo "============================================================"

SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
    --project="$PROJECT_ID" \
    --region="$REGION" \
    --format='value(status.url)')

echo ""
echo "  Frontend URL: $SERVICE_URL"
echo "  Backend URL:  $BACKEND_URL"
echo ""
echo "  Test it:"
echo "    curl $SERVICE_URL"
echo "    curl $SERVICE_URL/health"
echo ""
echo "  View logs:"
echo "    gcloud logging tail 'resource.type=cloud_run_revision AND resource.labels.service_name=$SERVICE_NAME' --project=$PROJECT_ID"
echo ""
