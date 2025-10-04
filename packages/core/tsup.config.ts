import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['@rabit/types', 'viem', 'eventemitter3'],
  treeshake: true,
  target: 'es2022',
  outDir: 'dist',
  tsconfig: './tsconfig.json',
  minify: false,
  bundle: true
});