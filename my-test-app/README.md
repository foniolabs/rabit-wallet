# my-test-app

A web2-feeling dApp built with the [Rabit embedded wallet](https://github.com/foniolabs/rabit-wallet).

## Run

```bash
npm install     # or pnpm / yarn / bun
cp .env.example .env.local   # fill in API key + Google ID + bundler URL if you have them
npm run dev
```

Open http://localhost:5173, click **Sign in**, type your email, paste the OTP — and you have a non-custodial wallet on EVM + Solana.

## What's wired up

- `<RabitProvider>` configured with all 5 preset EVM chains + Solana mainnet/devnet/testnet.
- `<WalletButton />` opens `<RabitDashboard />` — balance, send, swap, buy/sell, network switcher, settings, security.
- Email + Google sign-in (drop a `VITE_GOOGLE_CLIENT_ID` to enable).
- ERC-4337 smart accounts (drop `VITE_BUNDLER_URL` to enable).

See [`@rabit/react` on npm](https://www.npmjs.com/package/@rabit/react) for the full hook + component reference.
