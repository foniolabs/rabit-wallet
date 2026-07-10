# Rabit — Handoff

_Last updated: 2026-06-27_

Rabit is an **embedded, non-custodial wallet SDK** with built-in fiat on/off-ramp.
Users sign in with email OTP or Google — no extensions, no seed phrases. Keys are
split 2-of-3 (Shamir): device share, auth share (server), recovery share. Multi-chain
(EVM + Solana) from one BIP-44 seed. EOA or smart account.

> Pivoted from a wallet-*connector* SDK. The legacy `packages/connectors` and
> `packages/smart-accounts` are kept on disk for reference but **excluded** from the
> workspace. Anything wagmi/WalletConnect/MetaMask-shaped is pre-pivot.

## Distribution: the `rabitwallet` package

The bare npm name `rabit` is taken by an unrelated party; the `@rabit/*` scope is free
but the individual packages were never published. The chosen public entry point is the
single self-contained package **`rabitwallet`** (`packages/rabitwallet`):

```bash
npm install rabitwallet          # add to an existing dApp
npx rabitwallet init my-dapp     # scaffold a fresh Next.js 14 app
```

- Re-exports the whole SDK: `import { RabitProvider, WalletButton, useAuth,
  PRESET_EVM_CHAINS, ETHEREUM_SEPOLIA, PRESET_SOLANA_CHAINS } from 'rabitwallet'`;
  full types at `rabitwallet/types`.
- **Bundles all `@rabit/*` code + inlines their `.d.ts`** (tsup `noExternal: [/^@rabit\//]`
  + `dts.resolve`). So it publishes as ONE package with no `@rabit` org needed.
  `react`/`react-dom` are peer deps; `viem`/`@solana`/`@noble`/`@scure` are deps.
- Verified end-to-end: packed tarball installed into the scaffolded app → `next build`
  compiles + type-checks clean.

### Publishing — ✅ DONE

1. ✅ **`rabitwallet@0.1.0` is published** to npm (org `foniolabs`, tagged `latest`)
   and verified installable from a clean project (`npm install rabitwallet` resolves
   CJS+ESM, exports + types + the `rabitwallet` bin).
2. ✅ Every `packages/*` package except `rabitwallet` is `private: true`, so a release
   publishes only `rabitwallet`.
3. ✅ `create-rabit-app` is **unpublished from npm (404) and removed from the repo** —
   its scaffolding now lives in `rabitwallet init`.

Notes for future releases:
- npm account 2FA is "Authorization and writes"; the second factor is a **passkey**, so
  CLI writes (`publish`/`deprecate`) need the interactive browser auth flow — they can't
  run non-interactively. For CI, either drop 2FA to "Authorization only" or use a token
  that actually bypasses 2FA, and set it as the `NPM_TOKEN` GitHub secret.
- `npm pkg fix` warnings on publish (bin name, `repository.url`) are cosmetic
  auto-corrections; clean them in `packages/rabitwallet/package.json` if desired.

## Status: ✅ buildable & testable

- `pnpm build` → **18/18 tasks pass**
- `pnpm type-check` → **21/21 tasks pass**
- All 7 SDK packages emit `dist/` (`types, keys, core, evm, solana, onramp, react`)

## Repo layout

```
packages/
  keys      → Shamir 2-of-3, BIP-44 HD derivation, AES, PIN vault, device share, export
  core      → auth-engine, wallet-engine, rabit-core (orchestrator)
  evm       → EVM EOA + chain presets (viem), smart-account resolver
  solana    → Solana EOA + cluster presets
  onramp    → fiat on/off-ramp engine
  react     → RabitProvider, WalletButton, AuthModal, dashboard/send/swap/activity
              components, PIN/recovery/export, ~22 hooks
  types     → shared TS types
  create-rabit-app → CLI scaffold (vite-react + nextjs templates)
apps/
  api       → Express + Prisma backend: auth (email OTP + Google), encrypted
              auth-share storage, on/off-ramp orders, usage metering, admin
  dashboard → Next.js developer console (projects, API keys, usage, settings)
  landing, docs
examples/   → vite-react, nextjs-basic, nextjs-smart-accounts, create-react-app
my-test-app → minimal Vite smoke-test app (workspace member)
```

## Production deployment (live) — ✅

The backend is deployed and fully usable by real dApps.

- **API (Cloud Run):** `https://rabit-api-116474648478.us-central1.run.app`
  (health: `/health`; project `rabit-494320`, region `us-central1`, service `rabit-api`).
- **Database:** Cloud SQL Postgres 15 `rabit-db`. Secrets (`DATABASE_URL`, `JWT_SECRET`,
  `JWT_REFRESH_SECRET`, `RESEND_API_KEY`) live in Secret Manager, mounted as `:latest`.
- **CORS:** open to all origins — the `CORS_ORIGINS` env var is intentionally **unset**
  so the code falls back to `*` (auth is gated by API key, not origin). Re-adding
  `CORS_ORIGINS` would re-lock it.
