# Deploying `apps/api` to Google Cloud Run

This is a step-by-step runbook. If a step says "run this", you copy and paste it
into your terminal. Total time the first time: **~30–45 minutes**, most of it
waiting for Cloud SQL to provision.

---

## What you'll end up with

```
                    ┌────────────────────────────┐
   Vercel (free) ───┤  apps/dashboard (Next.js)  │
                    └──────────────┬─────────────┘
                                   │   HTTPS
                                   ▼
                    ┌────────────────────────────┐
   Cloud Run        │  rabit-api (Express)       │
   (scale-to-zero) ─┤  Docker image from         │
                    │  Artifact Registry         │
                    └──────────────┬─────────────┘
                                   │   Unix socket
                                   ▼
                    ┌────────────────────────────┐
   Cloud SQL        │  Postgres 15, db-f1-micro  │
                    └────────────────────────────┘

   Secrets (DATABASE_URL, JWT_SECRET, etc.) live in Secret Manager
   and are mounted into the Cloud Run container at start.
```

Roughly **$20–30/month** at idle traffic, well within your $300 credit.

---

## 0. Prerequisites (one-time, on your laptop)

### Install the gcloud CLI

```bash
# Linux (apt)
sudo apt-get install -y google-cloud-cli

# macOS (Homebrew)
brew install --cask google-cloud-sdk
```

Verify:

```bash
gcloud --version
```

### Sign in & pick a project

```bash
gcloud auth login            # opens a browser
gcloud auth application-default login
```

