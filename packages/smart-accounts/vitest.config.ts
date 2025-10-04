import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts'],
   include: [
  'tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
  'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8', // or 'istanbul' if you switched
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        'dist/',
      ],
      include: ['src/**/*.{js,ts,jsx,tsx}'],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@/types': resolve(__dirname, './src/types'),
      '@/utils': resolve(__dirname, './src/utils'),
      '@/clients': resolve(__dirname, './src/clients'),
      '@/signers': resolve(__dirname, './src/signers'),
      '@/providers': resolve(__dirname, './src/providers'),
      '@/implementations': resolve(__dirname, './src/implementations'),
    },
  },
  // Add this for pnpm workspace compatibility
  server: {
    fs: {
      allow: ['..']
    }
  }
});