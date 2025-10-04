import type { RabitError } from './base.js';
import type { ChainId } from './chain.js';
import type { WalletType } from './wallet.js';

/**
 * Error types and codes for Rabit
 */

/**
 * Error codes used throughout Rabit
 */
export const RabitErrorCodes = {
  // Connection errors (1000-1999)
  CONNECTION_FAILED: 1000,
  CONNECTION_REJECTED: 1001,
  CONNECTION_TIMEOUT: 1002,
  ALREADY_CONNECTED: 1003,
  NOT_CONNECTED: 1004,
  
  // Wallet errors (2000-2999)
  WALLET_NOT_FOUND: 2000,
  WALLET_NOT_INSTALLED: 2001,
  WALLET_NOT_SUPPORTED: 2002,
  WALLET_LOCKED: 2003,
  WALLET_DISCONNECTED: 2004,
  
  // Chain errors (3000-3999)
  CHAIN_NOT_SUPPORTED: 3000,
  CHAIN_SWITCH_FAILED: 3001,
  CHAIN_ADD_FAILED: 3002,
  WRONG_CHAIN: 3003,
  
  // Transaction errors (4000-4999)
  TRANSACTION_FAILED: 4000,
  TRANSACTION_REJECTED: 4001,
  INSUFFICIENT_FUNDS: 4002,
  GAS_ESTIMATION_FAILED: 4003,
  INVALID_TRANSACTION: 4004,
  
  // Smart account errors (5000-5999)
  SMART_ACCOUNT_NOT_DEPLOYED: 5000,
  USER_OPERATION_FAILED: 5001,
  PAYMASTER_FAILED: 5002,
  BUNDLER_FAILED: 5003,
  SESSION_EXPIRED: 5004,
  
  // Permission errors (6000-6999)
  PERMISSION_DENIED: 6000,
  UNAUTHORIZED: 6001,
  INVALID_SIGNATURE: 6002,
  
  // Network errors (7000-7999)
  NETWORK_ERROR: 7000,
  RPC_ERROR: 7001,
  RATE_LIMITED: 7002,
  TIMEOUT: 7003,
  
  // Configuration errors (8000-8999)
  INVALID_CONFIG: 8000,
  MISSING_PROVIDER: 8001,
  INVALID_CHAIN_CONFIG: 8002,
  
  // Unknown/Generic errors (9000-9999)
  UNKNOWN_ERROR: 9000,
  INTERNAL_ERROR: 9001,
} as const;

export type RabitErrorCode = typeof RabitErrorCodes[keyof typeof RabitErrorCodes];

/**
 * Base Rabit error class
 */
export class BaseRabitError extends Error implements RabitError {
  override readonly name: string;
  readonly code: RabitErrorCode;
  readonly details?: Record<string, unknown>;
  override readonly cause?: Error;

  constructor(
    message: string,
    code: RabitErrorCode,
    options?: {
      details?: Record<string, unknown>;
      cause?: Error;
    }
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    
    // Only assign properties if they have actual values
    if (options?.details !== undefined) {
      this.details = options.details;
    }
    
    if (options?.cause !== undefined) {
      this.cause = options.cause;
    }
  }
}

/**
 * Connection related errors
 */
export class ConnectionError extends BaseRabitError {
  constructor(
    message: string,
    code: RabitErrorCode = RabitErrorCodes.CONNECTION_FAILED,
    options?: {
      walletType?: WalletType;
      details?: Record<string, unknown>;
      cause?: Error;
    }
  ) {
    super(message, code, {
      details: {
        ...options?.details,
        ...(options?.walletType !== undefined && { walletType: options.walletType }),
      },
      ...(options?.cause !== undefined && { cause: options.cause }),
    });
  }
}

/**
 * Wallet not found error
 */
export class WalletNotFoundError extends BaseRabitError {
  constructor(walletType: WalletType, cause?: Error) {
    super(
      `Wallet "${walletType}" not found. Please install the wallet extension or app.`,
      RabitErrorCodes.WALLET_NOT_FOUND,
      {
        details: { walletType },
        ...(cause !== undefined && { cause }),
      }
    );
  }
}

/**
 * Wallet not installed error
 */
export class WalletNotInstalledError extends BaseRabitError {
  constructor(walletType: WalletType, downloadUrl?: string) {
    super(
      `Wallet "${walletType}" is not installed. Please install it to continue.`,
      RabitErrorCodes.WALLET_NOT_INSTALLED,
      {
        details: { 
          walletType,
          ...(downloadUrl !== undefined && { downloadUrl })
        },
      }
    );
  }
}

/**
 * Chain related errors
 */
export class ChainError extends BaseRabitError {
  constructor(
    message: string,
    code: RabitErrorCode = RabitErrorCodes.CHAIN_NOT_SUPPORTED,
    options?: {
      chainId?: ChainId;
      details?: Record<string, unknown>;
      cause?: Error;
    }
  ) {
    super(message, code, {
      details: {
        ...options?.details,
        ...(options?.chainId !== undefined && { chainId: options.chainId }),
      },
      ...(options?.cause !== undefined && { cause: options.cause }),
    });
  }
}

