# @rabit/evm

EVM helpers for the [Rabit embedded wallet SDK](https://github.com/foniolabs/rabit-wallet).

```bash
npm i @rabit/evm
```

What's inside:

- 5 preset chains × {mainnet, testnet} (Ethereum, Polygon, Arbitrum, Optimism, Base).
- ERC-20 token registry + balance + transfer helpers.
- ERC-4337 smart-account integration (Kernel / Safe / LightAccount via `permissionless`).
- Generic contract `read` / `write` helpers and `personal_sign` / EIP-712.
- LiFi swap quote + execute (no API key required).

```ts
import {
  PRESET_EVM_CHAINS, ETHEREUM_SEPOLIA,
  fetchEvmBalances, sendEvmErc20,
  readEvmContract, writeEvmContract, ERC20_ABI,
  createSmartAccount, createSmartAccountResolver,
  getLiFiQuote, executeLiFiQuote,
} from '@rabit/evm';
```

For React apps, use **[`@rabit/react`](https://www.npmjs.com/package/@rabit/react)** — it wraps these in hooks and components.

## License

MIT
