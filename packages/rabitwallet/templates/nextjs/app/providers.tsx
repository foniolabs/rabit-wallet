'use client';

import {
  RabitProvider,
  PRESET_EVM_CHAINS,
  ETHEREUM_SEPOLIA,
  PRESET_SOLANA_CHAINS,
} from 'rabitwallet';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <RabitProvider
      config={{
        projectId: process.env.NEXT_PUBLIC_RABIT_PROJECT_ID ?? 'dev-project',
        apiKey: process.env.NEXT_PUBLIC_RABIT_API_KEY ?? 'dev-api-key',
        apiBaseUrl:
          process.env.NEXT_PUBLIC_RABIT_API_BASE_URL ?? 'http://localhost:3001',
        app: { name: '__APP_NAME__' },
        evmChains: PRESET_EVM_CHAINS,
        defaultEvmChainId: ETHEREUM_SEPOLIA.id,
        solanaChains: PRESET_SOLANA_CHAINS,
        defaultSolanaCluster: 'devnet',
        authMethods: ['email', 'google'],
        bundlerUrl: process.env.NEXT_PUBLIC_BUNDLER_URL,
        paymasterUrl: process.env.NEXT_PUBLIC_PAYMASTER_URL,
        theme: {
          colors: { primary: '#6366f1', secondary: '#06b6d4' },
          borderRadius: 'medium',
        },
      }}
    >
      {children}
    </RabitProvider>
  );
}
