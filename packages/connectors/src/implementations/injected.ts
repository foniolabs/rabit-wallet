/**
 * Generic injected wallet connector
 * For wallets that inject an ethereum provider but aren't MetaMask or Coinbase
 */
import type {
  WalletAvailability,
  Platform,
  ConnectionMethod,
  WalletFeatures,
  RabitId
} from '@rabit/types'
import { WalletNotFoundError } from '@rabit/types'
import { BaseWalletConnector } from '../base/index.js'
import type { EIP1193Provider } from '../base/eip1193-provider.js'

export interface InjectedConnectorConfig {
  id?: RabitId
  name?: string
  icon?: string
  shimDisconnect?: boolean
  providerFilter?: (provider: any) => boolean
}

export class InjectedConnector extends BaseWalletConnector {
  private shimDisconnect: boolean
  private providerFilter?: (provider: any) => boolean

  constructor(config: InjectedConnectorConfig = {}) {
    super({
      id: config.id || 'injected',
      type: 'injected',
      metadata: {
        name: config.name || 'Injected Wallet',
        description: 'Connect to an injected wallet',
        icon: config.icon || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHBhdGggZmlsbD0iIzk5OTkiZGF0YT0iTTI0IDEydjhhOCA4IDAgMCAxLTE2IDBWNEE0IDQgMCAwIDEgOCAwdjRIMjQiLz48L3N2Zz4=',
        urls: {
          website: 'https://ethereum.org/wallets'
        }
      },
      connectionMethods: ['extension'] as ConnectionMethod[],
      features: {
        signMessage: true,
        signTypedData: true,
        personalSign: true,
        switchChain: true,
        addChain: true,
        watchAsset: false,
        batchTransactions: false,
        sessions: false,
        isSmartWallet: false,
        accountAbstraction: false,
        gaslessTransactions: false
      } as WalletFeatures
    })
    
    this.shimDisconnect = config.shimDisconnect ?? true
    this.providerFilter = config.providerFilter
  }

  async isAvailable(): Promise<WalletAvailability> {
    const provider = this.findProvider()
    const isInstalled = provider !== null
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : ''
    
    return {
      isAvailable: isInstalled,
      isInstalled,
      isReady: isInstalled,
      downloadUrl: '',
      platforms: [
        {
          isBrowser: typeof window !== 'undefined',
          isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent),
          isIOS: /iPad|iPhone|iPod/.test(userAgent),
          isAndroid: /Android/.test(userAgent),
          hasWalletExtension: isInstalled
        }
      ] as Platform[]
    }
  }

  async getProvider(): Promise<EIP1193Provider> {
    const provider = this.findProvider()
    
    if (!provider) {
      throw new WalletNotFoundError('injected')
    }

    return provider
  }

  private findProvider(): EIP1193Provider | null {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      return null
    }

    const ethereum = (window as any).ethereum

    // If there are multiple providers, find the right one
    if (ethereum.providers && Array.isArray(ethereum.providers)) {
      const provider = ethereum.providers.find((p: any) => {
        // Skip MetaMask and Coinbase if no custom filter
        if (!this.providerFilter) {
          return !p.isMetaMask && !p.isCoinbaseWallet
        }
        return this.providerFilter(p)
      })
      
      return provider || null
    }

    // Single provider case
    const provider = ethereum
    
    if (this.providerFilter) {
      return this.providerFilter(provider) ? provider : null
    }
    
    // Skip MetaMask and Coinbase by default
    if (provider.isMetaMask || provider.isCoinbaseWallet) {
      return null
    }
    
    return provider
  }

  /**
   * Override disconnect to handle shimmed disconnection
   */
  async disconnect(): Promise<void> {
    if (this.shimDisconnect) {
      // For injected wallets that don't support disconnect,
      // we just clear our local state
      this._provider = null
      this._accounts = []
      this._chainId = undefined
      this._status = 'disconnected'
      
      this.emit('disconnect')
      this.emit('statusChanged', this._status)
    } else {
      await super.disconnect()
    }
  }

  /**
   * Get all available injected providers
   */
  getAvailableProviders(): EIP1193Provider[] {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      return []
    }

    const ethereum = (window as any).ethereum

    if (ethereum.providers && Array.isArray(ethereum.providers)) {
      return ethereum.providers.filter((p: any) => {
        if (this.providerFilter) {
          return this.providerFilter(p)
        }
        // Default: exclude MetaMask and Coinbase
        return !p.isMetaMask && !p.isCoinbaseWallet
      })
    }

    // Single provider
    const provider = ethereum
    if (this.providerFilter) {
      return this.providerFilter(provider) ? [provider] : []
    }
    
    // Default: exclude MetaMask and Coinbase
    if (provider.isMetaMask || provider.isCoinbaseWallet) {
      return []
    }
    
    return [provider]
  }

  /**
   * Detect the wallet name from provider
   */
  detectWalletName(): string {
    const provider = this.findProvider()
    if (!provider) return 'Unknown Wallet'

    // Common wallet detection patterns
    if ((provider as any).isBraveWallet) return 'Brave Wallet'
    if ((provider as any).isRabby) return 'Rabby'
    if ((provider as any).isFrame) return 'Frame'
    if ((provider as any).isTrust) return 'Trust Wallet'
    if ((provider as any).isOKExWallet) return 'OKX Wallet'
    if ((provider as any).isBitKeep) return 'BitKeep'
    if ((provider as any).isOpera) return 'Opera Wallet'
    
    return this.metadata.name
  }
}