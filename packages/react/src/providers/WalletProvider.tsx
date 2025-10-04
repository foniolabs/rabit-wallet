import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { useConnect as useWagmiConnect, useAccount, useDisconnect } from 'wagmi';
import { WalletConfig, WalletState } from '../types';
import { walletReducer, initialWalletState } from '../store/walletStore';
import { setStorageItem, removeStorageItem } from '../utils/storage';

interface WalletContextType extends WalletState {
  connect: (connectorId: string) => Promise<void>;
  disconnect: () => Promise<void>;
  switchNetwork: (chainId: number) => Promise<void>;
  setRecentConnector: (connectorId: string) => void;
}

const WalletContext = createContext<WalletContextType | null>(null);

interface WalletProviderProps {
  config?: WalletConfig;
  children: ReactNode;
}

export function WalletProvider({ config, children }: WalletProviderProps) {
  const [state, dispatch] = useReducer(walletReducer, initialWalletState);
  const { connectAsync, connectors } = useWagmiConnect();
  const { address, isConnected, chainId } = useAccount();
  const { disconnectAsync } = useDisconnect();

  // Update state when wagmi account changes
  useEffect(() => {
    dispatch({
      type: 'SET_ACCOUNT',
      payload: { address: address || null, isConnected, chainId: chainId || null }
    });
  }, [address, isConnected, chainId]);

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (config?.autoConnect && state.recentConnector && !isConnected) {
      const connector = connectors.find(c => c.id === state.recentConnector);
      if (connector) {
        connect(state.recentConnector).catch(() => {
          // Silent fail for auto-connect
        });
      }
    }
  }, [config?.autoConnect, state.recentConnector, isConnected, connectors]);

  const connect = async (connectorId: string) => {
    try {
      dispatch({ type: 'SET_CONNECTING', payload: true });
      
      const connector = connectors.find(c => c.id === connectorId);
      if (!connector) throw new Error('Connector not found');

      await connectAsync({ connector });
      
      setRecentConnector(connectorId);
      dispatch({ type: 'SET_CONNECTING', payload: false });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error as Error });
      dispatch({ type: 'SET_CONNECTING', payload: false });
    }
  };

  const disconnect = async () => {
    try {
      await disconnectAsync();
      dispatch({ type: 'RESET_STATE' });
      removeStorageItem('rabit.recentConnector');
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error as Error });
    }
  };

  const switchNetwork = async (chainId: number) => {
    try {
      // This would need to be implemented with wagmi's switchChain
      console.log('Switch network to:', chainId);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error as Error });
    }
  };

  const setRecentConnector = (connectorId: string) => {
    setStorageItem('rabit.recentConnector', connectorId);
    dispatch({ type: 'SET_RECENT_CONNECTOR', payload: connectorId });
  };

  const value: WalletContextType = {
    ...state,
    connect,
    disconnect,
    switchNetwork,
    setRecentConnector,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWalletContext() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWalletContext must be used within a WalletProvider');
  }
  return context;
}
