# @rabit/api

Backend for the Rabit embedded wallet SDK. Handles auth (email OTP + Google OAuth), encrypted auth-share storage, and on-ramp / off-ramp orders.

## Local setup

1. Copy env:
   ```bash
   cp .env.example .env
   ```
2. Start PostgreSQL (choose one):
   - Existing Postgres: set `DATABASE_URL` in `.env`.
   - Docker: `docker run -d --name rabit-pg -e POSTGRES_USER=rabit -e POSTGRES_PASSWORD=rabit -e POSTGRES_DB=rabit -p 5432:5432 postgres:16`
3. Run the first migration:
   ```bash
   pnpm db:migrate
   ```
4. Boot the API:
   ```bash
   pnpm dev
   ```

## Optional integrations

- **Resend** — set `RESEND_API_KEY` to actually send OTP emails (otherwise the code is logged to stdout).
- **Google OAuth** — set `GOOGLE_CLIENT_ID` to enable `/auth/oauth` with `provider: 'google'`.

## Scripts

| Script | Description |
|---|---|
| `pnpm dev` | tsx watch server |
| `pnpm build` | tsc build |
| `pnpm db:generate` | Regenerate Prisma client |
| `pnpm db:migrate` | Create/apply a new migration (dev) |
| `pnpm db:deploy` | Apply pending migrations (prod) |
| `pnpm db:studio` | Open Prisma Studio |
| `pnpm db:reset` | Drop and re-seed the database |
