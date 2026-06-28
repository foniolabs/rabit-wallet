/**
 * Base types used throughout Rabit
 */

/**
 * Version string
 */
export type Version = `${number}.${number}.${number}`;

/**
 * Unique identifier
 */
export type RabitId = string;

/**
 * Base error interface
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
export interface EventEmitter<TEvents extends Record<string, unknown[]> = Record<string, unknown[]>> {
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
 * Generic async state
 */
export interface AsyncState<TData = unknown, TError = RabitError> {
  data?: TData;
  error?: TError;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
}

/**
 * Platform detection
 */
export interface Platform {
  isBrowser: boolean;
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
}

/**
 * Custom storage interface
 */
export interface StorageAdapter {
  getItem: (key: string) => string | null | Promise<string | null>;
  setItem: (key: string, value: string) => void | Promise<void>;
  removeItem: (key: string) => void | Promise<void>;
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  attempts?: number;
  delay?: number;
  exponentialBackoff?: boolean;
}
