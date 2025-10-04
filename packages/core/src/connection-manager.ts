/**
 * Connection management for Rabit Core
 * Handles wallet connections, disconnections, and state management
 */
import type {
  WalletConnector,
  WalletType,
  ConnectOptions,
  ConnectResult,
  ConnectionStatus,
  WalletSession,
  ChainId,
  Address,
  ConnectionEvent,
  AccountEvent,
  ChainEvent,
  ErrorEvent,
  RabitEventEmitter,
  AsyncState,
  RabitError
} from '@rabit/types';
import { 
  ConnectionError, 
  WalletNotFoundError,
  ChainNotSupportedError,
  RabitErrorCodes
} from '@rabit/types';
import type { ConfigurationManager } from './configuration.js';

/**
 * Connection state interface
 */
interface ConnectionState {
  status: ConnectionStatus;
  connector?: WalletConnector;
  session?: WalletSession;
  accounts: Address[];
  chainId?: ChainId;
  lastConnected?: number;
  error?: RabitError;
}

/**
 * Connection manager for handling wallet connections
 */
export class ConnectionManager {
  private state: ConnectionState = {
    status: 'disconnected',
    accounts: []
  };

  private reconnectAttempts = 0;
  private reconnectTimer?: number; // Use number for browser compatibility

  constructor(
    private config: ConfigurationManager,
    private eventEmitter: RabitEventEmitter
  ) {
    this.setupAutoReconnect();
  }

  /**
   * Get current connection state
   */
  getState(): AsyncState<WalletSession, RabitError> {
    return {
      data: this.state.session,
      error: this.state.error,
      isLoading: this.state.status === 'connecting' || this.state.status === 'reconnecting',
      isSuccess: this.state.status === 'connected',
      isError: this.state.status === 'error'
    };
  }

  /**
   * Get current connection status
   */
  getStatus(): ConnectionStatus {
    return this.state.status;
  }

  /**
   * Get connected accounts
   */
  getAccounts(): Address[] {
    return [...this.state.accounts];
  }

  /**
   * Get current chain ID
   */
  getChainId(): ChainId | undefined {
    return this.state.chainId;
  }

  /**
   * Get current connector
   */
  getConnector(): WalletConnector | undefined {
    return this.state.connector;
  }

  /**
   * Check if currently connected
   */
  isConnected(): boolean {
    return this.state.status === 'connected' && this.state.accounts.length > 0;
  }

  /**
   * Connect to a wallet
   */
  async connect(walletType: WalletType, options?: ConnectOptions): Promise<ConnectResult> {
    try {
      this.updateStatus('connecting');
      
      // Find the connector
      const connector = this.findConnector(walletType);
      if (!connector) {
        throw new WalletNotFoundError(walletType);
      }

      // Check if wallet is available
      const availability = await connector.isAvailable();
      if (!availability.isAvailable) {
        throw new WalletNotFoundError(walletType);
      }

      // Validate chain if specified
      if (options?.chainId && !this.config.isChainSupported(options.chainId)) {
        throw new ChainNotSupportedError(options.chainId);
      }

      // Execute connection hooks
      const beforeHook = this.config.getConfig().hooks?.beforeConnect;
      if (beforeHook) {
        await Promise.resolve(beforeHook(connector));
      }

      // Connect to wallet
      const result = await connector.connect(options);

      // Update state
      this.state.connector = connector;
      this.state.accounts = result.accounts;
      this.state.chainId = result.chainId;
      this.state.lastConnected = Date.now();
      this.state.session = this.createSession(connector, result);
      this.state.error = undefined;
      this.reconnectAttempts = 0;

      this.updateStatus('connected');

      // Setup connector event listeners
      this.setupConnectorListeners(connector);

      // Emit events
      this.emitConnectionEvent('connection', {
        status: 'connected',
        connectorId: connector.id,
        walletType: connector.type,
        method: result.method,
        result
      });

      this.emitAccountEvent('connected', {
        accounts: result.accounts,
        connectorId: connector.id
      });

      // Execute after connection hooks
      const afterHook = this.config.getConfig().hooks?.afterConnect;
      if (afterHook) {
        await Promise.resolve(afterHook(result));
      }

      return result;

    } catch (error) {
      this.handleConnectionError(error as RabitError);
      throw error;
    }
  }

