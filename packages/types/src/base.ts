// Core types & interfaces

import type { Address, Hash, Hex } from 'viem';

/**
 * Base types used throughout Rabit
 */

/**
 * Version string for Rabit packages
 */
export type Version = `${number}.${number}.${number}${'.' | '-'}${string}` | `${number}.${number}.${number}`;

/**
 * Unique identifier for various Rabit entities
 */
export type RabitId = string;

/**
 * Wallet connection status
 */
export type ConnectionStatus = 
  | 'disconnected'
  | 'connecting' 
  | 'connected'
  | 'reconnecting'
  | 'error';

/**
 * Base error types for Rabit
 */
export interface RabitError extends Error {
  readonly name: string;
  readonly message: string;
  readonly code?: string | number;
  readonly details?: Record<string, unknown>;
  readonly cause?: Error;
}

/**
 * Generic event emitter interface
 */
export interface EventEmitter<TEvents extends Record<string, any[]> = Record<string, any[]>> {
  on<TEvent extends keyof TEvents>(
    event: TEvent,
    listener: (...args: TEvents[TEvent]) => void
  ): void;
  
  off<TEvent extends keyof TEvents>(
    event: TEvent,
    listener: (...args: TEvents[TEvent]) => void
  ): void;
  
  emit<TEvent extends keyof TEvents>(
    event: TEvent,
    ...args: TEvents[TEvent]
  ): boolean;
  
  removeAllListeners<TEvent extends keyof TEvents>(event?: TEvent): void;
}

/**
 * Configuration options that can be overridden
 */
export interface BaseConfig {
  /**
   * Custom theme configuration
   */
  theme?: {
    mode?: 'light' | 'dark' | 'auto';
    colors?: Record<string, string>;
    borderRadius?: 'none' | 'small' | 'medium' | 'large';
  };
  
  /**
   * Whether to show debug information
   */
  debug?: boolean;
  
  /**
   * Custom storage implementation
   */
  storage?: {
    getItem: (key: string) => string | null | Promise<string | null>;
    setItem: (key: string, value: string) => void | Promise<void>;
    removeItem: (key: string) => void | Promise<void>;
  };
}

/**
 * Metadata about an entity
 */
export interface Metadata {
  /**
   * Display name
   */
  name: string;
  
  /**
   * Description
   */
  description?: string;
  
  /**
   * URL to icon/logo
   */
  icon?: string;
  
  /**
   * Additional URLs
   */
  urls?: {
    website?: string;
    documentation?: string;
    support?: string;
    privacy?: string;
    terms?: string;
  };
}

/**
 * Platform detection
 */
export interface Platform {
  /**
   * Whether running in browser environment
   */
  isBrowser: boolean;
  
  /**
   * Whether running on mobile device
   */
  isMobile: boolean;
  
  /**
   * Whether running on iOS
   */
  isIOS: boolean;
  
  /**
   * Whether running on Android
   */
  isAndroid: boolean;
  
  /**
   * Whether wallet extension is detected
   */
  hasWalletExtension: boolean;
}

/**
 * Generic async state
 */
export interface AsyncState<TData = unknown, TError = RabitError> {
  /**
   * Current data
   */
  data?: TData;
  
  /**
   * Current error
   */
  error?: TError;
  
  /**
   * Whether currently loading
   */
  isLoading: boolean;
  
  /**
   * Whether operation was successful
   */
  isSuccess: boolean;
  
  /**
   * Whether operation failed
   */
  isError: boolean;
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  /**
   * Number of retry attempts
   */
  attempts?: number;
  
  /**
   * Delay between retries in milliseconds
   */
  delay?: number;
  
  /**
   * Whether to use exponential backoff
   */
  exponentialBackoff?: boolean;
}