- **Email:** OTP delivery works to real recipients via `FROM_EMAIL=noreply@rabitwallet.xyz`
  (domain verified in Resend; DNS on Hostinger). The `RESEND_API_KEY` secret must be from
  the **same Resend account** that has `rabitwallet.xyz` verified — a mismatch shows
  "domain not verified". A "Sending access"–scoped key is fine (it returns empty from
  `GET /domains`, which is expected, not an error).
- **Prod keys:** a `Production dApp` project exists in the prod DB
  (`projectId cmr1pzdid0000eieciw6bta1l`) with `pk_live`/`pk_test` keys. Keys are stored
  bcrypt-hashed and unrecoverable — kept out of this file on purpose.

A dApp points at prod with:
```bash
NEXT_PUBLIC_RABIT_API_BASE_URL=https://rabit-api-116474648478.us-central1.run.app
NEXT_PUBLIC_RABIT_PROJECT_ID=<project id>
NEXT_PUBLIC_RABIT_API_KEY=<pk_live_… or pk_test_…>
```

### Deploy / operate (GCP)
Full runbook: `scripts/gcp/README.md`. Common operations:
```bash
# Ship a new API version
bash scripts/gcp/03-deploy.sh
# Apply migrations against prod (starts cloud-sql-proxy on a local port)
bash scripts/gcp/02-migrate.sh
# Mint prod keys: proxy to Cloud SQL on a FREE port, reuse the DATABASE_URL secret's
# password (the .env.gcp DB_PASSWORD is stale), then run mint-keys.ts. NOTE: :5433 is
# often already taken locally — pick another port or the proxy silently fails and you
# hit the wrong Postgres.
# Tail logs
gcloud run services logs tail rabit-api --region=us-central1
```

## Local testing — quickstart

Prereqs: Node ≥18, pnpm 8, Docker (for Postgres).

```bash
# 1. Postgres (already running here as container `rabit-pg` on :5434)
docker run -d --name rabit-pg -e POSTGRES_USER=rabit -e POSTGRES_PASSWORD=rabit \
  -e POSTGRES_DB=rabit -p 5434:5432 postgres:16

# 2. API
cd apps/api
cp .env.example .env          # already present here
pnpm db:migrate               # 3 migrations
pnpm dev                      # http://localhost:3001  (health: /health)

# 3. A dApp (pick one)
cd ../../my-test-app && pnpm dev          # http://localhost:5173
# or
cd ../examples/vite-react && pnpm dev
```

### Auth keys (sandbox vs prod)

API keys are Stripe-style, environment-prefixed: `pk_test_…` (sandbox/staging),
`pk_live_…` (production), `pk_dev_…` (development). Mint a project + key pair with:

```bash
cd apps/api && pnpm exec tsx scripts/mint-keys.ts "My dApp"
```

A `Test dApp` project already exists:
- `projectId`: `cmqws1frt0000117v1qmhfqh3`
- sandbox key wired into `my-test-app/.env`
- prod key wired into `examples/vite-react/.env.local`

The SDK config takes `{ projectId, apiKey, apiBaseUrl }`. For zero-setup local work
there's also a **dev bypass**: `apiKey: 'dev-api-key'` + `projectId: 'dev-project'`
(see `DEV_API_KEY` in `apps/api/.env`); the API auto-creates that project on first call.

### OTP without email

Without `RESEND_API_KEY`, OTP codes are logged to the API stdout AND returned in the
`/auth/otp/send` response as `devOtp`. (With Resend's free tier, real sends only go to
the verified address.) Set `GOOGLE_CLIENT_ID` to enable Google sign-in.

## End-to-end smoke checklist

1. Sign in via email OTP (grab `devOtp` from API response/logs) → confirm session.
2. Verify the wallet derives an EVM address (Sepolia) and a Solana address (devnet).
3. Set a PIN; confirm device-share unlock + recovery-share path.
4. Send a testnet tx on both chains.
5. Run the on-ramp flow.

## ⚠️ Known caveats / gotchas

- **`environment` on API keys is cosmetic.** `pk_test_` vs `pk_live_` is just a label
  today — nothing forces sandbox to testnets or isolates its data/usage. Both keys
  behave identically. Real separation (testnet gating + data isolation) is unbuilt.
- **`my-test-app` is now a workspace member** (added to `pnpm-workspace.yaml`) so its
  `@rabit/*` deps link locally; that also means `pnpm build` runs its build.
- **CRA example needs craco** (`examples/create-react-app/craco.config.js`) for Node
  polyfills (Buffer/process) that webpack 5 strips — `@rabit/keys` needs them. Vite
  apps handle this via a `polyfills.ts` imported first in the entry file.
- Root `package.json` metadata is stale ("wallet connector that actually works",
  placeholder author/repo) — pre-pivot, not yet updated.

## Backend env reference (`apps/api/.env`)

`PORT`, `DATABASE_URL`, `JWT_SECRET`/`JWT_REFRESH_SECRET`, `DEV_API_KEY`,
`RESEND_API_KEY`/`FROM_EMAIL` (optional), `GOOGLE_CLIENT_ID` (optional),
`CORS_ORIGINS`.