  /**
   * Disconnect from current wallet
   */
  async disconnect(): Promise<void> {
    try {
      const { connector } = this.state;

      // Execute before disconnect hooks
      const beforeHook = this.config.getConfig().hooks?.beforeDisconnect;
      if (beforeHook) {
        await Promise.resolve(beforeHook());
      }

      // Disconnect from connector
      if (connector) {
        await connector.disconnect();
        this.cleanupConnectorListeners(connector);
      }

      // Clear reconnect timer
      this.clearReconnectTimer();

      // Reset state
      const previousAccounts = this.state.accounts;
      this.state = {
        status: 'disconnected',
        accounts: []
      };

      // Emit events
      this.emitConnectionEvent('connection', {
        status: 'disconnected',
        connectorId: connector?.id || '',
        walletType: connector?.type || 'custom'
      });

      this.emitAccountEvent('disconnected', {
        accounts: [],
        previousAccounts,
        connectorId: connector?.id || ''
      });

      // Execute after disconnect hooks
      const afterHook = this.config.getConfig().hooks?.afterDisconnect;
      if (afterHook) {
        await Promise.resolve(afterHook());
      }

    } catch (error) {
      this.handleConnectionError(error as RabitError);
      throw error;
    }
  }

  /**
   * Switch to a different chain
   */
  async switchChain(chainId: ChainId): Promise<void> {
    if (!this.state.connector) {
      throw new ConnectionError('No wallet connected', RabitErrorCodes.NOT_CONNECTED);
    }

    if (!this.config.isChainSupported(chainId)) {
      throw new ChainNotSupportedError(chainId);
    }

    try {
      const previousChainId = this.state.chainId;
      
      await this.state.connector.switchChain(chainId);
      
      this.state.chainId = chainId;

      // Emit chain changed event
      this.emitChainEvent('changed', {
        chainId,
        previousChainId,
        connectorId: this.state.connector.id
      });

    } catch (error) {
      this.handleConnectionError(error as RabitError);
      throw error;
    }
  }

  /**
   * Reconnect to the last connected wallet
   */
  async reconnect(): Promise<void> {
    if (!this.state.connector) {
      throw new ConnectionError('No previous connection to restore', RabitErrorCodes.NOT_CONNECTED);
    }

    if (this.state.status === 'connecting' || this.state.status === 'reconnecting') {
      return; // Already attempting to connect
    }

    try {
      this.updateStatus('reconnecting');
      this.reconnectAttempts++;

      // Check if we've exceeded max attempts
      const maxAttempts = this.config.getSection('session')?.maxReconnectAttempts || 3;
      if (this.reconnectAttempts > maxAttempts) {
        throw new ConnectionError(`Max reconnection attempts (${maxAttempts}) exceeded`, RabitErrorCodes.CONNECTION_FAILED);
      }

      // Attempt to reconnect
      await this.connect(this.state.connector.type, {
        chainId: this.state.chainId,
        isReconnecting: true
      });

    } catch (error) {
      // Schedule next reconnect attempt
      this.scheduleReconnect();
      throw error;
    }
  }

  /**
   * Find connector by wallet type
   */
  private findConnector(walletType: WalletType): WalletConnector | undefined {
    return this.config.getConfig().connectors.find(connector => connector.type === walletType);
  }

  /**
   * Create wallet session
   */
  private createSession(connector: WalletConnector, result: ConnectResult): WalletSession {
    const sessionConfig = this.config.getSection('session');
    const now = Date.now();
    
    return {
      id: `${connector.id}-${now}`,
      accounts: result.accounts,
      chainId: result.chainId,
      connectorId: connector.id,
      expiresAt: sessionConfig?.expiryTime ? now + sessionConfig.expiryTime : undefined,
      metadata: {
        walletType: connector.type,
        connectionMethod: result.method,
        connectedAt: now
      }
    };
  }

  /**
   * Setup connector event listeners
   */
  private setupConnectorListeners(connector: WalletConnector): void {
    // Remove any existing listeners first
    this.cleanupConnectorListeners(connector);

    // Account changes
    connector.on('accountsChanged', (accounts: Address[]) => {
      const previousAccounts = this.state.accounts;
      this.state.accounts = accounts;
      
      if (this.state.session) {
        this.state.session.accounts = accounts;
      }

      this.emitAccountEvent('changed', {
        accounts,
        previousAccounts,
        connectorId: connector.id
      });
    });

    // Chain changes
    connector.on('chainChanged', (chainId: ChainId) => {
      const previousChainId = this.state.chainId;
      this.state.chainId = chainId;
      
      if (this.state.session) {
        this.state.session.chainId = chainId;
      }

      this.emitChainEvent('changed', {
        chainId,
        previousChainId,
        connectorId: connector.id
      });
    });

    // Disconnection
    connector.on('disconnect', () => {
      this.disconnect().catch(error => {
        this.handleConnectionError(error as RabitError);
      });
    });

    // Errors
    connector.on('error', (error: Error) => {
      this.handleConnectionError(error as RabitError);
    });
  }