/**
 * Chain not supported error
 */
export class ChainNotSupportedError extends ChainError {
  constructor(chainId: ChainId, supportedChains?: ChainId[]) {
    super(
      `Chain ${chainId} is not supported. Supported chains: ${supportedChains?.join(', ') || 'none'}`,
      RabitErrorCodes.CHAIN_NOT_SUPPORTED,
      {
        chainId,
        details: { 
          ...(supportedChains !== undefined && { supportedChains })
        },
      }
    );
  }
}

/**
 * Wrong chain error
 */
export class WrongChainError extends ChainError {
  constructor(currentChainId: ChainId, expectedChainId: ChainId) {
    super(
      `Wrong chain. Expected ${expectedChainId}, but got ${currentChainId}`,
      RabitErrorCodes.WRONG_CHAIN,
      {
        details: { currentChainId, expectedChainId },
      }
    );
  }
}

/**
 * Transaction related errors
 */
export class TransactionError extends BaseRabitError {
  constructor(
    message: string,
    code: RabitErrorCode = RabitErrorCodes.TRANSACTION_FAILED,
    options?: {
      hash?: string;
      details?: Record<string, unknown>;
      cause?: Error;
    }
  ) {
    super(message, code, {
      details: {
        ...options?.details,
        ...(options?.hash !== undefined && { hash: options.hash }),
      },
      ...(options?.cause !== undefined && { cause: options.cause }),
    });
  }
}

/**
 * User rejected request error
 */
export class UserRejectedRequestError extends BaseRabitError {
  constructor(action: string = 'request') {
    super(
      `User rejected the ${action}`,
      RabitErrorCodes.TRANSACTION_REJECTED,
      {
        details: { action },
      }
    );
  }
}

/**
 * Insufficient funds error
 */
export class InsufficientFundsError extends TransactionError {
  constructor(required: string, available: string, token: string = 'ETH') {
    super(
      `Insufficient ${token} balance. Required: ${required}, Available: ${available}`,
      RabitErrorCodes.INSUFFICIENT_FUNDS,
      {
        details: { required, available, token },
      }
    );
  }
}

/**
 * Smart account related errors
 */
export class SmartAccountError extends BaseRabitError {
  constructor(
    message: string,
    code: RabitErrorCode = RabitErrorCodes.SMART_ACCOUNT_NOT_DEPLOYED,
    options?: {
      accountAddress?: string;
      userOpHash?: string;
      details?: Record<string, unknown>;
      cause?: Error;
    }
  ) {
    super(message, code, {
      details: {
        ...options?.details,
        ...(options?.accountAddress !== undefined && { accountAddress: options.accountAddress }),
        ...(options?.userOpHash !== undefined && { userOpHash: options.userOpHash }),
      },
      ...(options?.cause !== undefined && { cause: options.cause }),
    });
  }
}

/**
 * User operation failed error
 */
export class UserOperationFailedError extends SmartAccountError {
  constructor(userOpHash: string, reason?: string, cause?: Error) {
    super(
      `User operation failed${reason ? `: ${reason}` : ''}`,
      RabitErrorCodes.USER_OPERATION_FAILED,
      {
        userOpHash,
        details: { 
          ...(reason !== undefined && { reason })
        },
        ...(cause !== undefined && { cause }),
      }
    );
  }
}

/**
 * Session expired error
 */
export class SessionExpiredError extends SmartAccountError {
  constructor(sessionKey: string) {
    super(
      'Session key has expired. Please create a new session.',
      RabitErrorCodes.SESSION_EXPIRED,
      {
        details: { sessionKey },
      }
    );
  }
}

/**
 * Permission denied error
 */
export class PermissionDeniedError extends BaseRabitError {
  constructor(action: string, requiredPermission?: string) {
    super(
      `Permission denied for action: ${action}${requiredPermission ? `. Required permission: ${requiredPermission}` : ''}`,
      RabitErrorCodes.PERMISSION_DENIED,
      {
        details: { 
          action,
          ...(requiredPermission !== undefined && { requiredPermission })
        },
      }
    );
  }
}

/**
 * Invalid signature error
 */
export class InvalidSignatureError extends BaseRabitError {
  constructor(message: string = 'Invalid signature') {
    super(message, RabitErrorCodes.INVALID_SIGNATURE);
  }
}

/**
 * Network related errors
 */
export class NetworkError extends BaseRabitError {
  constructor(
    message: string,
    code: RabitErrorCode = RabitErrorCodes.NETWORK_ERROR,
    options?: {
      url?: string;
      status?: number;
      details?: Record<string, unknown>;
      cause?: Error;
    }
  ) {
    super(message, code, {
      details: {
        ...options?.details,
        ...(options?.url !== undefined && { url: options.url }),
        ...(options?.status !== undefined && { status: options.status }),
      },
      ...(options?.cause !== undefined && { cause: options.cause }),
    });
  }
}

