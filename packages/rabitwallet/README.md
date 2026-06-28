# rabitwallet

> Embedded non-custodial wallet SDK with built-in fiat on/off-ramp — email/Google
> sign-in, split-key (2-of-3 Shamir), EVM + Solana. One install, one import.

## Add to an existing app

```bash
npm install rabitwallet
```

```tsx
import { RabitProvider, WalletButton, PRESET_EVM_CHAINS, ETHEREUM_SEPOLIA } from 'rabitwallet';
import { PRESET_SOLANA_CHAINS } from 'rabitwallet';

export function App() {
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

> Bundlers that strip Node polyfills (Next.js, CRA, sometimes Vite) need `buffer`
> aliased for the browser — the scaffold below sets this up for you.

## Scaffold a new app

```bash
npx rabitwallet init my-dapp
cd my-dapp
npm install
npm run dev
```

Scaffolds a Next.js 14 (App Router) project that depends only on `rabitwallet`.

## Exports

- `rabitwallet` — provider, components, hooks, EVM + Solana chain presets, wallet ops, and the most-used config types.
- `rabitwallet/types` — the complete type catalogue.

This package bundles `@rabit/react`, `@rabit/evm`, `@rabit/solana`, `@rabit/core`,
`@rabit/keys`, `@rabit/onramp`, and `@rabit/types` into one. `react` / `react-dom`
are peer dependencies.
