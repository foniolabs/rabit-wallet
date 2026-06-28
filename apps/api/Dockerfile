# -------------------------------------------------------------------
# Multi-stage Dockerfile for @rabit/api on Cloud Run.
# Builds from the repo root (build context = monorepo root) so we can
# resolve workspace deps (@rabit/types) and the lockfile.
# Build with:  docker build -f apps/api/Dockerfile -t rabit-api .
# -------------------------------------------------------------------

# ============================ Stage 1: builder ============================
FROM node:20-bookworm-slim AS builder
WORKDIR /repo

# pnpm via corepack (pinned to whatever the repo uses).
RUN corepack enable && corepack prepare pnpm@8.15.4 --activate

# OpenSSL is needed by Prisma at install time on slim images.
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy lockfile + workspace manifests first to maximise layer cache.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY packages/types/package.json packages/types/

# Install all deps for the api + its workspace deps. We need workspace
# deps fully to run prisma generate + tsc later.
RUN pnpm install --frozen-lockfile --filter @rabit/api... --filter @rabit/types

# Now copy the actual source.
COPY apps/api apps/api
COPY packages/types packages/types

# Generate Prisma client and compile TypeScript.
RUN pnpm --filter @rabit/api exec prisma generate && pnpm --filter @rabit/types build && pnpm --filter @rabit/api build

# Produce a deployable, prod-only bundle for just @rabit/api.
# `pnpm deploy` resolves workspace deps and copies them in.
RUN pnpm --filter @rabit/api --prod deploy /app

# `prisma` is a runtime dep in apps/api/package.json (so it survives
# `pnpm deploy --prod`) — call its local binary to regenerate the client
# against the deployed @prisma/client install.
COPY apps/api/prisma /app/prisma
RUN cd /app && ./node_modules/.bin/prisma generate --schema=./prisma/schema.prisma

# ============================ Stage 2: runtime ============================
FROM node:20-bookworm-slim AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Prisma's query engine needs OpenSSL at runtime too.
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates dumb-init && rm -rf /var/lib/apt/lists/*

# Copy the deployable bundle (dist/ + node_modules/ + package.json + prisma/).
COPY --from=builder /app /app

# Drop privileges.
RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 --gid nodejs nodeuser && chown -R nodeuser:nodejs /app
USER nodeuser

EXPOSE 8080

# `dumb-init` reaps zombies properly on Cloud Run's PID 1.
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
