import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { SmartAccountConfig, SmartAccountState } from '../types';
import { useWalletContext } from './WalletProvider';

// Temporary stub hook until @rabit/smart-accounts is ready
interface SmartAccountStubReturn {
  createAccount: () => Promise<{ address: string; isDeployed: boolean }>;
  sendUserOperation: (calls: any[]) => Promise<string>;
  batchTransactions: (transactions: any[]) => Promise<string>;
  account: { address: string } | null;
  isDeployed: boolean;
  isLoading: boolean;
  error: Error | null;
}

function useSmartAccountStub(_config: any): SmartAccountStubReturn {
  return {
    createAccount: async () => ({
      address: '0x1234567890123456789012345678901234567890',
      isDeployed: false,
    }),
    sendUserOperation: async (calls: any[]) => {
      console.log('Sending user operation:', calls);
      return '0xhash123';
    },
    batchTransactions: async (transactions: any[]) => {
      console.log('Batch transactions:', transactions);
      return '0xbatchhash123';
    },
    account: null,
    isDeployed: false,
    isLoading: false,
    error: null,
  };
}

interface SmartAccountContextType extends SmartAccountState {
  createSmartAccount: () => Promise<void>;
  sendUserOperation: (calls: any[]) => Promise<string>;
  batchTransactions: (transactions: any[]) => Promise<string>;
}

const SmartAccountContext = createContext<SmartAccountContextType | null>(null);

interface SmartAccountProviderProps {
  config?: SmartAccountConfig;
  children: ReactNode;
}

export function SmartAccountProvider({ config, children }: SmartAccountProviderProps) {
  const { address, isConnected } = useWalletContext();
  const [smartAccountState, setSmartAccountState] = useState<SmartAccountState>({
    address: null,
    isDeployed: false,
    isLoading: false,
    error: null,
  });

  // Use stub implementation for now
  const {
    createAccount,
    sendUserOperation: sendUO,
    batchTransactions: batch,
    account,
    isDeployed,
    isLoading: smartAccountLoading,
    error: smartAccountError,
  } = useSmartAccountStub({
    owner: address,
    bundlerUrl: config?.bundlerUrl,
    paymasterUrl: config?.paymasterUrl,
    factoryAddress: config?.factory,
    implementationAddress: config?.implementation,
    sponsorUserOperations: config?.sponsorGas,
  });

  // Sync smart account state
  useEffect(() => {
    setSmartAccountState({
      address: account?.address || null,
      isDeployed: isDeployed || false,
      isLoading: smartAccountLoading || false,
      error: smartAccountError || null,
    });
  }, [account, isDeployed, smartAccountLoading, smartAccountError]);

  // Auto-create smart account if enabled
  useEffect(() => {
    if (isConnected && address && config?.autoCreate && !account) {
      createSmartAccount();
    }
  }, [isConnected, address, config?.autoCreate, account]);

  const createSmartAccount = async () => {
    try {
      await createAccount();
    } catch (error) {
      console.error('Failed to create smart account:', error);
    }
  };

  const sendUserOperation = async (calls: any[]) => {
    try {
      const hash = await sendUO(calls);
      return hash;
    } catch (error) {
      console.error('Failed to send user operation:', error);
      throw error;
    }
  };

  const batchTransactions = async (transactions: any[]) => {
    try {
      const hash = await batch(transactions);
      return hash;
    } catch (error) {
      console.error('Failed to batch transactions:', error);
      throw error;
    }
  };

  const value: SmartAccountContextType = {
    ...smartAccountState,
    createSmartAccount,
    sendUserOperation,
    batchTransactions,
  };

  return (
    <SmartAccountContext.Provider value={value}>
      {children}
    </SmartAccountContext.Provider>
  );
}

export function useSmartAccountContext() {
  const context = useContext(SmartAccountContext);
  if (!context) {
    throw new Error('useSmartAccountContext must be used within a SmartAccountProvider');
  }
  return context;
}
