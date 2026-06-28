'use client';

import { WalletButton, useAuth } from 'rabitwallet';

export default function Home() {
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
        <strong>__APP_NAME__</strong>
        <WalletButton />
      </header>

      <section
        style={{
          maxWidth: 720,
          margin: '0 auto',
          padding: '48px 20px',
          textAlign: 'center',
        }}
      >
        <h1 style={{ fontSize: 32, margin: 0, letterSpacing: '-0.02em' }}>
          {isAuthenticated
            ? `Welcome back, ${user?.displayName ?? 'friend'} 👋`
            : 'Welcome to __APP_NAME__'}
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
