/**
 * Wallet types for Rabit embedded wallet
 */

import type { ChainId, SolanaCluster } from './chain.js';

/**
 * Chain ecosystem
 */
export type ChainEcosystem = 'evm' | 'solana';

/**
 * Account type within the wallet
 */
export type AccountType = 'eoa' | 'smart_account';

/**
 * Smart account implementation
 */
export type SmartAccountType = 'kernel' | 'safe' | 'light';

/**
 * Wallet account — a single address the user controls
 */
export interface WalletAccount {
  /** Account address */
  address: string;
  /** Chain ecosystem */
  ecosystem: ChainEcosystem;
  /** Account type */
  type: AccountType;
  /** Smart account variant (only if type is smart_account) */
  smartAccountType?: SmartAccountType;
  /** Chain ID for EVM accounts */
  chainId?: ChainId;
  /** Whether this account is deployed on-chain (smart accounts) */
  isDeployed?: boolean;
  /** Human-readable label */
  label?: string;
}

/**
 * Full wallet state for a user
 */
export interface WalletState {
  /** All accounts across all chains */
  accounts: WalletAccount[];
  /** Currently active account */
  activeAccount: WalletAccount | null;
  /** Currently active chain ID (EVM) */
  activeChainId: ChainId | null;
  /** Currently active Solana cluster (mainnet-beta / devnet / testnet) */
  activeSolanaCluster: SolanaCluster | null;
  /** Currently active Solana chain slug (when multiple chains share a cluster) */
  activeSolanaChainSlug: string | null;
  /** Whether wallet is initialized and ready */
  isReady: boolean;
  /** Whether wallet is performing an operation */
  isLoading: boolean;
  /** True when a PIN vault exists locally and the wallet is currently locked. */
  isLocked: boolean;
  /** True when the user has set a PIN on this device. */
  hasPin: boolean;
  /**
   * True when the SDK detected a previously-registered user but no device
   * share is present locally — the user must enter their recovery share
   * (or reset).
   */
  needsRecovery: boolean;
  /** Last error during wallet init / reconstruction. null when healthy. */
  error?: { message: string; stage: string } | null;
}

/**
 * EVM transaction request
 */
export interface EvmTransactionRequest {
  to: string;
  value?: bigint;
  data?: string;
  gas?: bigint;
  gasPrice?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  nonce?: number;
  chainId?: ChainId;
}

/**
 * Solana transaction request
 */
export interface SolanaTransactionRequest {
  /** Serialized transaction (base64) */
  transaction: string;
  /** Whether to send and confirm */
  sendAndConfirm?: boolean;
}

/**
 * Wallet balance
 */
export interface WalletBalance {
  /** Account address */
  address: string;
  /** Chain ecosystem */
  ecosystem: ChainEcosystem;
  /** Chain ID (EVM) */
  chainId?: ChainId;
  /** Native token balance */
  native: {
    value: string;
    decimals: number;
    symbol: string;
    formatted: string;
  };
  /** Token balances */
  tokens: TokenBalance[];
}

/**
 * Individual token balance
 */
export interface TokenBalance {
  /** Contract/mint address */
  address: string;
  /** Balance value (raw) */
  value: string;
  /** Token decimals */
  decimals: number;
  /** Token symbol */
  symbol: string;
  /** Token name */
  name: string;
  /** Formatted balance */
  formatted: string;
  /** USD value if available */
  usdValue?: string;
}

/**
 * Transaction receipt (chain-agnostic)
 */
export interface TransactionReceipt {
  /** Transaction hash/signature */
  hash: string;
  /** Chain ecosystem */
  ecosystem: ChainEcosystem;
  /** Chain ID (EVM) */
  chainId?: ChainId;
  /** Success flag */
  success: boolean;
  /** Block number */
  blockNumber?: number;
  /** Gas used (EVM) */
  gasUsed?: string;
  /** Error message if failed */
  error?: string;
}
