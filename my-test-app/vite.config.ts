import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  // The Solana SDK uses Buffer; pre-bundle the polyfill so it's ready in dev.
  optimizeDeps: { include: ['buffer'] },
});
