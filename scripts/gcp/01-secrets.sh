#!/usr/bin/env bash
# Creates / rotates Secret Manager entries that Cloud Run will mount.
#
# Required env:
#   GCP_PROJECT_ID
#   DB_INSTANCE_CONNECTION  — e.g. project-id:us-central1:rabit-db
#   DB_PASSWORD             — same as bootstrap step
#   RESEND_API_KEY          — optional, leave blank to use a placeholder
#
# Cloud Run connects to Cloud SQL via the unix socket at
#   /cloudsql/$INSTANCE_CONNECTION/.s.PGSQL.5432
# That's what the DATABASE_URL below references.

set -euo pipefail

: "${GCP_PROJECT_ID:?set GCP_PROJECT_ID}"
: "${DB_INSTANCE_CONNECTION:?set DB_INSTANCE_CONNECTION (project:region:instance)}"
: "${DB_PASSWORD:?set DB_PASSWORD}"

RESEND_API_KEY="${RESEND_API_KEY:-placeholder-set-real-value-later}"

put_secret () {
  local name="$1" value="$2"
  if gcloud secrets describe "$name" --project="$GCP_PROJECT_ID" >/dev/null 2>&1; then
    echo "    rotating $name"
    printf '%s' "$value" | gcloud secrets versions add "$name" --data-file=- --project="$GCP_PROJECT_ID" >/dev/null
  else
    echo "    creating $name"
    printf '%s' "$value" | gcloud secrets create "$name" \
      --replication-policy=automatic \
      --data-file=- \
      --project="$GCP_PROJECT_ID" >/dev/null
  fi
}

# 32 random bytes, base64-encoded — strong enough for HMAC signing.
JWT_SECRET="$(openssl rand -base64 32)"
JWT_REFRESH_SECRET="$(openssl rand -base64 32)"

# URL-encode the password — base64 / random passwords often contain +, /, =, @
# which break Postgres URL parsing if left raw.
DB_PASSWORD_ENC="$(python3 -c 'import os, urllib.parse; print(urllib.parse.quote(os.environ["DB_PASSWORD"], safe=""))')"

# Postgres connection string for the Cloud SQL unix socket.
DATABASE_URL="postgresql://postgres:${DB_PASSWORD_ENC}@localhost/rabit?host=/cloudsql/${DB_INSTANCE_CONNECTION}"

echo "==> Writing secrets"
put_secret DATABASE_URL       "$DATABASE_URL"
put_secret JWT_SECRET         "$JWT_SECRET"
put_secret JWT_REFRESH_SECRET "$JWT_REFRESH_SECRET"
put_secret RESEND_API_KEY     "$RESEND_API_KEY"

cat <<EOF

✅ Secrets written.

   Saved values to Secret Manager (NOT printed here for safety).
   Cloud Run will mount them via --set-secrets in cloudbuild.yaml.

   Next step:
     bash scripts/gcp/02-migrate.sh

EOF
