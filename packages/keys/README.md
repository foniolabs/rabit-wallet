# @rabit/keys

Split-key management (Shamir 2-of-3) for the [Rabit embedded wallet SDK](https://github.com/foniolabs/rabit-wallet).

```bash
npm i @rabit/keys
```

Handles:

- BIP-39 mnemonic + BIP-44 HD derivation (EVM secp256k1, Solana ed25519).
- 2-of-3 Shamir secret sharing (GF(256)).
- AES-256-GCM encryption + PBKDF2-derived PIN vault.
- IndexedDB-backed device-share storage.
- Private-key export in MetaMask / Phantom / Solana CLI formats.

Most apps consume this transitively via [`@rabit/react`](https://www.npmjs.com/package/@rabit/react). Use this package directly only if you're integrating in a non-React context or building a custom auth shell.

## License

MIT
