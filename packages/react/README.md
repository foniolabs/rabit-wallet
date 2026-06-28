# @rabit/react

React SDK for the **Rabit embedded wallet** — drop-in components and hooks that give your dApp a non-custodial wallet with web2-style sign-in. No MetaMask, no Phantom, no extension popups, no deep-linking.

```bash
npm i @rabit/react @rabit/evm @rabit/solana
```

## What you get

- **Email + Google sign-in** that generates a non-custodial wallet behind the scenes (2-of-3 Shamir split — server can't move funds).
- **EVM + Solana** keys derived from a single BIP-39 seed.
- **Drop-in dashboard** (`<RabitDashboard />`) with balance, send, swap, on/off-ramp, network switching, settings, and security pages.
- **Brand-themable** — pass colors and the entire UI rebrands.
- **PIN protection** with rate-limited unlock and recovery flow.
- **ERC-4337 smart accounts** when you supply a bundler URL.
- **Token swaps** via Jupiter (Solana) and LiFi (EVM) — fully keyless.

## 30-second quickstart

```tsx
import { RabitProvider, WalletButton } from '@rabit/react';
import { PRESET_EVM_CHAINS, ETHEREUM_SEPOLIA } from '@rabit/evm';
import { PRESET_SOLANA_CHAINS } from '@rabit/solana';

export default function App() {
  return (
    <RabitProvider
      config={{
        projectId: 'your-project-id',
        apiKey: 'your-rabit-api-key',
        apiBaseUrl: 'https://api.your-domain.com',
        app: { name: 'My dApp' },
        evmChains: PRESET_EVM_CHAINS,
        defaultEvmChainId: ETHEREUM_SEPOLIA.id,
        solanaChains: PRESET_SOLANA_CHAINS,
        defaultSolanaCluster: 'devnet',
        authMethods: ['email', 'google'],
        theme: {
          colors: { primary: '#6366f1' },
          borderRadius: 'medium',
        },
      }}
    >
      <header>
        <WalletButton />
      </header>
      {/* ...your app... */}
    </RabitProvider>
  );
}
```

That's it. `<WalletButton />` shows **Sign in** when signed out and opens the **`<RabitDashboard />`** drawer when clicked.

## Composing your own UI

The dashboard is one option — every primitive is exported separately, so you can compose your own:

```tsx
import {
  // hooks
  useAuth, useWallet, useBalances, useSendToken, useSwap,
  useContractRead, useContractWrite, useSignMessage,
  useNetworkStatus, useActivity, usePortfolioTotal,
  useChains, useSolanaChains, useTheme,

  // components
  AuthModal, WalletButton, RabitDashboard,
  TokenList, NetworkSwitcher, SwapPanel, ActivityFeed,
  PortfolioTotal, PrivateKeyExport,
  PinSetup, PinUnlock, RecoveryUnlock,
  TransactionPreview,
} from '@rabit/react';
```

### Sign in with code

```tsx
const { sendOTP, verifyOTP, loginWithOAuth, isAuthenticated, user } = useAuth();

await sendOTP('alice@example.com');
await verifyOTP('alice@example.com', '123456', { displayName: 'Alice' });
```

### Send tokens

```tsx
const { balances } = useBalances();
const { send } = useSendToken();

const ethToken = balances.find((b) => b.symbol === 'ETH');
await send({ token: ethToken!, to: '0xabc…', amount: '0.01' });
```

### Sign a message (EVM personal_sign or Solana ed25519)

```tsx
const { signMessage } = useSignMessage();
const { signature } = await signMessage('Sign in to MyApp');
```

### Read/write a contract — with friendly approval UX

```tsx
import { ERC20_ABI, parseUnits } from '@rabit/evm';

const symbol = useContractRead<string>({
  address: '0x…', abi: ERC20_ABI, functionName: 'symbol',
});

const { write } = useContractWrite();
await write({
  address: '0x…',
  abi: ERC20_ABI,
  functionName: 'approve',
  args: ['0xspender', parseUnits('100', 6)],
});
```

Pair with `<TransactionPreview />` to show the user a Stripe-style approval card before signing — no raw hex.

### Swap (Jupiter for Solana, LiFi for EVM)

```tsx
const { getQuote, execute } = useSwap();
const quote = await getQuote({ from: usdc, to: eth, amount: '10' });
await execute();
```

## Branding

Every component reads from `useTheme()`. Override any color in `RabitConfig.theme.colors`:

```ts
theme: {
  colors: {
    primary: '#0F766E',
    secondary: '#14B8A6',
    background: '#FFFFFF',
    surface: '#FAFAFA',
    border: '#E5E5E5',
    text: '#0A0A0A',
    textSecondary: '#6B7280',
  },
  borderRadius: 'large',  // 'none' | 'small' | 'medium' | 'large'
  fonts: {
    body: 'Inter, system-ui, sans-serif',
    monospace: '"JetBrains Mono", monospace',
  },
}
```

## Architecture (one paragraph)

A 12-word BIP-39 seed is generated **in the user's browser**, split into 3 Shamir shares (any 2 reconstruct the seed). Share 1 lives encrypted in IndexedDB on the device, share 2 on Rabit's API, share 3 is the user's recovery key. EVM (secp256k1) and Solana (ed25519) keys derive from the same seed. The server only ever sees one of three shares — mathematically zero information about the seed without share 1 or 3. Private keys live in browser memory only while the wallet is unlocked, never on disk, never on the wire.

## Run the demo locally

The repo includes a working Vite example:

```bash
git clone https://github.com/web3normad/rabit
cd rabit
pnpm install
pnpm --filter @rabit/api db:migrate
pnpm --filter @rabit/api dev          # backend (Postgres + Resend + Google)
pnpm --filter vite-react-example dev  # the demo at localhost:3012
```

## Scaffold a new project

```bash
npx create-rabit-app my-app
```

Picks Vite or Next.js, scaffolds the full sign-in + dashboard.

## License

MIT
