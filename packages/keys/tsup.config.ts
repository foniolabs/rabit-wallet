import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  target: 'es2022',
  outDir: 'dist',
  tsconfig: './tsconfig.json',
  external: [
    '@rabit/types',
    '@noble/hashes',
    '@noble/curves',
    '@noble/secp256k1',
    '@scure/bip32',
    '@scure/bip39',
  ],
})
