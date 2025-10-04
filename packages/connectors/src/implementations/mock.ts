/**
 * Mock connector for testing purposes
 */
import type {
  WalletAvailability,
  Platform,
  ConnectionMethod,
  WalletFeatures,
  ConnectOptions,
  ConnectResult,
  Address,
  ChainId
} from '@rabit/types'
import { BaseWalletConnector } from '../base/index.js'
import type { EIP1193Provider, EIP1193RequestArguments } from '../base/eip1193-provider.js'

export interface MockConnectorConfig {
  accounts?: Address[]
  chainId?: ChainId
  isConnected?: boolean
  name?: string
  features?: Partial<WalletFeatures>
  shouldFailConnection?: boolean
  connectionDelay?: number
}

export class MockConnector extends BaseWalletConnector {
  private mockProvider: MockEIP1193Provider
  private config: MockConnectorConfig

  constructor(config: MockConnectorConfig = {}) {
    super({
      id: 'mock',
      type: 'injected', // Use 'injected' instead of 'mock'
      metadata: {
        name: config.name || 'Mock Wallet',
        description: 'Mock wallet for testing',
        icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iOCIgZmlsbD0iIzAwN0FGRiIvPgo8L3N2Zz4=',
        urls: {
          website: 'https://example.com',
          documentation: 'https://example.com/docs',
          support: 'https://example.com/support'
        }
      },
      connectionMethods: ['extension'] as ConnectionMethod[],
      features: {
        signMessage: true,
        signTypedData: true,
        personalSign: true,
        switchChain: true,
        addChain: true,
        watchAsset: true,
        batchTransactions: false,
        sessions: false,
        isSmartWallet: false,
        accountAbstraction: false,
        gaslessTransactions: false,
        ...config.features
      } as WalletFeatures
    })

    this.config = config
    this.mockProvider = new MockEIP1193Provider(config, this)

    if (config.isConnected) {
      this._accounts = config.accounts || ['0x1234567890123456789012345678901234567890' as Address]
      this._chainId = config.chainId || 1
      this._status = 'connected'
      this._provider = this.mockProvider
    }
  }

  async isAvailable(): Promise<WalletAvailability> {
    return {
      isAvailable: true,
      isInstalled: true,
      isReady: true,
      downloadUrl: '',
      platforms: [
        {
          isBrowser: true,
          isMobile: false,
          isIOS: false,
          isAndroid: false,
          hasWalletExtension: true
        }
      ] as Platform[]
    }
  }

  async getProvider(): Promise<EIP1193Provider> {
    return this.mockProvider
  }

  async connect(options?: ConnectOptions): Promise<ConnectResult> {
    if (this.config.shouldFailConnection) {
      throw new Error('Mock connection failed')
    }

    // Simulate connection delay
    if (this.config.connectionDelay) {
      await new Promise(resolve => setTimeout(resolve, this.config.connectionDelay))
    }

    const accounts = this.config.accounts || ['0x1234567890123456789012345678901234567890' as Address]
    const chainId = this.config.chainId || 1

    this._accounts = accounts
    this._chainId = chainId
    this._status = 'connected'
    this._provider = this.mockProvider

    const result: ConnectResult = {
      accounts,
      chainId,
      method: options?.method || 'extension',
      data: {
        provider: this.mockProvider
      }
    }

    this.emit('connect', result)
    this.emit('statusChanged', this._status)
    
    return result
  }

  /**
   * Mock-specific methods for testing
   */
  setAccounts(accounts: Address[]): void {
    this.config.accounts = accounts
    this._accounts = accounts
    this.emit('accountsChanged', accounts)
  }

  setChainId(chainId: ChainId): void {
    this.config.chainId = chainId
    this._chainId = chainId
    this.emit('chainChanged', chainId)
  }

  simulateDisconnect(): void {
    this._status = 'disconnected'
    this._accounts = []
    this._chainId = undefined
    this._provider = null
    this.emit('disconnect')
    this.emit('statusChanged', this._status)
  }

  simulateAccountsChanged(accounts: Address[]): void {
    this.setAccounts(accounts)
  }

  simulateChainChanged(chainId: ChainId): void {
    this.setChainId(chainId)
  }

  simulateError(error: Error): void {
    this._status = 'error'
    this.emit('statusChanged', this._status)
    throw error
  }

  /**
   * Update configuration at runtime
   */
  updateConfig(newConfig: Partial<MockConnectorConfig>): void {
    this.config = { ...this.config, ...newConfig }
    this.mockProvider.updateConfig(this.config)
  }
}

class MockEIP1193Provider implements EIP1193Provider {
  private config: MockConnectorConfig
  private connector: MockConnector
  private eventListeners: Map<string, Set<(...args: any[]) => void>> = new Map()

  constructor(config: MockConnectorConfig, connector: MockConnector) {
    this.config = config
    this.connector = connector
  }

  async request(args: EIP1193RequestArguments): Promise<any> {
    const { method, params } = args

    switch (method) {
      case 'eth_requestAccounts':
      case 'eth_accounts':
        return this.config.accounts || ['0x1234567890123456789012345678901234567890']
      
      case 'eth_chainId':
        return `0x${(this.config.chainId || 1).toString(16)}`
      
      case 'personal_sign':
        return '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1b'
      
      case 'eth_signTypedData_v4':
        return '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1b'
      
      case 'eth_sendTransaction':
        return '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12'
      
      case 'wallet_switchEthereumChain': {
        const [{ chainId }] = params as [{ chainId: string }]
        const newChainId = parseInt(chainId, 16)
        this.config.chainId = newChainId
        this.connector.setChainId(newChainId)
        return null
      }
      
      case 'wallet_addEthereumChain':
        return null
      
      case 'wallet_watchAsset':
        return true
      
      default:
        throw new Error(`Mock provider: Method ${method} not implemented`)
    }
  }

  on(event: string, listener: (...args: any[]) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set())
    }
    this.eventListeners.get(event)!.add(listener)
  }

  removeListener(event: string, listener: (...args: any[]) => void): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.delete(listener)
    }
  }

  emit(event: string, ...args: any[]): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(...args)
        } catch (error) {
          console.error(`Error in mock provider event listener:`, error)
        }
      })
    }
  }

  updateConfig(newConfig: MockConnectorConfig): void {
    this.config = { ...this.config, ...newConfig }
  }
}