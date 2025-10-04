/**
 * WalletConnect connector - RainbowKit style implementation
 * Supports QR code and deep link connections to mobile wallets
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
import { WalletNotFoundError, ConnectionError } from '@rabit/types'
import { BaseWalletConnector } from '../base/index.js'
import type { EIP1193Provider } from '../base/eip1193-provider.js'

export interface WalletConnectConfig {
  projectId: string
  chains?: number[]
  showQrModal?: boolean
  qrModalOptions?: {
    themeMode?: 'light' | 'dark'
    themeVariables?: Record<string, string>
  }
  metadata: {
    name: string
    description: string
    url: string
    icons: string[]
  }
}

// Extended interface for WalletConnect provider to handle its specific properties
interface WalletConnectProvider extends EIP1193Provider {
  enable(): Promise<void>
  disconnect(): Promise<void>
  accounts: string[]
  chainId: string
  session?: {
    peer?: {
      metadata?: any
    }
  }
}

export class WalletConnectConnector extends BaseWalletConnector {
  private config: WalletConnectConfig
  private walletConnectProvider: WalletConnectProvider | null = null

  constructor(config: WalletConnectConfig) {
    super({
      id: 'walletconnect',
      type: 'walletconnect',
      metadata: {
        name: 'WalletConnect',
        description: 'Connect with 500+ wallets',
        icon: 'https://walletconnect.com/walletconnect-logo.svg',
        urls: {
          website: 'https://walletconnect.com',
          documentation: 'https://docs.walletconnect.com',
          support: 'https://support.walletconnect.com'
        }
      },
      connectionMethods: ['qr', 'mobile', 'deeplink'] as ConnectionMethod[],
      features: {
        signMessage: true,
        signTypedData: true,
        personalSign: true,
        switchChain: true,
        addChain: false,
        watchAsset: false,
        batchTransactions: false,
        sessions: true,
        isSmartWallet: false,
        accountAbstraction: false,
        gaslessTransactions: false
      } as WalletFeatures
    })
    
    this.config = config
  }

  async isAvailable(): Promise<WalletAvailability> {
    // WalletConnect is always "available" as it's a protocol
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : ''
    
    return {
      isAvailable: true,
      isInstalled: true,
      isReady: true,
      downloadUrl: 'https://walletconnect.com/explorer',
      platforms: [
        {
          isBrowser: typeof window !== 'undefined',
          isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent),
          isIOS: /iPad|iPhone|iPod/.test(userAgent),
          isAndroid: /Android/.test(userAgent),
          hasWalletExtension: false
        }
      ] as Platform[]
    }
  }

  async getProvider(): Promise<EIP1193Provider> {
    if (this.walletConnectProvider) {
      return this.walletConnectProvider
    }

    try {
      // Use Function constructor to avoid TypeScript import resolution at compile time
      // This is the same approach RainbowKit uses for optional dependencies
      const importWalletConnect = new Function('return import("@walletconnect/ethereum-provider")')
      const walletConnectModule = await importWalletConnect().catch(() => {
        throw new Error('WalletConnect provider not available. Please install @walletconnect/ethereum-provider as a peer dependency.')
      })
      
      if (!walletConnectModule?.EthereumProvider) {
        throw new Error('WalletConnect EthereumProvider not found in module')
      }
      
      const provider = await walletConnectModule.EthereumProvider.init({
        projectId: this.config.projectId,
        chains: this.config.chains || [1],
        showQrModal: this.config.showQrModal !== false,
        qrModalOptions: this.config.qrModalOptions,
        metadata: this.config.metadata
      }) as WalletConnectProvider

      this.walletConnectProvider = provider
      return provider

    } catch (error) {
      throw new WalletNotFoundError('walletconnect')
    }
  }

  async connect(options?: ConnectOptions): Promise<ConnectResult> {
    try {
      this._status = 'connecting'
      this.emit('statusChanged', this._status)

      const provider = await this.getProvider() as WalletConnectProvider
      
      // Enable session (shows QR code modal)
      await provider.enable()
      
      // Convert string accounts to Address type (ensure they have 0x prefix)
      const accounts = provider.accounts.map(account => 
        account.startsWith('0x') ? account as Address : `0x${account}` as Address
      )
      const chainId = parseInt(provider.chainId, 16) as ChainId
      
      this._accounts = accounts
      this._chainId = chainId
      this._provider = provider
      this._status = 'connected'
      
      // Setup event listeners
      this.setupProviderListeners()
      
      const result: ConnectResult = {
        accounts: this._accounts,
        chainId: this._chainId,
        method: options?.method || 'qr',
        data: {
          provider: this._provider,
          peerMeta: provider.session?.peer?.metadata
        }
      }
      
      this.emit('connect', result)
      this.emit('statusChanged', this._status)
      
      return result
      
    } catch (error) {
      this._status = 'error'
      this.emit('statusChanged', this._status)
      throw new ConnectionError(`WalletConnect connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.walletConnectProvider) {
        await this.walletConnectProvider.disconnect()
        this.walletConnectProvider = null
      }
      
      await super.disconnect()
      
    } catch (error) {
      this._status = 'error' 
      this.emit('statusChanged', this._status)
      throw error
    }
  }

  /**
   * Get accounts - override to handle WalletConnect specific behavior
   */
  async getAccounts(): Promise<Address[]> {
    if (!this.walletConnectProvider) {
      return []
    }
    
    try {
      // For WalletConnect, we can use the cached accounts or request fresh ones
      const accounts = this.walletConnectProvider.accounts?.map(account => 
        account.startsWith('0x') ? account as Address : `0x${account}` as Address
      ) || []
      
      this._accounts = accounts
      return accounts
      
    } catch (error) {
      console.error('Failed to get accounts:', error)
      return []
    }
  }

  /**
   * Override switchChain to handle WalletConnect specific implementation
   */
  async switchChain(chainId: ChainId): Promise<void> {
    if (!this.walletConnectProvider) {
      throw new ConnectionError('Not connected to wallet')
    }
    
    try {
      await this.walletConnectProvider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }]
      })
      
      this._chainId = chainId
      this.emit('chainChanged', chainId)
      
    } catch (error: any) {
      // Chain not added to wallet
      if (error.code === 4902) {
        throw new ConnectionError(
          `Chain ${chainId} not added to wallet. WalletConnect doesn't support adding chains automatically.`
        )
      }
      throw error
    }
  }

  /**
   * WalletConnect doesn't support adding chains
   */
  async addChain(): Promise<void> {
    throw new ConnectionError('WalletConnect does not support adding chains. Please add the chain manually in your connected wallet.')
  }

  /**
   * Get URI for QR code connection (similar to RainbowKit's getWalletConnectUri)
   */
  async getConnectionUri(uriConverter?: (uri: string) => string): Promise<string> {
    const provider = await this.getProvider()
    
    return new Promise<string>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Failed to get WalletConnect URI - timeout'))
      }, 10000) // 10 second timeout
      
      // Listen for display_uri event
      const handleUri = (uri: string) => {
        clearTimeout(timeout)
        const finalUri = uriConverter ? uriConverter(uri) : uri
        resolve(finalUri)
      }
      
      // Set up listener
      if ((provider as any).once) {
        (provider as any).once('display_uri', handleUri)
      } else {
        reject(new Error('Provider does not support display_uri event'))
      }
    })
  }

  /**
   * Get the current session information
   */
  getSession() {
    return this.walletConnectProvider?.session
  }

  /**
   * Get peer metadata from the connected wallet
   */
  getPeerMetadata() {
    return this.walletConnectProvider?.session?.peer?.metadata
  }

  /**
   * Check if a session is currently active
   */
  isSessionActive(): boolean {
    return Boolean(this.walletConnectProvider?.session)
  }

  /**
   * Get supported chains from the current session
   */
  getSupportedChains(): number[] {
    return this.config.chains || [1]
  }

  /**
   * Update the configuration (useful for changing chains, etc.)
   */
  updateConfig(newConfig: Partial<WalletConnectConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }
}