In the [Cloud Console](https://console.cloud.google.com), create a new project
(top-left dropdown → New project). Note its **Project ID** (NOT the display
name) — you'll need it.

```bash
gcloud config set project YOUR-PROJECT-ID
```

### Link billing

Cloud Run, Cloud SQL, and Artifact Registry require an active billing account.
In the Console: **Billing → Link a billing account** to your project. Your
$300 credit covers this.

---

## 1. Configure your local env

```bash
cp scripts/gcp/.env.example scripts/gcp/.env.gcp
$EDITOR scripts/gcp/.env.gcp
```

Fill in:

```bash
GCP_PROJECT_ID=your-actual-project-id
GCP_REGION=us-central1                      # cheapest US region
DB_INSTANCE_NAME=rabit-db
DB_PASSWORD=<generate a 24+ char password>
RESEND_API_KEY=                             # leave blank for now
```

> **Don't commit `.env.gcp`** — it's already in `.gitignore`.

Load it into your shell **for every step below**:

```bash
set -a && source scripts/gcp/.env.gcp && set +a
```

---

## 2. Bootstrap the project

This enables APIs, creates the Artifact Registry repo, the Cloud SQL instance
(takes ~6 minutes), the database, and a service account for Cloud Run.

```bash
bash scripts/gcp/00-bootstrap.sh
```

When it finishes, copy the `DB_INSTANCE_CONNECTION` it prints back into
`scripts/gcp/.env.gcp` and re-source the file:

```bash
# in scripts/gcp/.env.gcp:
DB_INSTANCE_CONNECTION=your-project-id:us-central1:rabit-db

set -a && source scripts/gcp/.env.gcp && set +a
```

---

## 3. Push secrets to Secret Manager

This generates `JWT_SECRET` + `JWT_REFRESH_SECRET`, builds a `DATABASE_URL`
that uses Cloud Run's Cloud SQL unix socket, and stores everything in Secret
Manager (encrypted at rest, audited, IAM-gated).

```bash
bash scripts/gcp/01-secrets.sh
```

You can paste a real `RESEND_API_KEY` later with:

```bash
printf '%s' "re_your_actual_key" | \
  gcloud secrets versions add RESEND_API_KEY --data-file=-
```

---

## 4. Run database migrations

This downloads the [Cloud SQL Auth Proxy](https://cloud.google.com/sql/docs/postgres/sql-proxy),
opens a secure tunnel to your Postgres instance, and runs `prisma migrate deploy`.

```bash
bash scripts/gcp/02-migrate.sh
```

You'll see Prisma applying every migration in `apps/api/prisma/migrations/`.
This is also how you'll deploy future schema changes.

---

## 5. Deploy

```bash
bash scripts/gcp/03-deploy.sh
```

This runs Cloud Build, which:

1. Builds the multi-stage `apps/api/Dockerfile`
2. Pushes it to Artifact Registry as
   `${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/rabit/rabit-api:<sha>`
3. Deploys it to Cloud Run with secrets and Cloud SQL attached

When it finishes you get a URL like
`https://rabit-api-xxxxxxxx-uc.a.run.app`. Test it:

```bash
curl https://rabit-api-xxxxxxxx-uc.a.run.app/health
# {"status":"ok","version":"0.1.0"}
```

---

## 6. Point the dashboard at the deployed API

Two options.

### A. Run the dashboard locally against Cloud Run

```bash
# apps/dashboard/.env.local
RABIT_API_URL=https://rabit-api-xxxxxxxx-uc.a.run.app
RABIT_API_KEY=dev-api-key
```

### B. Deploy the dashboard to Vercel

```bash
cd apps/dashboard
npx vercel link
npx vercel env add RABIT_API_URL production
# paste your Cloud Run URL
npx vercel env add RABIT_API_KEY production
# paste a pk_live_… from your /api-keys page
npx vercel --prod
```

You'll also need to allow the Vercel domain in the API's CORS config —
edit `apps/api/.env` (or set as a Cloud Run env var):

```
CORS_ORIGINS=https://your-vercel-domain.vercel.app
```

Then redeploy with `bash scripts/gcp/03-deploy.sh`.

---

## Common operations

| Task | Command |
|------|---------|
| Ship a new API version | `bash scripts/gcp/03-deploy.sh` |
| Add / apply a Prisma migration | `pnpm --filter @rabit/api db:migrate` (locally) → `bash scripts/gcp/02-migrate.sh` (against prod) |
| Rotate `JWT_SECRET` | `printf '%s' "$(openssl rand -base64 32)" \| gcloud secrets versions add JWT_SECRET --data-file=-` then redeploy |
| Tail Cloud Run logs | `gcloud run services logs tail rabit-api --region=$GCP_REGION` |
| Show service URL | `gcloud run services describe rabit-api --region=$GCP_REGION --format='value(status.url)'` |
| Roll back to a previous revision | `gcloud run revisions list --service=rabit-api --region=$GCP_REGION` then `gcloud run services update-traffic rabit-api --to-revisions=REVISION_NAME=100 --region=$GCP_REGION` |
| Connect to the prod DB locally | `bash scripts/gcp/02-migrate.sh` (the script's `cloud-sql-proxy` step gives you a `localhost:5433` Postgres) |

---

## Troubleshooting

**"Permission denied" on a script** — `chmod +x scripts/gcp/*.sh` (already done in repo, but in case).

**Cloud Build fails on `pnpm install`** — likely a lockfile drift. Run `pnpm install` locally first, commit `pnpm-lock.yaml`, retry.

**Prisma errors at runtime** — probably the migration didn't run. Re-run `bash scripts/gcp/02-migrate.sh`. Check `gcloud sql databases list --instance=$DB_INSTANCE_NAME` to confirm the `rabit` DB exists.

**"Cloud SQL Admin API has not been used"** — bootstrap script enables it, but it can take 1–2 minutes to propagate. Re-run.

**CORS errors from the dashboard** — set `CORS_ORIGINS` env var on Cloud Run:
```bash
gcloud run services update rabit-api --region=$GCP_REGION \
  --update-env-vars=CORS_ORIGINS=https://your-vercel-domain.vercel.app
```

**Cold-start latency feels slow** — Cloud Run scales to zero by default. To keep one warm:
```bash
gcloud run services update rabit-api --region=$GCP_REGION --min-instances=1
```
(This costs ~$5–10/mo extra.)

---

## What's NOT in this setup

- **No custom domain** yet — Cloud Run gives you a `*.run.app` URL. To use `api.rabit.dev`, set up [Cloud Run Domain Mappings](https://cloud.google.com/run/docs/mapping-custom-domains).
- **No CI/CD trigger** — every deploy is manual via `03-deploy.sh`. Wire a [Cloud Build trigger](https://cloud.google.com/build/docs/automating-builds/create-manage-triggers) on `git push origin main` when you're ready.
- **No PITR / replicas** — the Cloud SQL instance is single-zone with daily backups. Fine for dev/early production; bump to high-availability when you have real traffic.
- **No outbound rate limits** — you're on `db-f1-micro`. If you start seeing CPU saturation in Cloud SQL, upgrade to `db-g1-small`.
