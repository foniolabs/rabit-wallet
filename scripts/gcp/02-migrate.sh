#!/usr/bin/env bash
# Run Prisma migrations against the Cloud SQL instance using the
# Cloud SQL Auth Proxy. Re-run this any time you add a migration.
#
# Required env:
#   GCP_PROJECT_ID
#   DB_INSTANCE_CONNECTION  — project:region:instance
#   DB_PASSWORD             — for the postgres role
#
# This downloads the Auth Proxy binary into ./.gcp/ on first run.

set -euo pipefail

: "${GCP_PROJECT_ID:?set GCP_PROJECT_ID}"
: "${DB_INSTANCE_CONNECTION:?set DB_INSTANCE_CONNECTION}"
: "${DB_PASSWORD:?set DB_PASSWORD}"

PROXY_DIR=".gcp"
PROXY_BIN="${PROXY_DIR}/cloud-sql-proxy"
PROXY_PORT="${PROXY_PORT:-5433}"

mkdir -p "$PROXY_DIR"

if [[ ! -x "$PROXY_BIN" ]]; then
  echo "==> Downloading cloud-sql-proxy v2"
  OS="$(uname | tr '[:upper:]' '[:lower:]')"
  ARCH="$(uname -m)"
  case "$ARCH" in
    x86_64) ARCH=amd64 ;;
    aarch64|arm64) ARCH=arm64 ;;
  esac
  curl -fsSL -o "$PROXY_BIN" \
    "https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.13.0/cloud-sql-proxy.${OS}.${ARCH}"
  chmod +x "$PROXY_BIN"
fi

echo "==> Starting Cloud SQL Auth Proxy on :${PROXY_PORT}"
"$PROXY_BIN" --port="$PROXY_PORT" "$DB_INSTANCE_CONNECTION" &
PROXY_PID=$!
trap "kill $PROXY_PID 2>/dev/null || true" EXIT

# Wait for the proxy to be ready (max ~10s).
for _ in {1..20}; do
  if (echo > "/dev/tcp/127.0.0.1/${PROXY_PORT}") >/dev/null 2>&1; then
    break
  fi
  sleep 0.5
done

# URL-encode the password — base64 / random passwords often contain +, /, =, @
# which break Postgres URL parsing if left raw.
DB_PASSWORD_ENC="$(python3 -c 'import os, urllib.parse; print(urllib.parse.quote(os.environ["DB_PASSWORD"], safe=""))')"
# sslmode=disable is REQUIRED — the Cloud SQL Auth Proxy already encrypts
# the upstream tunnel; connections to its localhost listener are plaintext.
export DATABASE_URL="postgresql://postgres:${DB_PASSWORD_ENC}@127.0.0.1:${PROXY_PORT}/rabit?schema=public&sslmode=disable"

echo "==> Running prisma migrate deploy"
pnpm --filter @rabit/api exec prisma migrate deploy

echo "==> Done"
