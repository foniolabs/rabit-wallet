// Blockchain & network types
import type { Address } from 'viem';
import type { RabitId, Metadata } from './base.js';

/**
 * Chain and network related types
 */

/**
 * Supported chain IDs
 */
export type ChainId = number;

/**
 * Native currency information
 */
export interface NativeCurrency {
  /**
   * Currency name (e.g., "Ether")
   */
  name: string;
  
  /**
   * Currency symbol (e.g., "ETH")
   */
  symbol: string;
  
  /**
   * Number of decimals
   */
  decimals: number;
}

/**
 * Block explorer configuration
 */
export interface BlockExplorer {
  /**
   * Explorer name
   */
  name: string;
  
  /**
   * Base URL
   */
  url: string;
  
  /**
   * API URL if available
   */
  apiUrl?: string;
}

/**
 * RPC endpoint configuration
 */
export interface RpcEndpoint {
  /**
   * RPC URL
   */
  url: string;
  
  /**
   * Weight for load balancing
   */
  weight?: number;
  
  /**
   * Whether this is a fallback endpoint
   */
  fallback?: boolean;
}

/**
 * Chain configuration
 */
export interface Chain extends Metadata {
  /**
   * Unique chain identifier
   */
  id: ChainId;
  
  /**
   * Chain name
   */
  name: string;
  
  /**
   * Short chain name/slug
   */
  slug: string;
  
  /**
   * Native currency
   */
  nativeCurrency: NativeCurrency;
  
  /**
   * RPC endpoints
   */
  rpcUrls: {
    default: RpcEndpoint[];
    public?: RpcEndpoint[];
  };
  
  /**
   * Block explorers
   */
  blockExplorers?: {
    default: BlockExplorer;
    [key: string]: BlockExplorer;
  };
  
  /**
   * Whether this is a testnet
   */
  testnet?: boolean;
  
  /**
   * Parent chain ID if this is an L2
   */
  parentChainId?: ChainId;
  
  /**
   * Chain type
   */
  type?: 'mainnet' | 'testnet' | 'devnet';
  
  /**
   * Layer type
   */
  layer?: 'L1' | 'L2' | 'L3';
  
  /**
   * Custom properties
   */
  custom?: Record<string, unknown>;
}

/**
 * Chain switch request
 */
export interface ChainSwitchRequest {
  /**
   * Target chain ID
   */
  chainId: ChainId;
  
  /**
   * Chain configuration to add if not present
   */
  chain?: Chain;
}

/**
 * Add chain request
 */
export interface AddChainRequest {
  /**
   * Chain to add
   */
  chain: Chain;
  
  /**
   * Whether to switch to this chain after adding
   */
  switchAfterAdd?: boolean;
}

/**
 * Network status
 */
export interface NetworkStatus {
  /**
   * Current chain ID
   */
  chainId: ChainId;
  
  /**
   * Whether network is connected
   */
  isConnected: boolean;
  
  /**
   * Current block number
   */
  blockNumber?: bigint;
  
  /**
   * Latest block timestamp
   */
  blockTimestamp?: bigint;
  
  /**
   * Network latency in milliseconds
   */
  latency?: number;
  
  /**
   * Gas price information
   */
  gasPrice?: {
    standard: bigint;
    fast: bigint;
    instant: bigint;
  };
}

/**
 * Multi-chain configuration
 */
export interface MultiChainConfig {
  /**
   * Available chains
   */
  chains: Chain[];
  
  /**
   * Default chain
   */
  defaultChainId?: ChainId;
  
  /**
   * Whether to automatically switch chains
   */
  autoSwitch?: boolean;
  
  /**
   * Whether to add unknown chains automatically
   */
  autoAddChains?: boolean;
}