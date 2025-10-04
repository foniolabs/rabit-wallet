import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  target: 'es2020',
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  minify: false,
  treeshake: true,
  external: [
    // React ecosystem (peer dependencies)
    'react',
    'react-dom',
    '@tanstack/react-query',
    'wagmi',
    
    // Optional integrations (peer dependencies)
    '@web3auth/modal',
    '@web3auth/base',
    '@web3auth/auth',
    '@web3auth/account-abstraction-provider',
    'magic-sdk',
    
    // Core dependencies that should be bundled are not listed here
    // viem, @noble/curves, @noble/hashes will be bundled
  ],
  banner: {
    js: '"use client";'
  },
  esbuildOptions(options) {
    options.conditions = ['module'];
    options.mainFields = ['module', 'main'];
  },
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.js' : '.mjs',
    };
  },
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  // Only include platform-specific code
  platform: 'neutral',
  
  // Bundle analyzer (optional)
  // metafile: true,
  
  // Additional configuration for better tree-shaking
  experimentalDts: true,
});