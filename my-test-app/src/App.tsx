import { RabitProvider, WalletButton, useAuth } from '@rabit/react';
import { PRESET_EVM_CHAINS, ETHEREUM_SEPOLIA } from '@rabit/evm';
import { PRESET_SOLANA_CHAINS } from '@rabit/solana';

const env = import.meta.env;

export function App() {
  return (
    <RabitProvider
      config={{
        projectId: env.VITE_RABIT_PROJECT_ID ?? 'dev-project',
        apiKey: env.VITE_RABIT_API_KEY ?? 'dev-api-key',
        apiBaseUrl: env.VITE_RABIT_API_BASE_URL ?? 'http://localhost:3001',
        app: { name: 'my-test-app' },
        evmChains: PRESET_EVM_CHAINS,
        defaultEvmChainId: ETHEREUM_SEPOLIA.id,
        solanaChains: PRESET_SOLANA_CHAINS,
        defaultSolanaCluster: 'devnet',
        authMethods: ['email', 'google'],
        bundlerUrl: env.VITE_BUNDLER_URL,
        paymasterUrl: env.VITE_PAYMASTER_URL,
        theme: {
          colors: { primary: '#6366f1', secondary: '#06b6d4' },
          borderRadius: 'medium',
        },
      }}
    >
      <Shell />
    </RabitProvider>
  );
}

function Shell() {
  const { isAuthenticated, user } = useAuth();
  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#fafafa',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      <header
        style={{
          padding: '12px 20px',
          background: '#fff',
          borderBottom: '1px solid #eee',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <strong>my-test-app</strong>
        <WalletButton />
      </header>

      <section style={{ maxWidth: 720, margin: '0 auto', padding: '48px 20px', textAlign: 'center' }}>
        <h1 style={{ fontSize: 32, margin: 0, letterSpacing: '-0.02em' }}>
          {isAuthenticated ? `Welcome back, ${user?.displayName ?? 'friend'} 👋` : 'Welcome to my-test-app'}
        </h1>
        <p style={{ color: '#666', fontSize: 15, lineHeight: 1.6, marginTop: 12 }}>
          {isAuthenticated
            ? 'Your wallet is ready. Click the avatar to see balances, send tokens, swap, or buy crypto.'
            : 'Click "Sign in" to create a non-custodial EVM + Solana wallet — no extension, no seed phrase to remember.'}
        </p>
      </section>
    </main>
  );
}
