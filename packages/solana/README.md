# @rabit/solana

Solana helpers for the [Rabit embedded wallet SDK](https://github.com/web3normad/rabit).

```bash
npm i @rabit/solana
```

What's inside:

- Preset chain configs for mainnet-beta, devnet, testnet.
- SPL token registry + balance + transfer (auto-creates ATAs).
- Memo program write + recent-memo read.
- ed25519 message signing (Phantom-compatible base58 signature).
- Jupiter v6 swap quote + execute (no API key required).

```ts
import {
  PRESET_SOLANA_CHAINS, SOLANA_DEVNET,
  fetchSolanaBalances, sendSolanaSplToken,
  signSolanaMessage,
  getJupiterQuote, executeJupiterSwap,
} from '@rabit/solana';
```

For React apps, use **[`@rabit/react`](https://www.npmjs.com/package/@rabit/react)** — it wraps these in hooks and components.

## License

MIT
