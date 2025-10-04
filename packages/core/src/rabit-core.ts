/**
 * Main Rabit Core class - orchestrates all core functionality
 */
import type {
  RabitConfig,
  WalletType,
  ConnectOptions,
  ConnectResult,
  ConnectionStatus,
  WalletSession,
  ChainId,
  Address,
  RabitEventEmitter,
  AsyncState,
  WalletConnector,
  Chain,
  TransactionRequest,
  Hash,
  RabitResponse,
  RabitEvent,
  EventListener
} from '@rabit/types';

import { ConfigurationManager, createConfigurationManager } from './configuration.js';
import { ConnectionManager, createConnectionManager } from './connection-manager.js';
import { createEventEmitter } from './event-emitter.js';
import type { RabitCoreConfig } from './index.js';

/**
 * Main Rabit Core class that provides the complete wallet connection API
 */
export class RabitCore {
  private configManager: ConfigurationManager;
  private connectionManager: ConnectionManager;
  private eventEmitter: RabitEventEmitter;
  private isInitialized = false;

  constructor(
    config: RabitConfig,
    options: RabitCoreConfig = {}
  ) {
    // Create event emitter
    this.eventEmitter = options.eventEmitter || createEventEmitter();
    
    // Create configuration manager
    this.configManager = createConfigurationManager(config);
    
    // Create connection manager
    this.connectionManager = createConnectionManager(this.configManager, this.eventEmitter);
    
    // Set debug mode
    if (options.debug || config.debug) {
      this.enableDebugMode();
    }
    
    this.isInitialized = true;
  }

  // ================================
  // Public API Methods
  // ================================

