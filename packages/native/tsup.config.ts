import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: { resolve: [/^@rabit\//] },
  splitting: false,
  clean: true,
  // Bundle the internal @rabit/* core in; keep RN + native modules external.
  noExternal: [/^@rabit\//],
  external: [
    'react',
    'react-native',
    'react-native-mmkv',
    'react-native-get-random-values',
    'buffer',
    'viem',
    '@solana/web3.js',
    '@solana/spl-token',
    '@noble/curves',
    '@noble/hashes',
    '@noble/secp256k1',
    '@scure/bip32',
    '@scure/bip39',
    'eventemitter3',
  ],
  esbuildOptions(options) {
    options.jsx = 'automatic'
  },
})
