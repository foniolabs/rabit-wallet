<div align="center">
  <h1>Rabit (رابط)</h1>
  <p><strong>Embedded wallet SDK with built-in on-ramp</strong></p>
  
  [![npm version](https://badge.fury.io/js/rabitwallet.svg)](https://www.npmjs.com/package/rabitwallet)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
</div>

## What is Rabit?

Rabit (Arabic: رابط, meaning "connector") is an embedded wallet SDK for dApp developers. Users sign in with email or Google — no browser extensions, no seed phrases, no popups. Under the hood, Rabit generates a non-custodial wallet using split-key cryptography (2-of-3 Shamir Secret Sharing), supporting both EVM and Solana chains, with built-in fiat on-ramp and off-ramp.

## Scaffold a New Project

The fastest way to get started:

```bash
npx rabitwallet init my-app
cd my-app
npm install
npm run dev
```

## Quick Start (manual)

```bash
npm install rabitwallet
```

```tsx
import {
  RabitProvider,
  WalletButton,
  PRESET_EVM_CHAINS,
  ETHEREUM_SEPOLIA,
  PRESET_SOLANA_CHAINS,
} from 'rabitwallet';

function App() {
  return (
    <RabitProvider
      config={{
        projectId: 'your-project-id',
        apiKey: 'your-api-key',
        app: { name: 'My DApp' },
        evmChains: PRESET_EVM_CHAINS,
        defaultEvmChainId: ETHEREUM_SEPOLIA.id,
        solanaChains: PRESET_SOLANA_CHAINS,
        defaultSolanaCluster: 'devnet',
        authMethods: ['email', 'google'],
      }}
    >
      <WalletButton />
    </RabitProvider>
  );
}
```

> 📖 **[Full quickstart & API reference →](docs/getting-started.mdx)**

## Architecture

`rabitwallet` is the single published package — it bundles the internal `@rabit/*`
workspace packages and ships a `rabitwallet init` scaffolder.

```
rabitwallet           → The published SDK: React provider, hooks, components,
                        chains, + the `rabitwallet init` CLI. One install, one import.

internal workspace packages (bundled into rabitwallet, not published):
  @rabit/react        → React provider, hooks, auth modal, wallet button
  @rabit/core         → Auth engine, wallet engine, session management
  @rabit/keys         → Shamir 2-of-3, BIP-44 key derivation, AES encryption
  @rabit/evm          → EVM EOA wallet (viem), chain definitions
  @rabit/solana       → Solana EOA wallet (@solana/web3.js)
  @rabit/onramp       → Fiat on-ramp and off-ramp engine
  @rabit/types        → Shared TypeScript types

apps/api              → Auth server, key-share storage, on-ramp backend
```

## Key Features

- **Web2-like auth** — Email OTP or Google OAuth, no seed phrases
- **Non-custodial** — 2-of-3 Shamir split-key, you never hold the full key
- **Multi-chain** — EVM + Solana from the same seed (BIP-44)
- **Smart accounts** — EOA or Smart Account (Kernel/Safe/LightAccount), user switches
- **On-ramp / Off-ramp** — Built-in fiat rails (bank transfer, card, mobile money)
- **Developer SDK** — Drop-in React components, hooks for everything

## Development

```bash
pnpm install
pnpm dev
```

## Monorepo layout

```
apps/
  api/         # backend API
  landing/     # marketing site (Next.js 14, Tailwind) — port 3002
  docs/        # docs site (Next.js + Nextra)         — port 3001
  dashboard/   # developer dashboard (Next.js)         — port 3000
packages/
  rabitwallet/        # the published SDK + `rabitwallet init` CLI
  core/, react/, evm/, solana/, types/, keys/, onramp/, ...  # internal, bundled
examples/
  vite-react/, nextjs-basic/, nextjs-smart-accounts/, create-react-app/
```

### Run the website locally

```bash
# Marketing site            (http://localhost:3002)
pnpm --filter @rabit/landing dev

# Documentation             (http://localhost:3001)
pnpm --filter @rabit/docs dev

# Developer dashboard       (http://localhost:3000)
# Requires the API to be running and these env vars (see apps/dashboard/.env.example):
#   RABIT_API_URL=http://localhost:3001
#   RABIT_API_KEY=dev-api-key
# NOTE: apps/api and apps/docs both default to :3001. Run only one at a time,
# or override with PORT=3002 pnpm --filter @rabit/api dev (and update
# RABIT_API_URL to match).
pnpm --filter @rabit/api dev      # in another terminal
pnpm --filter @rabit/dashboard dev

# Build any of them
pnpm --filter @rabit/landing build
```

### Deploy

Each app ships its own [`vercel.json`](apps/landing/vercel.json) configured for the monorepo. Create three Vercel projects, set the **root directory** to:

- `apps/landing` → marketing site (e.g. `rabit.dev`)
- `apps/docs` → documentation (e.g. `docs.rabit.dev`)
- `apps/dashboard` → developer dashboard (e.g. `dashboard.rabit.dev`)

Vercel auto-detects the workspace-aware build command from each app's `vercel.json`.

## License

MIT
