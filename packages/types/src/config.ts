// Configuration types
import type { RabitId, BaseConfig, Metadata } from './base.js';
import type { Chain, ChainId, MultiChainConfig } from './chain.js';
import type { WalletConnector, WalletType } from './wallet.js';
import type { SmartAccountConfig } from './smart-account.js';

/**
 * Configuration types for Rabit
 */

/**
 * Rabit SDK configuration
 */
export interface RabitConfig extends BaseConfig {
  /**
   * Application metadata
   */
  app: AppMetadata;
  
  /**
   * Supported chains
   */
  chains: Chain[];
  
  /**
   * Default chain
   */
  defaultChain?: ChainId;
  
  /**
   * Wallet connectors
   */
  connectors: WalletConnector[];
  
  /**
   * Smart account configuration
   */
  smartAccount?: SmartAccountConfig;
  
  /**
   * UI configuration
   */
  ui?: UIConfig;
  
  /**
   * Analytics configuration
   */
  analytics?: AnalyticsConfig;
  
  /**
   * Session management
   */
  session?: SessionConfig;
  
  /**
   * Multi-chain configuration
   */
  multiChain?: MultiChainConfig;
  
  /**
   * Custom transports
   */
  transports?: Record<ChainId, Transport>;
  
  /**
   * Batch configuration
   */
  batch?: BatchConfig;
  
  /**
   * SSR configuration
   */
  ssr?: boolean;
  
  /**
   * Custom hooks
   */
  hooks?: RabitHooks;
}

/**
 * Application metadata
 */
export interface AppMetadata extends Metadata {
  /**
   * Application name
   */
  name: string;
  
  /**
   * Application description
   */
  description?: string;
  
  /**
   * Application URL
   */
  url: string;
  
  /**
   * Application icons
   */
  icons: string[];
  
  /**
   * Verification URLs for WalletConnect
   */
  verifyUrl?: string;
  
  /**
   * Redirect URIs for OAuth-like flows
   */
  redirectUris?: string[];
  
  /**
   * App version
   */
  version?: string;
}

/**
 * Transport configuration
 */
export interface Transport {
  /**
   * Transport type
   */
  type: 'http' | 'websocket' | 'ipc';
  
  /**
   * Primary URL
   */
  url: string;
  
  /**
   * Fallback URLs
   */
  fallbackUrls?: string[];
  
  /**
   * Request timeout
   */
  timeout?: number;
  
  /**
   * Retry configuration
   */
  retries?: number;
  
  /**
   * Custom headers
   */
  headers?: Record<string, string>;
  
  /**
   * Polling interval for subscriptions
   */
  pollingInterval?: number;
}

/**
 * UI configuration
 */
export interface UIConfig {
  /**
   * Theme configuration
   */
  theme?: ThemeConfig;
  
  /**
   * Modal configuration
   */
  modal?: ModalConfig;
  
  /**
   * Wallet list configuration
   */
  walletList?: WalletListConfig;
  
  /**
   * Custom CSS
   */
  customCss?: string;
  
  /**
   * Language/locale
   */
  locale?: string;
  
  /**
   * Custom components
   */
  components?: ComponentOverrides;
}

/**
 * Theme configuration
 */
export interface ThemeConfig {
  /**
   * Color mode
   */
  mode?: 'light' | 'dark' | 'auto';
  
  /**
   * Accent color
   */
  accentColor?: string;
  
  /**
   * Border radius
   */
  borderRadius?: 'none' | 'small' | 'medium' | 'large';
  
  /**
   * Custom colors
   */
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
  };
  
  /**
   * Custom fonts
   */
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
  /**
   * Whether modal can be closed by clicking backdrop
   */
  closeOnBackdropClick?: boolean;
  
  /**
   * Whether to show close button
   */
  showCloseButton?: boolean;
  
  /**
   * Modal size
   */
  size?: 'compact' | 'default' | 'wide';
  
  /**
   * Custom modal container - using Element from DOM lib
   */
  container?: Element | string;
  
  /**
   * Z-index for modal
   */
  zIndex?: number;
}

/**
 * Wallet list configuration
 */
export interface WalletListConfig {
  /**
   * Whether to show recent wallets first
   */
  showRecent?: boolean;
  
  /**
   * Maximum number of wallets to display
   */
  maxWallets?: number;
  
  /**
   * Whether to group wallets by type
   */
  groupByType?: boolean;
  
  /**
   * Custom wallet order
   */
  order?: WalletType[];
  
  /**
   * Wallets to hide
   */
  hide?: WalletType[];
  
  /**
   * Whether to show all wallets option
   */
  showAllWallets?: boolean;
}

/**
 * Base CSS properties interface - compatible with React.CSSProperties
 */
export interface CSSProperties {
  [property: string]: string | number | undefined;
}

/**
 * Base props interface for component overrides
 */
export interface BaseComponentProps {
  className?: string;
  style?: CSSProperties;
  children?: unknown;
}

/**
 * Wallet button component props
 */
export interface WalletButtonProps extends BaseComponentProps {
  wallet: WalletType;
  onConnect?: () => void;
  disabled?: boolean;
  isConnecting?: boolean;
}

/**
 * Connect button component props
 */
export interface ConnectButtonProps extends BaseComponentProps {
  onConnect?: () => void;
  disabled?: boolean;
  label?: string;
}

/**
 * Account button component props
 */
