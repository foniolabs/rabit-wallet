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
    '@rabit/keys',
    '@solana/web3.js',
    '@solana/spl-token',
    '@noble/ed25519',
  ],
})
