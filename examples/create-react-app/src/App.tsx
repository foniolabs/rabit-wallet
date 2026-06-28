import { RabitProvider, WalletButton, useAuth } from '@rabit/react';
import { PRESET_EVM_CHAINS, ETHEREUM_SEPOLIA } from '@rabit/evm';
import { PRESET_SOLANA_CHAINS } from '@rabit/solana';

const PROJECT_ID = process.env.REACT_APP_RABIT_PROJECT_ID ?? 'dev-project';
const API_KEY = process.env.REACT_APP_RABIT_API_KEY ?? 'dev-api-key';
const API_BASE_URL = process.env.REACT_APP_RABIT_API_BASE_URL ?? 'http://localhost:3001';

export function App() {
  return (
    <RabitProvider
      config={{
        projectId: PROJECT_ID,
        apiKey: API_KEY,
        apiBaseUrl: API_BASE_URL,
        app: { name: 'CRA Example' },
        evmChains: PRESET_EVM_CHAINS,
        defaultEvmChainId: ETHEREUM_SEPOLIA.id,
        solanaChains: PRESET_SOLANA_CHAINS,
        defaultSolanaCluster: 'devnet',
        authMethods: ['email', 'google'],
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
        <strong>Rabit · Create React App</strong>
        <WalletButton />
      </header>

      <section style={{ maxWidth: 720, margin: '0 auto', padding: '48px 20px', textAlign: 'center' }}>
        <h1 style={{ fontSize: 32, margin: 0, letterSpacing: '-0.02em' }}>
          {isAuthenticated
            ? `Welcome back, ${user?.displayName ?? 'friend'} 👋`
            : 'Embedded wallet in a Create React App'}
        </h1>
        <p style={{ color: '#666', marginTop: 12 }}>
          Sign in with email or Google using the button in the top-right — no extension, no seed phrase.
        </p>
      </section>
    </main>
  );
}