export interface AccountButtonProps extends BaseComponentProps {
  address?: string;
  ensName?: string;
  balance?: string;
  onDisconnect?: () => void;
  onCopyAddress?: () => void;
}

/**
 * Chain selector component props
 */
export interface ChainSelectorProps extends BaseComponentProps {
  currentChain?: Chain;
  chains: Chain[];
  onChainChange?: (chain: Chain) => void;
  disabled?: boolean;
}

/**
 * Modal component props
 */
export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

/**
 * Component function type - framework agnostic
 */
export type ComponentFunction<P = {}> = (props: P) => any;

/**
 * Component overrides with proper typing
 */
export interface ComponentOverrides {
  /**
   * Custom wallet button component
   */
  WalletButton?: ComponentFunction<WalletButtonProps>;
  
  /**
   * Custom connect button component
   */
  ConnectButton?: ComponentFunction<ConnectButtonProps>;
  
  /**
   * Custom account button component
   */
  AccountButton?: ComponentFunction<AccountButtonProps>;
  
  /**
   * Custom chain selector component
   */
  ChainSelector?: ComponentFunction<ChainSelectorProps>;
  
  /**
   * Custom modal component
   */
  Modal?: ComponentFunction<ModalProps>;
}

/**
 * Analytics configuration
 */
export interface AnalyticsConfig {
  /**
   * Whether analytics is enabled
   */
  enabled: boolean;
  
  /**
   * Analytics provider
   */
  provider?: 'mixpanel' | 'amplitude' | 'segment' | 'custom';
  
  /**
   * Provider configuration
   */
  config?: Record<string, unknown>;
  
  /**
   * Events to track
   */
  events?: string[];
  
  /**
   * User identification
   */
  identifyUsers?: boolean;
  
  /**
   * Custom event handler
   */
  onEvent?: (event: AnalyticsEvent) => void;
}

/**
 * Analytics event interface
 */
export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, unknown>;
  timestamp?: Date;
  userId?: string;
}

/**
 * Session configuration
 */
export interface SessionConfig {
  /**
   * Whether to persist sessions
   */
  persist?: boolean;
  
  /**
   * Storage key prefix
   */
  storageKey?: string;
  
  /**
   * Session expiry time in milliseconds
   */
  expiryTime?: number;
  
  /**
   * Whether to auto-reconnect
   */
  autoReconnect?: boolean;
  
  /**
   * Reconnection timeout
   */
  reconnectTimeout?: number;
  
  /**
   * Maximum reconnection attempts
   */
  maxReconnectAttempts?: number;
}

/**
 * Batch configuration
 */
export interface BatchConfig {
  /**
   * Whether batching is enabled
   */
  enabled?: boolean;
  
  /**
   * Batch size
   */
  batchSize?: number;
  
  /**
   * Batch timeout in milliseconds
   */
  timeout?: number;
  
  /**
   * Whether to wait for all requests in batch
   */
  waitForAll?: boolean;
}

/**
 * Transaction result interface
 */
export interface TransactionResult {
  hash: string;
  receipt?: any;
  error?: Error;
}

/**
 * Rabit hooks for customization
 */
export interface RabitHooks {
  /**
   * Before connection hook
   */
  beforeConnect?: (connector: WalletConnector) => Promise<void> | void;
  
  /**
   * After connection hook
   */
  afterConnect?: (result: any) => Promise<void> | void;
  
  /**
   * Before disconnection hook
   */
  beforeDisconnect?: () => Promise<void> | void;
  
  /**
   * After disconnection hook
   */
  afterDisconnect?: () => Promise<void> | void;
  
  /**
   * Error handler
   */
  onError?: (error: Error) => Promise<void> | void;
  
  /**
   * Transaction hook
   */
  onTransaction?: (result: TransactionResult) => Promise<void> | void;
}

/**
 * Connector configuration
 */
export interface ConnectorConfig {
  /**
   * Connector metadata
   */
  metadata?: Partial<Metadata>;
  
  /**
   * Custom options
   */
  options?: Record<string, unknown>;
  
  /**
   * Chains to support
   */
  chains?: ChainId[];
  
  /**
   * Whether connector is enabled
   */
  enabled?: boolean;
}

/**
 * WalletConnect configuration
 */
export interface WalletConnectConfig extends ConnectorConfig {
  /**
   * WalletConnect project ID
   */
  projectId: string;
  
  /**
   * QR modal options
   */
  qrModalOptions?: {
    themeMode?: 'light' | 'dark';
    themeVariables?: Record<string, string>;
    enableExplorer?: boolean;
  };
  
  /**
   * Metadata for the dApp
   */
  metadata: AppMetadata;
}

/**
 * Coinbase Wallet configuration
 */
export interface CoinbaseWalletConfig extends ConnectorConfig {
  /**
   * App name
   */
  appName: string;
  
  /**
   * App logo URL
   */
  appLogoUrl?: string;
  
  /**
   * Enable dark mode
   */
  darkMode?: boolean;
  
  /**
   * Preferred network
   */
  preferredNetwork?: ChainId;
}

/**
 * MetaMask configuration
 */
export interface MetaMaskConfig extends ConnectorConfig {
  /**
   * SIWE configuration
   */
  siwe?: {
    enabled: boolean;
    config?: Record<string, unknown>;
  };
  
  /**
   * SDK options
   */
  sdkOptions?: Record<string, unknown>;
}