  /**
   * Connect to a wallet
   */
  async connect(walletType: WalletType, options?: ConnectOptions): Promise<RabitResponse<ConnectResult>> {
    this.ensureInitialized();
    
    try {
      const result = await this.connectionManager.connect(walletType, options);
      
      return {
        success: true,
        data: result,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: error as any,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Disconnect from current wallet
   */
  async disconnect(): Promise<RabitResponse<void>> {
    this.ensureInitialized();
    
    try {
      await this.connectionManager.disconnect();
      
      return {
        success: true,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: error as any,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Switch to a different chain
   */
  async switchChain(chainId: ChainId): Promise<RabitResponse<void>> {
    this.ensureInitialized();
    
    try {
      await this.connectionManager.switchChain(chainId);
      
      return {
        success: true,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: error as any,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Send a transaction
   */
  async sendTransaction(transaction: TransactionRequest): Promise<RabitResponse<Hash>> {
    this.ensureInitialized();
    
    try {
      const connector = this.connectionManager.getConnector();
      if (!connector) {
        throw new Error('No wallet connected');
      }

      const hash = await connector.sendTransaction(transaction);
      
      return {
        success: true,
        data: hash,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: error as any,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Sign a message
   */
  async signMessage(message: string): Promise<RabitResponse<string>> {
    this.ensureInitialized();
    
    try {
      const connector = this.connectionManager.getConnector();
      if (!connector) {
        throw new Error('No wallet connected');
      }

      const signature = await connector.signMessage(message);
      
      return {
        success: true,
        data: signature,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: error as any,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Sign typed data
   */
  async signTypedData(typedData: any): Promise<RabitResponse<string>> {
    this.ensureInitialized();
    
    try {
      const connector = this.connectionManager.getConnector();
      if (!connector) {
        throw new Error('No wallet connected');
      }

      const signature = await connector.signTypedData(typedData);
      
      return {
        success: true,
        data: signature,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: error as any,
        timestamp: Date.now()
      };
    }
  }

  // ================================
  // State Getters
  // ================================

  /**
   * Get current connection state
   */
  getConnectionState(): AsyncState<WalletSession> {
    this.ensureInitialized();
    return this.connectionManager.getState();
  }

  /**
   * Get current connection status
   */
  getStatus(): ConnectionStatus {
    this.ensureInitialized();
    return this.connectionManager.getStatus();
  }

  /**
   * Get connected accounts
   */
  getAccounts(): Address[] {
    this.ensureInitialized();
    return this.connectionManager.getAccounts();
  }

  /**
   * Get current chain ID
   */
  getChainId(): ChainId | undefined {
    this.ensureInitialized();
    return this.connectionManager.getChainId();
  }

  /**
   * Get current connector
   */
  getConnector(): WalletConnector | undefined {
    this.ensureInitialized();
    return this.connectionManager.getConnector();
  }

  /**
   * Check if currently connected
   */
  isConnected(): boolean {
    this.ensureInitialized();
    return this.connectionManager.isConnected();
  }

  /**
   * Get available chains
   */
  getChains(): Chain[] {
    this.ensureInitialized();
    return this.configManager.getChains();
  }

  /**
   * Get chain by ID
   */
  getChain(chainId: ChainId): Chain | undefined {
    this.ensureInitialized();
    return this.configManager.getChain(chainId);
  }

  /**
   * Check if chain is supported
   */
  isChainSupported(chainId: ChainId): boolean {
    this.ensureInitialized();
    return this.configManager.isChainSupported(chainId);
  }

  /**
   * Get available connectors
   */
  getConnectors(): WalletConnector[] {
    this.ensureInitialized();
    return this.configManager.getConfig().connectors;
  }

  /**
   * Get configuration
   */
  getConfig(): RabitConfig {
    this.ensureInitialized();
    return this.configManager.getConfig();
  }

  // ================================
  // Event Management
  // ================================

  /**
   * Subscribe to events
   */
  on<T extends RabitEvent['type']>(
    eventType: T,
    listener: EventListener<Extract<RabitEvent, { type: T }>>
  ): () => void {
    this.ensureInitialized();
    return this.eventEmitter.on(eventType, listener);
  }

  /**
   * Subscribe to events once
   */
  once<T extends RabitEvent['type']>(
    eventType: T,
    listener: EventListener<Extract<RabitEvent, { type: T }>>
  ): () => void {
    this.ensureInitialized();
    return this.eventEmitter.once(eventType, listener);
  }

  /**
   * Unsubscribe from events
   */
  off<T extends RabitEvent['type']>(
    eventType: T,
    listener: EventListener<Extract<RabitEvent, { type: T }>>
  ): void {
    this.ensureInitialized();
    this.eventEmitter.off(eventType, listener);
  }

  /**
   * Get event emitter
   */
  getEventEmitter(): RabitEventEmitter {
    this.ensureInitialized();
    return this.eventEmitter;
  }

  // ================================
  // Utility Methods
  // ================================

  /**
   * Reconnect to the last connected wallet
   */
  async reconnect(): Promise<RabitResponse<void>> {
    this.ensureInitialized();
    
    try {
      await this.connectionManager.reconnect();
      
      return {
        success: true,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: error as any,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<RabitConfig>): void {
    this.ensureInitialized();
    this.configManager.updateConfig(updates);
  }

  /**
   * Check if smart accounts are enabled
   */
  isSmartAccountEnabled(): boolean {
    this.ensureInitialized();
    return this.configManager.isSmartAccountEnabled();
  }

  /**
   * Check if analytics are enabled
   */
  isAnalyticsEnabled(): boolean {
    this.ensureInitialized();
    return this.configManager.isAnalyticsEnabled();
  }

  /**
   * Get the current session
   */
  getSession(): WalletSession | undefined {
    this.ensureInitialized();
    const state = this.connectionManager.getState();
    return state.data;
  }

  /**
   * Clear any stored session data
   */
  clearSession(): void {
    this.ensureInitialized();
    // This would typically clear stored session data
    // Implementation depends on storage strategy
  }

  // ================================
  // Lifecycle Methods
  // ================================

  /**
   * Initialize the core (if not already initialized)
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    // Perform any async initialization here
    // For now, everything is synchronous
    this.isInitialized = true;
  }

  /**
   * Destroy the core and cleanup resources
   */
  async destroy(): Promise<void> {
    if (!this.isInitialized) return;
    
    // Disconnect if connected
    if (this.connectionManager.isConnected()) {
      await this.connectionManager.disconnect();
    }
    
    // Cleanup connection manager
    this.connectionManager.destroy();
    
    // Clear all event listeners
    this.eventEmitter.removeAllListeners();
    
    this.isInitialized = false;
  }

  // ================================
  // Private Methods
  // ================================

  /**
   * Ensure the core is initialized
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('Rabit Core is not initialized. Call initialize() first.');
    }
  }

  /**
   * Enable debug mode
   */
  private enableDebugMode(): void {
    // Add debug event listeners
    this.eventEmitter.on('connection', (event) => {
      console.debug('[Rabit Core] Connection event:', event);
    });
    
    this.eventEmitter.on('account', (event) => {
      console.debug('[Rabit Core] Account event:', event);
    });
    
    this.eventEmitter.on('chain', (event) => {
      console.debug('[Rabit Core] Chain event:', event);
    });
    
    this.eventEmitter.on('error', (event) => {
      console.debug('[Rabit Core] Error event:', event);
    });
  }
}

/**
 * Create a new Rabit Core instance
 */
export function createRabitCore(config: RabitConfig, options?: RabitCoreConfig): RabitCore {
  return new RabitCore(config, options);
}

/**
 * Default export for convenience
 */
export default RabitCore;