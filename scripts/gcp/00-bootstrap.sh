#!/usr/bin/env bash
# One-time GCP bootstrap: enables APIs, creates Artifact Registry repo,
# Cloud SQL instance, the rabit DB, and a least-privilege service account.
#
# Run this ONCE per GCP project. Idempotent — re-running is safe.
#
# Required env (export or copy from .env.gcp):
#   GCP_PROJECT_ID    — your GCP project id
#   GCP_REGION        — e.g. us-central1
#   DB_INSTANCE_NAME  — e.g. rabit-db
#   DB_PASSWORD       — strong password for the rabit role

set -euo pipefail

: "${GCP_PROJECT_ID:?set GCP_PROJECT_ID}"
: "${GCP_REGION:?set GCP_REGION}"
: "${DB_INSTANCE_NAME:?set DB_INSTANCE_NAME}"
: "${DB_PASSWORD:?set DB_PASSWORD}"

REPO="${REPO:-rabit}"
SA_NAME="${SA_NAME:-rabit-api}"
SA_EMAIL="${SA_NAME}@${GCP_PROJECT_ID}.iam.gserviceaccount.com"

echo "==> Setting active project"
gcloud config set project "$GCP_PROJECT_ID" >/dev/null

echo "==> Enabling required APIs"
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  sqladmin.googleapis.com \
  secretmanager.googleapis.com \
  iam.googleapis.com \
  >/dev/null

echo "==> Creating Artifact Registry repo (if missing)"
gcloud artifacts repositories describe "$REPO" --location="$GCP_REGION" >/dev/null 2>&1 \
  || gcloud artifacts repositories create "$REPO" \
       --repository-format=docker \
       --location="$GCP_REGION" \
       --description="Rabit container images"

echo "==> Creating Cloud SQL Postgres instance (this takes ~6 minutes the first time)"
if ! gcloud sql instances describe "$DB_INSTANCE_NAME" >/dev/null 2>&1; then
  gcloud sql instances create "$DB_INSTANCE_NAME" \
    --database-version=POSTGRES_15 \
    --tier=db-f1-micro \
    --region="$GCP_REGION" \
    --storage-type=SSD \
    --storage-size=10GB \
    --backup \
    --backup-start-time=03:00
else
  echo "    instance already exists, skipping create"
fi

echo "==> Creating database 'rabit' (if missing)"
gcloud sql databases describe rabit --instance="$DB_INSTANCE_NAME" >/dev/null 2>&1 \
  || gcloud sql databases create rabit --instance="$DB_INSTANCE_NAME"

echo "==> Setting password on the postgres user"
gcloud sql users set-password postgres \
  --instance="$DB_INSTANCE_NAME" \
  --password="$DB_PASSWORD" >/dev/null

echo "==> Creating service account for Cloud Run"
gcloud iam service-accounts describe "$SA_EMAIL" >/dev/null 2>&1 \
  || gcloud iam service-accounts create "$SA_NAME" \
       --display-name="Rabit API runtime"

echo "==> Granting roles to service account"
for role in \
  roles/cloudsql.client \
  roles/secretmanager.secretAccessor \
  roles/logging.logWriter \
  roles/monitoring.metricWriter \
; do
  gcloud projects add-iam-policy-binding "$GCP_PROJECT_ID" \
    --member="serviceAccount:${SA_EMAIL}" \
    --role="$role" \
    --condition=None \
    --quiet >/dev/null
done

INSTANCE_CONNECTION="${GCP_PROJECT_ID}:${GCP_REGION}:${DB_INSTANCE_NAME}"

cat <<EOF

✅ Bootstrap complete.

   Region                : $GCP_REGION
   Artifact Registry     : ${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${REPO}
   Cloud SQL instance    : $INSTANCE_CONNECTION
   Service account       : $SA_EMAIL

   Next step:
     export DB_INSTANCE_CONNECTION='$INSTANCE_CONNECTION'
     bash scripts/gcp/01-secrets.sh

EOF