  /**
   * Cleanup connector event listeners
   */
  private cleanupConnectorListeners(connector: WalletConnector): void {
    connector.removeAllListeners('accountsChanged');
    connector.removeAllListeners('chainChanged');
    connector.removeAllListeners('disconnect');
    connector.removeAllListeners('error');
  }

  /**
   * Update connection status
   */
  private updateStatus(status: ConnectionStatus): void {
    this.state.status = status;
  }

  /**
   * Handle connection errors
   */
  private handleConnectionError(error: RabitError): void {
    this.state.error = error;
    this.updateStatus('error');

    // Emit error event
    this.emitErrorEvent(error);

    // Execute error hook
    const errorHook = this.config.getConfig().hooks?.onError;
    if (errorHook) {
      Promise.resolve(errorHook(error)).catch(() => {
        // Ignore hook errors
      });
    }

    // Schedule reconnect if enabled and appropriate
    if (this.shouldAttemptReconnect(error)) {
      this.scheduleReconnect();
    }
  }

  /**
   * Check if should attempt reconnect
   */
  private shouldAttemptReconnect(error: RabitError): boolean {
    const sessionConfig = this.config.getSection('session');
    
    if (!sessionConfig?.autoReconnect) return false;
    if (this.reconnectAttempts >= (sessionConfig.maxReconnectAttempts || 3)) return false;
    
    // Don't reconnect for user rejection or wallet not found
    if (error instanceof ConnectionError && error.code === RabitErrorCodes.CONNECTION_REJECTED) return false;
    if (error instanceof WalletNotFoundError) return false;
    
    return true;
  }

  /**
   * Schedule reconnect attempt
   */
  private scheduleReconnect(): void {
    this.clearReconnectTimer();
    
    const sessionConfig = this.config.getSection('session');
    const delay = sessionConfig?.reconnectTimeout || 5000;
    
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnect().catch(() => {
        // Reconnect failed, will be handled by reconnect method
      });
    }, delay);
  }

  /**
   * Setup auto-reconnect on app start
   */
  private setupAutoReconnect(): void {
    const sessionConfig = this.config.getSection('session');
    
    if (!sessionConfig?.autoReconnect) return;

    // Try to restore previous session on initialization
    // This would typically involve reading from storage
    // For now, we'll just ensure the reconnect logic is in place
  }

  /**
   * Clear reconnect timer
   */
  private clearReconnectTimer(): void {
    if (this.reconnectTimer !== undefined) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
  }

  /**
   * Emit connection event
   */
  private emitConnectionEvent(action: string, data: Partial<ConnectionEvent['data']>): void {
    const event: ConnectionEvent = {
      type: 'connection',
      timestamp: Date.now(),
      source: 'connection-manager',
      data: {
        status: this.state.status,
        connectorId: '',
        walletType: 'custom',
        ...data
      }
    };

    this.eventEmitter.emit(event);
  }

  /**
   * Emit account event
   */
  private emitAccountEvent(action: string, data: Partial<AccountEvent['data']>): void {
    const event: AccountEvent = {
      type: 'account',
      timestamp: Date.now(),
      source: 'connection-manager',
      data: {
        action: action as any,
        accounts: this.state.accounts,
        connectorId: this.state.connector?.id || '',
        ...data
      }
    };

    this.eventEmitter.emit(event);
  }

  /**
   * Emit chain event
   */
  private emitChainEvent(action: string, data: Partial<ChainEvent['data']>): void {
    const event: ChainEvent = {
      type: 'chain',
      timestamp: Date.now(),
      source: 'connection-manager',
      data: {
        action: action as any,
        chainId: this.state.chainId!,
        connectorId: this.state.connector?.id || '',
        ...data
      }
    };

    this.eventEmitter.emit(event);
  }

  /**
   * Emit error event
   */
  private emitErrorEvent(error: RabitError): void {
    const event: ErrorEvent = {
      type: 'error',
      timestamp: Date.now(),
      source: 'connection-manager',
      data: {
        error: error,
        context: {
          action: 'connection',
          connectorId: this.state.connector?.id,
          chainId: this.state.chainId,
          account: this.state.accounts[0]
        }
      }
    };

    this.eventEmitter.emit(event);
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.clearReconnectTimer();
    
    if (this.state.connector) {
      this.cleanupConnectorListeners(this.state.connector);
    }
  }
}

/**
 * Create a connection manager instance
 */
export function createConnectionManager(
  config: ConfigurationManager,
  eventEmitter: RabitEventEmitter
): ConnectionManager {
  return new ConnectionManager(config, eventEmitter);
}