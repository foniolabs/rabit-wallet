import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['viem'],
  treeshake: true,
  target: 'es2022',
  outDir: 'dist',
  minify: false,
  bundle: true,
  // Use our tsconfig for the build
  tsconfig: './tsconfig.json'
})