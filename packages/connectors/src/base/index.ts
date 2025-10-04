/**
 * Base wallet connector implementation
 */
import type {
  WalletConnector,
  WalletType,
  ConnectionMethod,
  ConnectOptions,
  ConnectResult,
  WalletAvailability,
  WalletFeatures,
  TransactionRequest,
  Chain,
  RabitId,
  Metadata,
  ConnectionStatus,
  Address,
  ChainId,
  WalletConnectorEvents
} from '@rabit/types'
import type { Hash, Hex } from 'viem'
import { BaseRabitError, ConnectionError, RabitErrorCodes } from '@rabit/types'
import type { EIP1193Provider } from './eip1193-provider.js'

// Production-ready event emitter
class EventEmitter<TEvents extends Record<string, any[]>> {
  private listeners: Map<keyof TEvents, Set<(...args: any[]) => void>> = new Map()

  on<TEvent extends keyof TEvents>(
    event: TEvent,
    listener: (...args: TEvents[TEvent]) => void
  ): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(listener)
  }

  off<TEvent extends keyof TEvents>(
    event: TEvent,
    listener: (...args: TEvents[TEvent]) => void
  ): void {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      eventListeners.delete(listener)
      if (eventListeners.size === 0) {
        this.listeners.delete(event)
      }
    }
  }

  emit<TEvent extends keyof TEvents>(
    event: TEvent,
    ...args: TEvents[TEvent]
  ): boolean {
    const eventListeners = this.listeners.get(event)
    if (!eventListeners || eventListeners.size === 0) {
      return false
    }

    eventListeners.forEach(listener => {
      try {
        listener(...args)
      } catch (error) {
        console.error(`Error in event listener for ${String(event)}:`, error)
      }
    })
    
    return true
  }

  removeAllListeners<TEvent extends keyof TEvents>(event?: TEvent): void {
    if (event) {
      this.listeners.delete(event)
    } else {
      this.listeners.clear()
    }
  }

  listenerCount<TEvent extends keyof TEvents>(event: TEvent): number {
    return this.listeners.get(event)?.size || 0
  }
}

export abstract class BaseWalletConnector extends EventEmitter<WalletConnectorEvents> implements WalletConnector {
  readonly id: RabitId
  readonly type: WalletType
  readonly metadata: Metadata
  readonly connectionMethods: ConnectionMethod[]
  readonly features: WalletFeatures
  
  protected _status: ConnectionStatus = 'disconnected'
  protected _provider: EIP1193Provider | null = null
  protected _accounts: Address[] = []
  protected _chainId: ChainId | undefined

  constructor(
    config: {
      id: RabitId
      type: WalletType
      metadata: Metadata
      connectionMethods: ConnectionMethod[]
      features: WalletFeatures
    }
  ) {
    super()
    this.id = config.id
    this.type = config.type
    this.metadata = config.metadata
    this.connectionMethods = config.connectionMethods
    this.features = config.features
  }

  get status(): ConnectionStatus {
    return this._status
  }

  /**
   * Abstract methods to be implemented by specific connectors
   */
  abstract isAvailable(): Promise<WalletAvailability>
  abstract getProvider(): Promise<EIP1193Provider>
  
  /**
   * Connect to the wallet
   */
  async connect(options?: ConnectOptions): Promise<ConnectResult> {
    try {
      this._status = 'connecting'
      this.emit('statusChanged', this._status)

      // Get provider
      this._provider = await this.getProvider()
      
      // Setup provider listeners
      this.setupProviderListeners()
      
      // Request account access
      const accounts = await this._provider.request({
        method: 'eth_requestAccounts'
      }) as Address[]
      
      if (!accounts || accounts.length === 0) {
        throw new ConnectionError('No accounts returned from wallet')
      }
      
      // Get chain ID
      const chainId = await this._provider.request({
        method: 'eth_chainId'
      }) as string
      
      this._accounts = accounts
      this._chainId = parseInt(chainId, 16)
      this._status = 'connected'
      
      const result: ConnectResult = {
        accounts: this._accounts,
        chainId: this._chainId,
        method: options?.method || this.connectionMethods[0] || 'extension',
        data: {
          provider: this._provider
        }
      }
      
      this.emit('connect', result)
      this.emit('statusChanged', this._status)
      
      return result
      
    } catch (error) {
      this._status = 'error'
      this.emit('statusChanged', this._status)
      throw error
    }
  }

  /**
   * Disconnect from the wallet
   */
  async disconnect(): Promise<void> {
    try {
      this.removeProviderListeners()
      
      this._provider = null
      this._accounts = []
      this._chainId = undefined
      this._status = 'disconnected'
      
      this.emit('disconnect')
      this.emit('statusChanged', this._status)
      
    } catch (error) {
      this._status = 'error'
      this.emit('statusChanged', this._status)
      throw error
    }
  }

  /**
   * Get connected accounts
   */
  async getAccounts(): Promise<Address[]> {
    if (!this._provider) {
      return []
    }
    
    try {
      const accounts = await this._provider.request({
        method: 'eth_accounts'
      }) as Address[]
      
      this._accounts = accounts
      return accounts
      
    } catch (error) {
      console.error('Failed to get accounts:', error)
      return []
    }
  }