/**
 * RPC error
 */
export class RpcError extends NetworkError {
  constructor(
    message: string,
    rpcCode?: number,
    rpcData?: unknown,
    cause?: Error
  ) {
    super(
      message,
      RabitErrorCodes.RPC_ERROR,
      {
        details: { 
          ...(rpcCode !== undefined && { rpcCode }),
          ...(rpcData !== undefined && { rpcData })
        },
        ...(cause !== undefined && { cause }),
      }
    );
  }
}

/**
 * Rate limited error
 */
export class RateLimitedError extends NetworkError {
  constructor(retryAfter?: number) {
    super(
      `Rate limited. ${retryAfter ? `Try again after ${retryAfter} seconds.` : 'Please try again later.'}`,
      RabitErrorCodes.RATE_LIMITED,
      {
        details: { 
          ...(retryAfter !== undefined && { retryAfter })
        },
      }
    );
  }
}

/**
 * Timeout error
 */
export class TimeoutError extends NetworkError {
  constructor(timeout: number, operation: string = 'operation') {
    super(
      `${operation} timed out after ${timeout}ms`,
      RabitErrorCodes.TIMEOUT,
      {
        details: { timeout, operation },
      }
    );
  }
}

/**
 * Configuration error
 */
export class ConfigurationError extends BaseRabitError {
  constructor(
    message: string,
    field?: string,
    expectedType?: string
  ) {
    super(
      message,
      RabitErrorCodes.INVALID_CONFIG,
      {
        details: { 
          ...(field !== undefined && { field }),
          ...(expectedType !== undefined && { expectedType })
        },
      }
    );
  }
}

/**
 * Missing provider error
 */
export class MissingProviderError extends BaseRabitError {
  constructor(providerType: string) {
    super(
      `Missing ${providerType} provider. Please configure a provider for this wallet.`,
      RabitErrorCodes.MISSING_PROVIDER,
      {
        details: { providerType },
      }
    );
  }
}

/**
 * Error factory for creating typed errors
 */
export class RabitErrorFactory {
  /**
   * Create connection error
   */
  static connection(message: string, walletType?: WalletType, cause?: Error): ConnectionError {
    return new ConnectionError(message, RabitErrorCodes.CONNECTION_FAILED, {
      ...(walletType !== undefined && { walletType }),
      ...(cause !== undefined && { cause }),
    });
  }

  /**
   * Create user rejection error
   */
  static userRejected(action: string = 'request'): UserRejectedRequestError {
    return new UserRejectedRequestError(action);
  }

  /**
   * Create chain error
   */
  static unsupportedChain(chainId: ChainId, supportedChains?: ChainId[]): ChainNotSupportedError {
    return new ChainNotSupportedError(chainId, supportedChains);
  }

  /**
   * Create wallet not found error
   */
  static walletNotFound(walletType: WalletType): WalletNotFoundError {
    return new WalletNotFoundError(walletType);
  }

  /**
   * Create insufficient funds error
   */
  static insufficientFunds(required: string, available: string, token?: string): InsufficientFundsError {
    return new InsufficientFundsError(required, available, token);
  }

  /**
   * Create smart account error
   */
  static smartAccount(message: string, accountAddress?: string): SmartAccountError {
    return new SmartAccountError(message, RabitErrorCodes.SMART_ACCOUNT_NOT_DEPLOYED, {
      ...(accountAddress !== undefined && { accountAddress }),
    });
  }

  /**
   * Create network error
   */
  static network(message: string, url?: string, status?: number): NetworkError {
    return new NetworkError(message, RabitErrorCodes.NETWORK_ERROR, {
      ...(url !== undefined && { url }),
      ...(status !== undefined && { status }),
    });
  }

  /**
   * Create timeout error
   */
  static timeout(timeout: number, operation?: string): TimeoutError {
    return new TimeoutError(timeout, operation);
  }

  /**
   * Create unknown error
   */
  static unknown(message: string, cause?: Error): BaseRabitError {
    return new BaseRabitError(message, RabitErrorCodes.UNKNOWN_ERROR, { 
      ...(cause !== undefined && { cause })
    });
  }
}

/**
 * Error handler interface
 */
export interface ErrorHandler {
  /**
   * Handle error
   */
  handle(error: RabitError): void | Promise<void>;
  
  /**
   * Check if error should be handled
   */
  canHandle?(error: RabitError): boolean;
}

/**
 * Error recovery options
 */
export interface ErrorRecoveryOptions {
  /**
   * Whether to retry automatically
   */
  autoRetry?: boolean;
  
  /**
   * Maximum retry attempts
   */
  maxRetries?: number;
  
  /**
   * Retry delay in milliseconds
   */
  retryDelay?: number;
  
  /**
   * Whether to use exponential backoff
   */
  exponentialBackoff?: boolean;
  
  /**
   * Custom recovery handler
   */
  onRecovery?: (error: RabitError, attempt: number) => Promise<boolean>;
}