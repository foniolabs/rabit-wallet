/**
 * Event system types for Rabit embedded wallet
 */

import type { AuthStatus, AuthUser } from './auth.js';
import type { ChainId } from './chain.js';
import type { ChainEcosystem, AccountType, WalletAccount } from './wallet.js';

/**
 * Base event interface
 */
export interface BaseEvent {
  type: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

/**
 * Auth events
 */
export interface AuthEvent extends BaseEvent {
  type: 'auth';
  data: {
    action: 'login_started' | 'otp_sent' | 'otp_verified' | 'authenticated' | 'logged_out' | 'session_refreshed' | 'error';
    status: AuthStatus;
    user?: AuthUser;
    error?: Error;
  };
}

/**
 * Wallet events
 */
export interface WalletEvent extends BaseEvent {
  type: 'wallet';
  data: {
    action: 'initialized' | 'account_switched' | 'account_created' | 'chain_switched' | 'destroyed';
    account?: WalletAccount;
    previousAccount?: WalletAccount;
    chainId?: ChainId;
    previousChainId?: ChainId;
  };
}

/**
 * Transaction events
 */
export interface TransactionEvent extends BaseEvent {
  type: 'transaction';
  data: {
    action: 'sent' | 'confirmed' | 'failed';
    hash: string;
    ecosystem: ChainEcosystem;
    from: string;
    to?: string;
    value?: string;
    chainId?: ChainId;
    error?: Error;
  };
}

/**
 * Smart account events
 */
export interface SmartAccountEvent extends BaseEvent {
  type: 'smart_account';
  data: {
    action: 'deployed' | 'user_op_sent' | 'user_op_confirmed' | 'user_op_failed' | 'session_created' | 'session_revoked';
    accountAddress: string;
    chainId: ChainId;
    userOpHash?: string;
    error?: Error;
  };
}

/**
 * On-ramp events
 */
export interface OnRampEvent extends BaseEvent {
  type: 'onramp';
  data: {
    action: 'quote_requested' | 'order_created' | 'payment_received' | 'completed' | 'failed';
    orderId?: string;
    fiatAmount?: string;
    fiatCurrency?: string;
    cryptoAmount?: string;
    cryptoSymbol?: string;
    error?: Error;
  };
}

/**
 * Off-ramp events
 */
export interface OffRampEvent extends BaseEvent {
  type: 'offramp';
  data: {
    action: 'quote_requested' | 'order_created' | 'crypto_deposited' | 'payout_sent' | 'completed' | 'failed';
    orderId?: string;
    cryptoAmount?: string;
    cryptoSymbol?: string;
    fiatAmount?: string;
    fiatCurrency?: string;
    error?: Error;
  };
}

/**
 * Error events
 */
export interface ErrorEvent extends BaseEvent {
  type: 'error';
  data: {
    error: Error;
    context?: {
      action?: string;
      ecosystem?: ChainEcosystem;
      accountType?: AccountType;
      chainId?: ChainId;
    };
  };
}

/**
 * Union of all Rabit events
 */
export type RabitEvent =
  | AuthEvent
  | WalletEvent
  | TransactionEvent
  | SmartAccountEvent
  | OnRampEvent
  | OffRampEvent
  | ErrorEvent;

/**
 * Event listener
 */
export type EventListener<T extends RabitEvent = RabitEvent> = (event: T) => void;

/**
 * Typed event emitter interface
 */
export interface RabitEventEmitter {
  on<T extends RabitEvent['type']>(
    eventType: T,
    listener: EventListener<Extract<RabitEvent, { type: T }>>
  ): () => void;

  once<T extends RabitEvent['type']>(
    eventType: T,
    listener: EventListener<Extract<RabitEvent, { type: T }>>
  ): () => void;

  off<T extends RabitEvent['type']>(
    eventType: T,
    listener: EventListener<Extract<RabitEvent, { type: T }>>
  ): void;

  emit<T extends RabitEvent>(event: T): void;

  removeAllListeners(eventType?: RabitEvent['type']): void;
}
