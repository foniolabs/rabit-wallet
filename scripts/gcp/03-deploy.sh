#!/usr/bin/env bash
# Build + deploy the API to Cloud Run via Cloud Build.
# Re-run this whenever you ship a new API version.
#
# Required env:
#   GCP_PROJECT_ID
#   GCP_REGION
#   DB_INSTANCE_CONNECTION
#
# Optional env:
#   SA_NAME (default: rabit-api)

set -euo pipefail

: "${GCP_PROJECT_ID:?set GCP_PROJECT_ID}"
: "${GCP_REGION:?set GCP_REGION}"
: "${DB_INSTANCE_CONNECTION:?set DB_INSTANCE_CONNECTION}"

SA_NAME="${SA_NAME:-rabit-api}"
SA_EMAIL="${SA_NAME}@${GCP_PROJECT_ID}.iam.gserviceaccount.com"

echo "==> Submitting build to Cloud Build"
gcloud builds submit \
  --project="$GCP_PROJECT_ID" \
  --config=cloudbuild.yaml \
  --substitutions="_REGION=${GCP_REGION},_DB_INSTANCE=${DB_INSTANCE_CONNECTION},_SERVICE_ACCOUNT=${SA_EMAIL}"

URL="$(gcloud run services describe rabit-api \
  --project="$GCP_PROJECT_ID" \
  --region="$GCP_REGION" \
  --format='value(status.url)')"

cat <<EOF

✅ Deployed.

   Service URL : $URL
   Health      : $URL/health

   Next: point the dashboard at it.
     On Vercel (apps/dashboard project), set env:
       RABIT_API_URL = $URL
       RABIT_API_KEY = <your project's pk_live_… key>
     Redeploy.

EOF