  /**
   * Get current chain ID
   */
  async getChainId(): Promise<ChainId> {
    if (!this._provider) {
      throw new ConnectionError('Not connected to wallet')
    }
    
    const chainId = await this._provider.request({
      method: 'eth_chainId'
    }) as string
    
    this._chainId = parseInt(chainId, 16)
    return this._chainId
  }

  /**
   * Switch to different chain
   */
  async switchChain(chainId: ChainId): Promise<void> {
    if (!this._provider) {
      throw new ConnectionError('Not connected to wallet')
    }
    
    try {
      await this._provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }]
      })
      
      this._chainId = chainId
      this.emit('chainChanged', chainId)
      
    } catch (error: any) {
      // Chain not added to wallet
      if (error.code === 4902) {
        throw new BaseRabitError(
          `Chain ${chainId} not added to wallet. Please add it first.`,
          RabitErrorCodes.CHAIN_NOT_SUPPORTED
        )
      }
      throw error
    }
  }

  /**
   * Add a new chain to the wallet
   */
  async addChain(chain: Chain): Promise<void> {
    if (!this._provider) {
      throw new ConnectionError('Not connected to wallet')
    }
    
    await this._provider.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: `0x${chain.id.toString(16)}`,
        chainName: chain.name,
        nativeCurrency: chain.nativeCurrency,
        rpcUrls: chain.rpcUrls.default.map(endpoint => endpoint.url),
        blockExplorerUrls: chain.blockExplorers 
          ? [chain.blockExplorers.default.url]
          : undefined
      }]
    })
  }

  /**
   * Sign a message
   */
  async signMessage(message: string | Hex): Promise<Hex> {
    if (!this._provider || this._accounts.length === 0) {
      throw new ConnectionError('Not connected to wallet')
    }
    
    const signature = await this._provider.request({
      method: 'personal_sign',
      params: [message, this._accounts[0]]
    }) as Hex
    
    return signature
  }

  /**
   * Sign typed data
   */
  async signTypedData(typedData: any): Promise<Hex> {
    if (!this._provider || this._accounts.length === 0) {
      throw new ConnectionError('Not connected to wallet')
    }
    
    const signature = await this._provider.request({
      method: 'eth_signTypedData_v4',
      params: [this._accounts[0], JSON.stringify(typedData)]
    }) as Hex
    
    return signature
  }

  /**
   * Send transaction
   */
  async sendTransaction(transaction: TransactionRequest): Promise<Hash> {
    if (!this._provider || this._accounts.length === 0) {
      throw new ConnectionError('Not connected to wallet')
    }
    
    const txParams = {
      from: this._accounts[0],
      to: transaction.to,
      value: transaction.value ? `0x${transaction.value.toString(16)}` : undefined,
      data: transaction.data,
      gas: transaction.gas ? `0x${transaction.gas.toString(16)}` : undefined,
      gasPrice: transaction.gasPrice ? `0x${transaction.gasPrice.toString(16)}` : undefined,
      maxFeePerGas: transaction.maxFeePerGas ? `0x${transaction.maxFeePerGas.toString(16)}` : undefined,
      maxPriorityFeePerGas: transaction.maxPriorityFeePerGas ? `0x${transaction.maxPriorityFeePerGas.toString(16)}` : undefined,
      nonce: transaction.nonce ? `0x${transaction.nonce.toString(16)}` : undefined
    }
    
    const hash = await this._provider.request({
      method: 'eth_sendTransaction',
      params: [txParams]
    }) as Hash
    
    return hash
  }

  /**
   * Setup provider event listeners
   */
  protected setupProviderListeners(): void {
    if (!this._provider) return
    
    this._provider.on?.('accountsChanged', this.handleAccountsChanged.bind(this))
    this._provider.on?.('chainChanged', this.handleChainChanged.bind(this))
    this._provider.on?.('disconnect', this.handleDisconnect.bind(this))
  }

  /**
   * Remove provider event listeners  
   */
  protected removeProviderListeners(): void {
    if (!this._provider) return
    
    this._provider.removeListener?.('accountsChanged', this.handleAccountsChanged.bind(this))
    this._provider.removeListener?.('chainChanged', this.handleChainChanged.bind(this))
    this._provider.removeListener?.('disconnect', this.handleDisconnect.bind(this))
  }

  /**
   * Handle accounts changed event
   */
  protected handleAccountsChanged(accounts: Address[]): void {
    this._accounts = accounts
    
    this.emit('accountsChanged', accounts)
    
    if (accounts.length === 0) {
      this.disconnect()
    }
  }

  /**
   * Handle chain changed event
   */
  protected handleChainChanged(chainId: string): void {
    const newChainId = parseInt(chainId, 16)
    this._chainId = newChainId
    
    this.emit('chainChanged', newChainId)
  }

  /**
   * Handle disconnect event
   */
  protected handleDisconnect(): void {
    this.disconnect()
  }
}