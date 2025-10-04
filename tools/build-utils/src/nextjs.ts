import { buildPackage } from './build.js';
import type { BuildOptions } from './types.js';

/**
 * Build configuration optimized for Next.js applications
 */
export async function buildNextJSPackage(options: BuildOptions = {}) {
  const nextJSDefaults: BuildOptions = {
    platform: 'browser',
    target: 'es2020',
    format: 'esm',
    external: [
      'next',
      'next/*',
      'react',
      'react-dom',
      'react/jsx-runtime',
      // Next.js specific externals
      'next/router',
      'next/head',
      'next/image',
      'next/link',
      'next/script',
      'next/dynamic',
      'next/app',
      'next/document',
      'next/navigation',
      // Common Next.js dependencies
      '@next/font',
      '@next/font/*',
      'next/font',
      'next/font/*',
      // Web3 externals for Next.js
      'wagmi',
      'viem',
      '@tanstack/react-query',
      '@walletconnect/web3wallet',
      '@web3modal/wagmi',
      'ethers',
      'web3',
    ],
    ...options,
  };

  return buildPackage(nextJSDefaults);
}

/**
 * Build configuration for Next.js components/UI packages
 */
export async function buildNextJSComponents(options: BuildOptions = {}) {
  const componentDefaults: BuildOptions = {
    platform: 'browser',
    target: 'es2020',
    format: 'both', // Support both ESM and CJS for better compatibility
    bundle: false, // Don't bundle, let Next.js handle it
    external: [
      'next',
      'next/*',
      'react',
      'react-dom',
      'react/jsx-runtime',
      // CSS-in-JS libraries commonly used with Next.js
      'styled-components',
      '@emotion/react',
      '@emotion/styled',
      'tailwindcss',
      // Common UI libraries
      '@headlessui/react',
      '@radix-ui/react',
      'framer-motion',
    ],
    ...options,
  };

  return buildPackage(componentDefaults);
}

/**
 * Build configuration for Next.js API routes/server packages
 */
export async function buildNextJSAPI(options: BuildOptions = {}) {
  const apiDefaults: BuildOptions = {
    platform: 'node',
    target: 'es2022',
    format: 'esm',
    external: [
      'next',
      'next/*',
      // Node.js built-ins
      'fs',
      'path',
      'crypto',
      'http',
      'https',
      'stream',
      'util',
      'events',
      'buffer',
      'url',
      'querystring',
      // Common API dependencies
      'cors',
      'helmet',
      'express',
      'fastify',
    ],
    ...options,
  };

  return buildPackage(apiDefaults);
}