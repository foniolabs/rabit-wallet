/**
 * Chain and network types for Rabit
 * Supports both EVM and Solana
 */

import type { ChainEcosystem } from './wallet.js';

/**
 * EVM Chain ID
 */
export type ChainId = number;

/**
 * Solana cluster
 */
export type SolanaCluster = 'mainnet-beta' | 'devnet' | 'testnet';

/**
 * Native currency information
 */
export interface NativeCurrency {
  name: string;
  symbol: string;
  decimals: number;
}

/**
 * Block explorer configuration
 */
export interface BlockExplorer {
  name: string;
  url: string;
  apiUrl?: string;
}

/**
 * RPC endpoint configuration
 */
export interface RpcEndpoint {
  url: string;
  weight?: number;
  fallback?: boolean;
}

/**
 * EVM chain configuration
 */
export interface EvmChain {
  ecosystem: 'evm';
  id: ChainId;
  name: string;
  slug: string;
  nativeCurrency: NativeCurrency;
  rpcUrls: {
    default: RpcEndpoint[];
    public?: RpcEndpoint[];
  };
  blockExplorers?: {
    default: BlockExplorer;
    [key: string]: BlockExplorer;
  };
  testnet?: boolean;
  /** Whether smart accounts are supported on this chain */
  smartAccountSupport?: boolean;
}

/**
 * Solana chain configuration
 */
export interface SolanaChain {
  ecosystem: 'solana';
  cluster: SolanaCluster;
  name: string;
  slug: string;
  nativeCurrency: NativeCurrency;
  rpcUrl: string;
  wsUrl?: string;
  blockExplorer?: BlockExplorer;
}

/**
 * Union of all chain types
 */
export type Chain = EvmChain | SolanaChain;

/**
 * Multi-chain configuration
 */
export interface MultiChainConfig {
  /** EVM chains */
  evmChains: EvmChain[];
  /** Solana chains */
  solanaChains: SolanaChain[];
  /** Default EVM chain ID */
  defaultEvmChainId?: ChainId;
  /** Default Solana cluster */
  defaultSolanaCluster?: SolanaCluster;
}

/**
 * Network status
 */
export interface NetworkStatus {
  ecosystem: ChainEcosystem;
  chainId?: ChainId;
  cluster?: SolanaCluster;
  isConnected: boolean;
  blockNumber?: number;
  latency?: number;
}
