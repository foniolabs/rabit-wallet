export interface WalletConfig {
  autoConnect?: boolean;
  chains?: number[];
  connectors?: string[];
}

export interface WalletState {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  chainId: number | null;
  error: Error | null;
  recentConnector: string | null;
}

export interface ConnectorInfo {
  id: string;
  name: string;
  icon?: string;
  ready: boolean;
  popular?: boolean;
}
