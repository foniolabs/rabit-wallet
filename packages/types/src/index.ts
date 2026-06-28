/**
 * @rabit/types - TypeScript type definitions for Rabit Embedded Wallet SDK
 */

export const version = '0.1.0';

// Base types
export type {
  Version,
  RabitId,
  RabitError,
  EventEmitter,
  AsyncState,
  Platform,
  StorageAdapter,
  RetryConfig,
} from './base.js';

// Auth types
export type {
  AuthMethod,
  OAuthProvider,
  AuthStatus,
  OTPRequest,
  OTPVerification,
  OAuthRequest,
  OAuthCallback,
  AuthUser,
  AuthSession,
  AuthState,
} from './auth.js';

// Key management types
export type {
  ShareType,
  KeyShare,
  EncryptedKeyShare,
  MasterKeyMaterial,
  DerivedKeyPair,
  KeyGenerationResult,
  KeyReconstructionInput,
  KeyReconstructionResult,
  DeviceShareMetadata,
  RecoveryOptions,
} from './keys.js';

// Wallet types
export type {
  ChainEcosystem,
  AccountType,
  SmartAccountType,
  WalletAccount,
  WalletState,
  EvmTransactionRequest,
  SolanaTransactionRequest,
  WalletBalance,
  TokenBalance,
  TransactionReceipt,
} from './wallet.js';

// Chain types
export type {
  ChainId,
  SolanaCluster,
  NativeCurrency,
  BlockExplorer,
  RpcEndpoint,
  EvmChain,
  SolanaChain,
  Chain,
  MultiChainConfig,
  NetworkStatus,
} from './chain.js';

// Smart account types
export type {
  UserOperation,
  SmartAccountConfig,
  GasSponsorshipOptions,
  SessionKey,
  SessionPermissions,
  BatchTransaction,
  SmartAccount,
  PaymasterService,
  BundlerService,
  UserOperationReceipt,
} from './smart-account.js';

// On-ramp types
export type {
  FiatCurrency,
  CryptoAsset,
  PaymentMethod,
  PayoutMethod,
  OnRampQuote,
  OffRampQuote,
  OrderStatus,
  BankAccount,
  MobileMoneyAccount,
  OnRampOrder,
  OffRampOrder,
  PaymentMethodConfig,
} from './onramp.js';

// Event types
export type {
  BaseEvent,
  AuthEvent,
  WalletEvent,
  TransactionEvent,
  SmartAccountEvent,
  OnRampEvent,
  OffRampEvent,
  ErrorEvent,
  RabitEvent,
  EventListener,
  RabitEventEmitter,
} from './events.js';

// Config types
export type {
  RabitConfig,
  AppMetadata,
  ThemeConfig,
  ModalConfig,
  SessionConfig,
  AnalyticsConfig,
  AnalyticsEvent,
  SmartAccountResolver,
} from './config.js';

// Error types and classes
export {
  RabitErrorCodes,
  BaseRabitError,
  AuthError,
  OTPExpiredError,
  OTPInvalidError,
  SessionExpiredError,
  KeyError,
  KeyReconstructionError,
  DeviceShareNotFoundError,
  ChainError,
  ChainNotSupportedError,
  TransactionError,
  InsufficientFundsError,
  SmartAccountError,
  UserOperationFailedError,
  OnRampError,
  NetworkError,
  TimeoutError,
  ConfigurationError,
} from './errors.js';

export type {
  RabitErrorCode,
  ErrorHandler,
} from './errors.js';

/**
 * Utility types
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
