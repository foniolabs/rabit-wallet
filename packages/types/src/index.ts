// Main exports
/**
 * @rabit/types - TypeScript type definitions for Rabit
 * The wallet connector that actually works
 */

// Version export
export const version = '0.0.0';

// Base types
export type {
  Version,
  RabitId,
  ConnectionStatus,
  RabitError,
  EventEmitter,
  BaseConfig,
  Metadata,
  Platform,
  AsyncState,
  RetryConfig,
} from './base.js';

// Chain types
export type {
  ChainId,
  NativeCurrency,
  BlockExplorer,
  RpcEndpoint,
  Chain,
  ChainSwitchRequest,
  AddChainRequest,
  NetworkStatus,
  MultiChainConfig,
} from './chain.js';

// Wallet types
export type {
  WalletType,
  ConnectionMethod,
  WalletFeatures,
  WalletAvailability,
  WalletConnector,
  ConnectOptions,
  ConnectResult,
  TransactionRequest,
  WalletConnectorEvents,
  WalletSession,
  WalletBalance,
  ENSData,
} from './wallet.js';

// Smart account types
export type {
  SmartAccountStandard,
  UserOperation,
  GasSponsorshipOptions,
  SmartAccountConfig,
  ValidationModule,
  ExecutionModule,
  SessionKey,
  SessionPermissions,
  BatchTransaction,
  SmartAccount,
  SmartAccountProvider,
  PaymasterService,
  BundlerService,
  UserOperationReceipt,
  AccountRecoveryOptions,
  MultiSigConfig,
} from './smart-account.js';

// Event types
export type {
  BaseEvent,
  ConnectionEvent,
  AccountEvent,
  ChainEvent,
  TransactionEvent,
  SmartAccountEvent,
  ErrorEvent,
  UIEvent,
  AnalyticsEvent as EventAnalyticsEvent,
  RabitEvent,
  EventListener,
  RabitEventEmitter,
  EventFilter,
  SubscriptionOptions,
} from './events.js';

// Configuration types
export type {
  RabitConfig,
  AppMetadata,
  Transport,
  UIConfig,
  ThemeConfig,
  ModalConfig,
  WalletListConfig,
  BaseComponentProps,
  WalletButtonProps,
  ConnectButtonProps,
  AccountButtonProps,
  ChainSelectorProps,
  ModalProps,
  ComponentFunction,
  ComponentOverrides,
  AnalyticsConfig,
  AnalyticsEvent,
  SessionConfig,
  BatchConfig,
  TransactionResult,
  RabitHooks,
  ConnectorConfig,
  WalletConnectConfig,
  CoinbaseWalletConfig,
  MetaMaskConfig,
  CSSProperties,
} from './config.js';

// Error types and classes
export {
  RabitErrorCodes,
  BaseRabitError,
  ConnectionError,
  WalletNotFoundError,
  WalletNotInstalledError,
  ChainError,
  ChainNotSupportedError,
  WrongChainError,
  TransactionError,
  UserRejectedRequestError,
  InsufficientFundsError,
  SmartAccountError,
  UserOperationFailedError,
  SessionExpiredError,
  PermissionDeniedError,
  InvalidSignatureError,
  NetworkError,
  RpcError,
  RateLimitedError,
  TimeoutError,
  ConfigurationError,
  MissingProviderError,
  RabitErrorFactory,
} from './errors.js';

export type {
  RabitErrorCode,
  ErrorHandler,
  ErrorRecoveryOptions,
} from './errors.js';

// Re-export viem types that are commonly used
export type {
  Address,
  Hash,
  Hex,
} from 'viem';

// Import types needed for utility types
import type { RabitEvent } from './events.js';
import type { WalletType, WalletConnector } from './wallet.js';
import type { RabitError } from './base.js';

/**
 * Utility type for making all properties optional recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Utility type for making specific properties required
 */
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Utility type for omitting properties and making others optional
 */
export type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

/**
 * Utility type for extracting event data by event type
 */
export type ExtractEventData<T extends RabitEvent, U extends T['type']> = Extract<T, { type: U }>['data'];

/**
 * Utility type for wallet connector by type
 */
export type ConnectorByType<T extends WalletType> = WalletConnector & {
  readonly type: T;
};

/**
 * Utility type for creating a branded type
 */
export type Brand<T, B> = T & { __brand: B };

/**
 * Common response wrapper for async operations
 */
export interface RabitResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: RabitError;
  timestamp: number;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
  offset?: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Sort options
 */
export interface SortOptions<T> {
  field: keyof T;
  order: 'asc' | 'desc';
}

/**
 * Filter options for generic queries
 */
export interface FilterOptions<T> {
  where?: Partial<T>;
  search?: string;
  dateRange?: {
    from?: Date;
    to?: Date;
  };
}

/**
 * Query options combining pagination, sorting, and filtering
 */
export interface QueryOptions<T> extends PaginationOptions {
  sort?: SortOptions<T>;
  filter?: FilterOptions<T>;
}