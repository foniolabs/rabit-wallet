/**
 * @rabit/core - Core wallet connection logic for Rabit
 * The wallet connector that actually works
 */

// Version export
export const version = '0.0.0';

// Core exports
export { createEventEmitter, globalEventEmitter, RabitEventEmitterImpl } from './event-emitter.js';
export { ConfigurationManager, ConfigurationValidator, createConfigurationManager } from './configuration.js';
export { ConnectionManager, createConnectionManager } from './connection-manager.js';
export { RabitCore, createRabitCore } from './rabit-core.js';

// Re-export all types from @rabit/types for convenience
export type * from '@rabit/types';

// Core interfaces for this package
export interface RabitCoreConfig {
  /**
   * Enable debug mode
   */
  debug?: boolean;
  
  /**
   * Custom event emitter instance
   */
  eventEmitter?: any; // Using any to avoid circular dependency
  
  /**
   * Enable persistence
   */
  persistence?: {
    enabled: boolean;
    storageKey?: string;
  };
}