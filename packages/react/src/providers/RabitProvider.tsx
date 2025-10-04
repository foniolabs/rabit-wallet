import React, { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { RabitConfig } from '../types';
import { WalletProvider } from './WalletProvider';
import { SmartAccountProvider } from './SmartAccountProvider';
import { AuthProvider } from './AuthProvider';
import { ThemeProvider } from './ThemeProvider';
import { ModalProvider } from './ModalProvider';

interface RabitProviderProps {
  config: RabitConfig;
  children: ReactNode;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      refetchOnWindowFocus: false,
      staleTime: 30000,
    },
    mutations: {
      retry: 1,
    },
  },
});

export function RabitProvider({ config, children }: RabitProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config.wagmi}>
        <ThemeProvider theme={config.theme}>
          <ModalProvider>
            <AuthProvider config={config.auth}>
              <WalletProvider config={config.wallet}>
                <SmartAccountProvider config={config.smartAccount}>
                  {children}
                </SmartAccountProvider>
              </WalletProvider>
            </AuthProvider>
          </ModalProvider>
        </ThemeProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}
