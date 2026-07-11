/**
 * SDK configuration types for Rabit
 */

import type { EvmChain, SolanaChain, ChainId, SolanaCluster } from './chain.js';
import type { SmartAccountType } from './wallet.js';
import type { AuthMethod, OAuthProvider } from './auth.js';
import type { StorageAdapter } from './base.js';

/**
 * Main Rabit SDK configuration — what a developer passes to RabitProvider
 */
export interface RabitConfig {
  /** Project ID (from Rabit dashboard) */
  projectId: string;
  /** API key */
  apiKey: string;
  /** Application metadata */
  app: AppMetadata;

  // --- Chains ---
  /** EVM chains to support */
  evmChains: EvmChain[];
  /** Solana chains to support */
  solanaChains?: SolanaChain[];
  /** Default EVM chain */
  defaultEvmChainId?: ChainId;
  /** Default Solana cluster */
  defaultSolanaCluster?: SolanaCluster;

  // --- Auth ---
  /** Allowed auth methods */
  authMethods?: AuthMethod[];
  /** OAuth providers to enable */
  oauthProviders?: OAuthProvider[];

  // --- Smart Accounts ---
  /** Smart account type to use (developer chooses) */
  smartAccountType?: SmartAccountType;
  /** Bundler RPC URL */
  bundlerUrl?: string;
  /** Paymaster RPC URL */
  paymasterUrl?: string;
  /**
   * Optional factory that resolves the smart-account address for an owner key.
   * Injected by the consumer (e.g. a wrapper around @rabit/evm.createSmartAccount)
   * so @rabit/core stays chain-agnostic.
   */
  smartAccountResolver?: SmartAccountResolver;

  // --- On-ramp ---
  /** Enable on-ramp */
  onRampEnabled?: boolean;
  /** Enable off-ramp */
  offRampEnabled?: boolean;

  // --- UI ---
  /** UI theme configuration */
  theme?: ThemeConfig;
  /** Modal configuration */
  modal?: ModalConfig;

  // --- Advanced ---
  /** Custom API base URL (for self-hosted) */
  apiBaseUrl?: string;
  /** Enable debug logging */
  debug?: boolean;
  /** SSR mode */
  ssr?: boolean;
  /** Custom RPC transports per chain */
  transports?: Record<ChainId, string>;
  /**
   * Persistence adapter for session + device share. Defaults to
   * `window.localStorage` on web. React Native passes a synchronous adapter
   * (e.g. MMKV-backed) here so the SDK works off the DOM.
   */
  storage?: StorageAdapter;
}

/**
 * Application metadata
 */
export interface AppMetadata {
  name: string;
  description?: string;
  url?: string;
  icons?: string[];
  version?: string;
}

/**
 * Theme configuration
 */
export interface ThemeConfig {
  mode?: 'light' | 'dark' | 'auto';
  accentColor?: string;
  borderRadius?: 'none' | 'small' | 'medium' | 'large';
  colors?: {
    primary?: string;
    secondary?: string;
    background?: string;
    surface?: string;
    error?: string;
    warning?: string;
    success?: string;
    text?: string;
    textSecondary?: string;
    border?: string;
    primaryText?: string;
  };
  fonts?: {
    body?: string;
    heading?: string;
    monospace?: string;
  };
}

/**
 * Modal configuration
 */
export interface ModalConfig {
  closeOnBackdropClick?: boolean;
  showCloseButton?: boolean;
  size?: 'compact' | 'default' | 'wide';
  zIndex?: number;
}

/**
 * Resolver that returns the smart-account address (and deployment status)
 * for the given EVM signer. Called by WalletEngine during account build so
 * core does not need to depend on @rabit/evm.
 */
export type SmartAccountResolver = (args: {
  evmPrivateKey: string;
  chainId: ChainId;
}) => Promise<{ address: string; isDeployed: boolean }>;

/**
 * Session configuration
 */
export interface SessionConfig {
  /** Session expiry time (ms) */
  expiryTime?: number;
  /** Auto-refresh session before expiry */
  autoRefresh?: boolean;
  /** Storage key prefix */
  storageKey?: string;
}

/**
 * Analytics configuration
 */
export interface AnalyticsConfig {
  enabled: boolean;
  onEvent?: (event: AnalyticsEvent) => void;
}

/**
 * Analytics event
 */
export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, unknown>;
  timestamp?: number;
}
