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
    'wagmi',
    'viem',
    '@tanstack/react-query',
    'framer-motion',
    '@headlessui/react',
    '@heroicons/react',
    'react-hot-toast',
    'zustand',
    'clsx'
  ],
  banner: {
    js: '"use client";'
  },
  esbuildOptions(options) {
    options.jsx = 'automatic';
  },
  onSuccess: async () => {
    console.log('✅ Build completed successfully!');
  }
});