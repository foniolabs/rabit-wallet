import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 3012 },
  // The Solana SDK uses Buffer; pre-bundle it so polyfills are ready in dev.
  optimizeDeps: {
    include: ['buffer'],
  },
});
