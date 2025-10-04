import { useWallet } from './useWallet';
import { useConnectors } from 'wagmi';
import { ConnectorInfo } from '../types';

export function useConnect() {
  const { connect, isConnecting, error } = useWallet();
  const connectors = useConnectors();

  const formattedConnectors: ConnectorInfo[] = connectors.map(connector => ({
    id: connector.id,
    name: connector.name,
    icon: connector.icon,
    ready: Boolean(connector.ready), // Fix: ensure boolean type
    popular: ['metamask', 'walletconnect', 'coinbase'].includes(connector.id.toLowerCase()),
  }));

  return {
    connect,
    connectors: formattedConnectors,
    isLoading: isConnecting,
    error,
  };
}
