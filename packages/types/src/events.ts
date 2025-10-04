// Event system types
import type { Address, Hash } from 'viem';
import type { RabitId, ConnectionStatus, RabitError } from './base.js';
import type { ChainId } from './chain.js';
import type { WalletType, ConnectionMethod, ConnectResult } from './wallet.js';

/**
 * Event system types for Rabit
 */

/**
 * Base event interface
 */
export interface BaseEvent {
  /**
   * Event type
   */
  type: string;
  
  /**
   * Event timestamp
   */
  timestamp: number;
  
  /**
   * Event source
   */
  source?: RabitId;
  
  /**
   * Event metadata
   */
  metadata?: Record<string, unknown>;
}

/**
 * Connection events
 */
export interface ConnectionEvent extends BaseEvent {
  type: 'connection';
  data: {
    status: ConnectionStatus;
    connectorId: RabitId;
    walletType: WalletType;
    method?: ConnectionMethod;
    result?: ConnectResult;
    error?: RabitError;
  };
}

/**
 * Account events
 */
export interface AccountEvent extends BaseEvent {
  type: 'account';
  data: {
    action: 'connected' | 'disconnected' | 'changed' | 'updated';
    accounts: Address[];
    previousAccounts?: Address[];
    connectorId: RabitId;
  };
}

/**
 * Chain events
 */
export interface ChainEvent extends BaseEvent {
  type: 'chain';
  data: {
    action: 'changed' | 'added' | 'switched';
    chainId: ChainId;
    previousChainId?: ChainId;
    connectorId: RabitId;
  };
}

/**
 * Transaction events
 */
export interface TransactionEvent extends BaseEvent {
  type: 'transaction';
  data: {
    action: 'sent' | 'confirmed' | 'failed' | 'replaced';
    hash: Hash;
    from: Address;
    to?: Address;
    value?: bigint;
    chainId: ChainId;
    gasUsed?: bigint;
    gasPrice?: bigint;
    blockNumber?: bigint;
    error?: RabitError;
  };
}

/**
 * Smart account events
 */
export interface SmartAccountEvent extends BaseEvent {
  type: 'smartAccount';
  data: {
    action: 'created' | 'deployed' | 'executed' | 'sessionCreated' | 'sessionRevoked';
    accountAddress: Address;
    chainId: ChainId;
    userOpHash?: Hash;
    sessionKey?: Address;
    error?: RabitError;
  };
}

/**
 * Error events
 */
export interface ErrorEvent extends BaseEvent {
  type: 'error';
  data: {
    error: RabitError;
    context?: {
      action?: string;
      connectorId?: RabitId;
      chainId?: ChainId;
      account?: Address;
    };
  };
}

/**
 * UI events
 */
export interface UIEvent extends BaseEvent {
  type: 'ui';
  data: {
    action: 'modalOpened' | 'modalClosed' | 'walletSelected' | 'chainSelected';
    component?: string;
    walletType?: WalletType;
    chainId?: ChainId;
  };
}

/**
 * Analytics events
 */
export interface AnalyticsEvent extends BaseEvent {
  type: 'analytics';
  data: {
    event: string;
    properties?: Record<string, unknown>;
    userId?: string;
    sessionId?: string;
  };
}

/**
 * Union of all Rabit events
 */
export type RabitEvent = 
  | ConnectionEvent
  | AccountEvent
  | ChainEvent
  | TransactionEvent
  | SmartAccountEvent
  | ErrorEvent
  | UIEvent
  | AnalyticsEvent;

/**
 * Event listener function
 */
export type EventListener<T extends RabitEvent = RabitEvent> = (event: T) => void;

/**
 * Event emitter interface for Rabit
 */
export interface RabitEventEmitter {
  /**
   * Subscribe to events
   */
  on<T extends RabitEvent['type']>(
    eventType: T,
    listener: EventListener<Extract<RabitEvent, { type: T }>>
  ): () => void;
  
  /**
   * Subscribe to events (one-time)
   */
  once<T extends RabitEvent['type']>(
    eventType: T,
    listener: EventListener<Extract<RabitEvent, { type: T }>>
  ): () => void;
  
  /**
   * Unsubscribe from events
   */
  off<T extends RabitEvent['type']>(
    eventType: T,
    listener: EventListener<Extract<RabitEvent, { type: T }>>
  ): void;
  
  /**
   * Emit an event
   */
  emit<T extends RabitEvent>(event: T): void;
  
  /**
   * Remove all listeners
   */
  removeAllListeners(eventType?: RabitEvent['type']): void;
  
  /**
   * Get listener count
   */
  listenerCount(eventType: RabitEvent['type']): number;
}

/**
 * Event filter options
 */
export interface EventFilter {
  /**
   * Event types to include
   */
  types?: RabitEvent['type'][];
  
  /**
   * Source connectors to include
   */
  sources?: RabitId[];
  
  /**
   * Date range filter
   */
  dateRange?: {
    from?: Date;
    to?: Date;
  };
  
  /**
   * Chain ID filter
   */
  chainId?: ChainId;
  
  /**
   * Account filter
   */
  account?: Address;
}

/**
 * Event subscription options
 */
export interface SubscriptionOptions {
  /**
   * Event filter
   */
  filter?: EventFilter;
  
  /**
   * Whether to receive historical events
   */
  includeHistory?: boolean;
  
  /**
   * Maximum number of historical events
   */
  historyLimit?: number;
  
  /**
   * Debounce time in milliseconds
   */
  debounce?: number;
}