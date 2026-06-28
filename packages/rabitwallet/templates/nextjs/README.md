# __APP_NAME__

A Next.js dApp with the [Rabit](https://github.com/foniolabs/rabit-wallet) embedded wallet pre-wired.

## Getting started

```bash
npm install
cp .env.example .env.local   # optional — defaults to the local dev API
npm run dev
```

Open http://localhost:3000 and click **Sign in** — users get a non-custodial
EVM + Solana wallet via email or Google, no extension or seed phrase.

## Configuration

Set your project credentials in `.env.local` (get them from the Rabit dashboard):

- `NEXT_PUBLIC_RABIT_PROJECT_ID`
- `NEXT_PUBLIC_RABIT_API_KEY`
- `NEXT_PUBLIC_RABIT_API_BASE_URL`

Everything is configured in `app/providers.tsx`. The whole SDK is imported from
the single `rabitwallet` package.
