import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: [
    'react',
    'react-dom',
    '@rabit/core',
    '@rabit/types',
    '@rabit/evm',
    '@rabit/solana',
    '@rabit/onramp',
  ],
  banner: {
    js: '"use client";'
  },
  esbuildOptions(options) {
    options.jsx = 'automatic';
  },
});
