import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/types.ts'],
  format: ['cjs', 'esm'],
  // Inline the @rabit/* type declarations too, so the published package needs
  // no @rabit/* dependencies for either runtime OR types.
  dts: { resolve: [/^@rabit\//] },
  splitting: false,
  sourcemap: true,
  clean: true,
  // Bundle the internal @rabit/* packages IN so `rabitwallet` is a single
  // self-contained package that can be published without the @rabit npm org.
  noExternal: [/^@rabit\//],
  // Keep heavy third-party libs external (declared as dependencies) to avoid
  // duplicate instances of react / viem / @solana in consumer apps.
  external: [
    'react',
    'react-dom',
    'viem',
    'permissionless',
    '@solana/web3.js',
    '@solana/spl-token',
    '@noble/curves',
    '@noble/hashes',
    '@noble/secp256k1',
    '@scure/bip32',
    '@scure/bip39',
    'eventemitter3',
  ],
  banner: {
    js: '"use client";',
  },
  esbuildOptions(options) {
    options.jsx = 'automatic';
  },
});
