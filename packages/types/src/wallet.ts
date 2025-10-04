// Wallet connector types
import type { Address, Hash, Hex } from 'viem';
import type { RabitId, Metadata, ConnectionStatus, EventEmitter, Platform } from './base.js';
import type { ChainId, Chain } from './chain.js';

/**
 * Wallet and connector related types
 */

/**
 * Wallet types supported by Rabit
 */
export type WalletType = 
  | 'injected'
  | 'walletconnect'
  | 'coinbase'
  | 'metamask'
  | 'rainbow'
  | 'trust'
  | 'safe'
  | 'ledger'
  | 'trezor'
  | 'email'
  | 'social'
  | 'passkey'
  | 'sms'
  | 'custom';

/**
 * Wallet connection method
 */
export type ConnectionMethod = 
  | 'extension'
  | 'mobile'
  | 'qr'
  | 'deeplink'
  | 'embedded'
  | 'popup'
  | 'redirect';

/**
 * Wallet features/capabilities
 */
export interface WalletFeatures {
  /**
   * Supports signing messages
   */
  signMessage: boolean;
  
  /**
   * Supports signing typed data (EIP-712)
   */
  signTypedData: boolean;
  
  /**
   * Supports personal sign
   */
  personalSign: boolean;
  
  /**
   * Supports switching chains
   */
  switchChain: boolean;
  
  /**
   * Supports adding chains
   */
  addChain: boolean;
  
  /**
   * Supports watching assets
   */
  watchAsset: boolean;
  
  /**
   * Supports batch transactions
   */
  batchTransactions: boolean;
  
  /**
   * Supports session management
   */
  sessions: boolean;
  
  /**
   * Is a smart contract wallet
   */
  isSmartWallet: boolean;
  
  /**
   * Supports account abstraction
   */
  accountAbstraction: boolean;
  
  /**
   * Supports gasless transactions
   */
  gaslessTransactions: boolean;
}

/**
 * Wallet availability check
 */
export interface WalletAvailability {
  /**
   * Whether wallet is available on current platform
   */
  isAvailable: boolean;
  
  /**
   * Whether wallet is installed
   */
  isInstalled: boolean;
  
  /**
   * Whether wallet is ready to connect
   */
  isReady: boolean;
  
  /**
   * Download/install URL if not available
   */
  downloadUrl?: string;
  
  /**
   * Deep link scheme for mobile
   */
  deepLinkScheme?: string;
  
  /**
   * Supported platforms
   */
  platforms: Platform[];
}

/**
 * Connection options
 */
export interface ConnectOptions {
  /**
   * Preferred connection method
   */
  method?: ConnectionMethod;
  
  /**
   * Target chain ID
   */
  chainId?: ChainId;
  
  /**
   * Whether this is a reconnection attempt
   */
  isReconnecting?: boolean;
  
  /**
   * Custom options for specific connectors
   */
  connectorOptions?: Record<string, unknown>;
  
  /**
   * Timeout in milliseconds
   */
  timeout?: number;
}

/**
 * Connection result
 */
export interface ConnectResult {
  /**
   * Connected accounts
   */
  accounts: Address[];
  
  /**
   * Current chain ID
   */
  chainId: ChainId;
  
  /**
   * Connection method used
   */
  method: ConnectionMethod;
  
  /**
   * Additional connection data
   */
  data?: Record<string, unknown>;
}

/**
 * Transaction request
 */
export interface TransactionRequest {
  /**
   * Transaction recipient
   */
  to?: Address;
  
  /**
   * Transaction value in wei
   */
  value?: bigint;
  
  /**
   * Transaction data
   */
  data?: Hex;
  
  /**
   * Gas limit
   */
  gas?: bigint;
  
  /**
   * Gas price
   */
  gasPrice?: bigint;
  
  /**
   * Max fee per gas (EIP-1559)
   */
  maxFeePerGas?: bigint;
  
  /**
   * Max priority fee per gas (EIP-1559)
   */
  maxPriorityFeePerGas?: bigint;
  
  /**
   * Transaction nonce
   */
  nonce?: number;
  
  /**
   * Chain ID
   */
  chainId?: ChainId;
}

/**
 * Wallet connector events - fixed to match EventEmitter constraint
 */
export interface WalletConnectorEvents extends Record<string, any[]> {
  connect: [ConnectResult];
  disconnect: [];
  accountsChanged: [Address[]];
  chainChanged: [ChainId];
  error: [Error];
  message: [{ type: string; data: unknown }];
}

/**
 * Base wallet connector interface
 */
export interface WalletConnector extends EventEmitter<WalletConnectorEvents> {
  /**
   * Unique connector identifier
   */
  readonly id: RabitId;
  
  /**
   * Wallet type
   */
  readonly type: WalletType;
  
  /**
   * Connector metadata
   */
  readonly metadata: Metadata;
  
  /**
   * Supported connection methods
   */
  readonly connectionMethods: ConnectionMethod[];
  
  /**
   * Wallet features
   */
  readonly features: WalletFeatures;
  
  /**
   * Current connection status
   */
  readonly status: ConnectionStatus;
  
  /**
   * Check if wallet is available
   */
  isAvailable(): Promise<WalletAvailability>;
  
  /**
   * Connect to wallet
   */
  connect(options?: ConnectOptions): Promise<ConnectResult>;
  
  /**
   * Disconnect from wallet
   */
  disconnect(): Promise<void>;
  
  /**
   * Get connected accounts
   */
  getAccounts(): Promise<Address[]>;
  
  /**
   * Get current chain ID
   */
  getChainId(): Promise<ChainId>;
  
  /**
   * Switch to different chain
   */
  switchChain(chainId: ChainId): Promise<void>;
  
  /**
   * Add a new chain
   */
  addChain(chain: Chain): Promise<void>;
  
  /**
   * Sign a message
   */
  signMessage(message: string | Hex): Promise<Hex>;
  
  /**
   * Sign typed data
   */
  signTypedData(typedData: any): Promise<Hex>;
  
  /**
   * Send transaction
   */
  sendTransaction(transaction: TransactionRequest): Promise<Hash>;
  
  /**
   * Get provider instance
   */
  getProvider(): Promise<any>;
}

/**
 * Wallet session data
 */
export interface WalletSession {
  /**
   * Session ID
   */
  id: string;
  
  /**
   * Connected accounts
   */
  accounts: Address[];
  
  /**
   * Current chain ID
   */
  chainId: ChainId;
  
  /**
   * Wallet connector ID
   */
  connectorId: RabitId;
  
  /**
   * Session expiry timestamp
   */
  expiresAt?: number;
  
  /**
   * Session metadata
   */
  metadata?: Record<string, unknown>;
}

/**
 * Wallet balance information
 */
export interface WalletBalance {
  /**
   * Account address
   */
  address: Address;
  
  /**
   * Chain ID
   */
  chainId: ChainId;
  
  /**
   * Native token balance
   */
  native: {
    value: bigint;
    decimals: number;
    symbol: string;
    formatted: string;
  };
  
  /**
   * Token balances
   */
  tokens?: Array<{
    address: Address;
    value: bigint;
    decimals: number;
    symbol: string;
    name: string;
    formatted: string;
  }>;
}

/**
 * ENS information
 */
export interface ENSData {
  /**
   * ENS name
   */
  name?: string;
  
  /**
   * Avatar URL
   */
  avatar?: string;
  
  /**
   * Primary name
   */
  primaryName?: string;
  
  /**
   * ENS records
   */
  records?: Record<string, string>;
}