# rabitwallet-native (scaffold)

The embedded Rabit wallet for **React Native & Expo** — the same non-custodial,
email-sign-in wallet as the web SDK, with no deep-linking to an external wallet app.

> **Status: scaffold.** The core, hooks, storage adapter, provider, and starter
> components are wired. Finish + test in a real RN environment before publishing.
> It's currently excluded from the monorepo build (React Native isn't installed
> in CI).

## Why this works

Rabit's `@rabit/core`, `@rabit/keys`, `@rabit/evm`, and `@rabit/solana` are
platform-agnostic — only the UI and storage were web-coupled. This package:

1. Injects a **synchronous MMKV** `StorageAdapter` (matches the core's contract —
   no async refactor).
2. Adds RN **crypto/Buffer polyfills**.
3. Provides an RN **`RabitProvider`** + `useAuth`/`useWallet` that drive the same
   `RabitCore`, so behavior matches web exactly.
4. Ships RN-native **`WalletButton`** and **`AuthModal`** (View/Pressable/Modal).

## Install (in your RN/Expo app)

```bash
npm install rabitwallet-native \
  react-native-mmkv react-native-get-random-values buffer
# iOS: npx pod-install
```

## Set up

Import the polyfills **first**, in your app entry:

```tsx
// index.js — before anything else
import 'rabitwallet-native/polyfills'
```

Wrap your app:

```tsx
import { RabitProvider, WalletButton, PRESET_EVM_CHAINS, ETHEREUM_SEPOLIA, PRESET_SOLANA_CHAINS } from 'rabitwallet-native'

export default function App() {
  return (
    <RabitProvider
      config={{
        projectId: process.env.EXPO_PUBLIC_RABIT_PROJECT_ID!,
        apiKey: process.env.EXPO_PUBLIC_RABIT_API_KEY!,
        apiBaseUrl: process.env.EXPO_PUBLIC_RABIT_API_BASE_URL!,
        app: { name: 'My App' },
        evmChains: PRESET_EVM_CHAINS,
        defaultEvmChainId: ETHEREUM_SEPOLIA.id,
        solanaChains: PRESET_SOLANA_CHAINS,
        defaultSolanaCluster: 'devnet',
        authMethods: ['email', 'google'],
      }}
    >
      <WalletButton />
    </RabitProvider>
  )
}
```

## To finish this scaffold

- **Add it to the workspace** (remove from `pnpm-workspace.yaml` ignore) and
  install `react-native` as a devDependency so it type-checks/builds.
- **Port the remaining hooks** (`useBalances`, `useSendToken`, `useOnRamp`,
  `useSwap`, `useSignMessage`, …) from `packages/react/src/hooks` — they're
  DOM-free, so they mostly drop in.
- **Google sign-in**: obtain an id token via
  `@react-native-google-signin/google-signin`, pass it to `loginWithGoogle`.
- **Build more components** (dashboard, send, buy) with RN primitives.
- **Test on device** (iOS + Android) — MMKV, crypto, and Solana Buffer paths
  can only be verified in a real RN runtime.
