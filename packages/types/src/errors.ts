/**
 * Error types and codes for Rabit
 */

import type { RabitError } from './base.js';

export const RabitErrorCodes = {
  // Auth errors (1000-1999)
  AUTH_FAILED: 1000,
  AUTH_OTP_EXPIRED: 1001,
  AUTH_OTP_INVALID: 1002,
  AUTH_OAUTH_FAILED: 1003,
  AUTH_SESSION_EXPIRED: 1004,
  AUTH_UNAUTHORIZED: 1005,

  // Key management errors (2000-2999)
  KEY_GENERATION_FAILED: 2000,
  KEY_RECONSTRUCTION_FAILED: 2001,
  KEY_SHARE_INVALID: 2002,
  KEY_SHARE_MISSING: 2003,
  KEY_ENCRYPTION_FAILED: 2004,
  KEY_DECRYPTION_FAILED: 2005,
  KEY_DERIVATION_FAILED: 2006,
  DEVICE_SHARE_NOT_FOUND: 2007,

  // Chain errors (3000-3999)
  CHAIN_NOT_SUPPORTED: 3000,
  CHAIN_SWITCH_FAILED: 3001,
  WRONG_CHAIN: 3002,

  // Transaction errors (4000-4999)
  TRANSACTION_FAILED: 4000,
  TRANSACTION_REJECTED: 4001,
  INSUFFICIENT_FUNDS: 4002,
  GAS_ESTIMATION_FAILED: 4003,

  // Smart account errors (5000-5999)
  SMART_ACCOUNT_NOT_DEPLOYED: 5000,
  USER_OPERATION_FAILED: 5001,
  PAYMASTER_FAILED: 5002,
  BUNDLER_FAILED: 5003,

  // On-ramp errors (6000-6999)
  ONRAMP_QUOTE_FAILED: 6000,
  ONRAMP_ORDER_FAILED: 6001,
  ONRAMP_PAYMENT_FAILED: 6002,
  OFFRAMP_QUOTE_FAILED: 6003,
  OFFRAMP_ORDER_FAILED: 6004,
  OFFRAMP_PAYOUT_FAILED: 6005,

  // Network errors (7000-7999)
  NETWORK_ERROR: 7000,
  RPC_ERROR: 7001,
  RATE_LIMITED: 7002,
  TIMEOUT: 7003,

  // Configuration errors (8000-8999)
  INVALID_CONFIG: 8000,
  MISSING_API_KEY: 8001,

  // Unknown (9000-9999)
  UNKNOWN_ERROR: 9000,
  INTERNAL_ERROR: 9001,
} as const;

export type RabitErrorCode = typeof RabitErrorCodes[keyof typeof RabitErrorCodes];

/**
 * Base error class
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
    if (options?.details) this.details = options.details;
    if (options?.cause) this.cause = options.cause;
  }
}

// --- Auth Errors ---

export class AuthError extends BaseRabitError {
  constructor(message: string, code: RabitErrorCode = RabitErrorCodes.AUTH_FAILED, cause?: Error) {
    super(message, code, { ...(cause && { cause }) });
  }
}

export class OTPExpiredError extends AuthError {
  constructor() {
    super('OTP code has expired. Please request a new one.', RabitErrorCodes.AUTH_OTP_EXPIRED);
  }
}

export class OTPInvalidError extends AuthError {
  constructor() {
    super('Invalid OTP code. Please check and try again.', RabitErrorCodes.AUTH_OTP_INVALID);
  }
}

export class SessionExpiredError extends AuthError {
  constructor() {
    super('Session expired. Please log in again.', RabitErrorCodes.AUTH_SESSION_EXPIRED);
  }
}

// --- Key Errors ---

export class KeyError extends BaseRabitError {
  constructor(message: string, code: RabitErrorCode = RabitErrorCodes.KEY_GENERATION_FAILED, cause?: Error) {
    super(message, code, { ...(cause && { cause }) });
  }
}

export class KeyReconstructionError extends KeyError {
  constructor(reason?: string) {
    super(
      `Failed to reconstruct key${reason ? `: ${reason}` : ''}`,
      RabitErrorCodes.KEY_RECONSTRUCTION_FAILED
    );
  }
}

export class DeviceShareNotFoundError extends KeyError {
  constructor() {
    super(
      'Device share not found. You may need to recover your account.',
      RabitErrorCodes.DEVICE_SHARE_NOT_FOUND
    );
  }
}

// --- Chain Errors ---

export class ChainError extends BaseRabitError {
  constructor(message: string, code: RabitErrorCode = RabitErrorCodes.CHAIN_NOT_SUPPORTED, cause?: Error) {
    super(message, code, { ...(cause && { cause }) });
  }
}

export class ChainNotSupportedError extends ChainError {
  constructor(chainId: number) {
    super(`Chain ${chainId} is not supported`, RabitErrorCodes.CHAIN_NOT_SUPPORTED);
  }
}

// --- Transaction Errors ---

export class TransactionError extends BaseRabitError {
  constructor(message: string, code: RabitErrorCode = RabitErrorCodes.TRANSACTION_FAILED, cause?: Error) {
    super(message, code, { ...(cause && { cause }) });
  }
}

export class InsufficientFundsError extends TransactionError {
  constructor(token: string = 'ETH') {
    super(`Insufficient ${token} balance`, RabitErrorCodes.INSUFFICIENT_FUNDS);
  }
}

// --- Smart Account Errors ---

export class SmartAccountError extends BaseRabitError {
  constructor(message: string, code: RabitErrorCode = RabitErrorCodes.SMART_ACCOUNT_NOT_DEPLOYED, cause?: Error) {
    super(message, code, { ...(cause && { cause }) });
  }
}

export class UserOperationFailedError extends SmartAccountError {
  constructor(reason?: string, cause?: Error) {
    super(
      `User operation failed${reason ? `: ${reason}` : ''}`,
      RabitErrorCodes.USER_OPERATION_FAILED,
      cause
    );
  }
}

// --- On-ramp Errors ---

export class OnRampError extends BaseRabitError {
  constructor(message: string, code: RabitErrorCode = RabitErrorCodes.ONRAMP_ORDER_FAILED, cause?: Error) {
    super(message, code, { ...(cause && { cause }) });
  }
}

// --- Network Errors ---

export class NetworkError extends BaseRabitError {
  constructor(message: string, code: RabitErrorCode = RabitErrorCodes.NETWORK_ERROR, cause?: Error) {
    super(message, code, { ...(cause && { cause }) });
  }
}

export class TimeoutError extends NetworkError {
  constructor(timeout: number, operation: string = 'operation') {
    super(`${operation} timed out after ${timeout}ms`, RabitErrorCodes.TIMEOUT);
  }
}

// --- Config Errors ---

export class ConfigurationError extends BaseRabitError {
  constructor(message: string) {
    super(message, RabitErrorCodes.INVALID_CONFIG);
  }
}

/**
 * Error handler interface
 */
export interface ErrorHandler {
  handle(error: RabitError): void | Promise<void>;
  canHandle?(error: RabitError): boolean;
}
