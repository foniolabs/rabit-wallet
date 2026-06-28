# Rabit Vite + React Example

End-to-end demo of `@rabit/react` — email OTP auth, Google Sign-In, on-ramp / off-ramp quotes, and smart-account deployment.

## Run

```bash
# Terminal 1 — API (requires Postgres from apps/api README)
pnpm --filter @rabit/api dev

# Terminal 2 — this example
pnpm --filter vite-react-example dev
```

Open http://localhost:3012.

## Optional features

Copy `.env.example` to `.env.local` to enable extras. The app boots without any of these; each is independent.

### Google Sign-In

```
VITE_GOOGLE_CLIENT_ID=<same Client ID as apps/api/.env GOOGLE_CLIENT_ID>
```

A "Sign in with Google" button appears below the wallet button. The ID token is posted to `/auth/oauth`, the API verifies it via `google-auth-library`, and a wallet is generated just like the email flow.

### Smart accounts (ERC-4337)

```
VITE_BUNDLER_URL=https://api.pimlico.io/v2/sepolia/rpc?apikey=pim_xxx
VITE_PAYMASTER_URL=   # optional, same provider — enables gas sponsorship
VITE_SMART_ACCOUNT_TYPE=kernel   # kernel | safe | light
```

Sign up at https://dashboard.pimlico.io (or ZeroDev / Alchemy / Stackup) for a free bundler API key on Sepolia.

When set, a "Smart account" panel appears with buttons to:
- **Check on-chain** — reads the account's bytecode via the RPC to confirm deployment status
- **Deploy** — submits a no-op userOp that triggers factory deployment
- **Send no-op userOp** — verifies you can execute against the account

The counterfactual address is shown before deployment (same owner + index → same address across chains).

## On-ramp / off-ramp

Work with no extra setup — the API hits CoinGecko for live rates. Get a quote, inspect fees, then "Confirm" to create an order row in Postgres. Payment processing itself is not wired (the order will sit in `awaiting_payment`).

## What to edit

- [src/App.tsx](src/App.tsx) — `RabitProvider` config and top-level layout
- [src/components/BuyPanel.tsx](src/components/BuyPanel.tsx) / [SellPanel.tsx](src/components/SellPanel.tsx) — on/off-ramp UI using `useOnRamp()`
- [src/components/GoogleLoginButton.tsx](src/components/GoogleLoginButton.tsx) — OAuth hand-off to `core.authenticateOAuth`
- [src/components/SmartAccountPanel.tsx](src/components/SmartAccountPanel.tsx) — direct use of `@rabit/evm.createSmartAccount`
