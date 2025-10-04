/**
 * Coinbase Wallet connector - RainbowKit style implementation
 * Supports both browser extension and mobile app
 */
import type {
  WalletAvailability,
  Platform,
  ConnectionMethod,
  WalletFeatures
} from '@rabit/types'
import { WalletNotFoundError } from '@rabit/types'
import { BaseWalletConnector } from '../base/index.js'
import type { EIP1193Provider } from '../base/eip1193-provider.js'
import { detectCoinbaseWallet } from '../utils/detection.js'

export interface CoinbaseWalletConfig {
  appName?: string
  appLogoUrl?: string
  darkMode?: boolean
  overrideIsMetaMask?: boolean
  headlessMode?: boolean
  qrUrl?: string
}

export class CoinbaseWalletConnector extends BaseWalletConnector {
  private config?: CoinbaseWalletConfig

  constructor(config?: CoinbaseWalletConfig) {
    super({
      id: 'coinbase',
      type: 'coinbase',
      metadata: {
        name: 'Coinbase Wallet',
        description: 'The easiest and most secure crypto wallet',
        icon: 'https://avatars.githubusercontent.com/u/18060234?s=280&v=4',
        urls: {
          website: 'https://wallet.coinbase.com',
          documentation: 'https://docs.cloud.coinbase.com/wallet-sdk/docs',
          support: 'https://help.coinbase.com/en/wallet',
          privacy: 'https://www.coinbase.com/legal/privacy',
          terms: 'https://www.coinbase.com/legal/user_agreement'
        }
      },
      connectionMethods: ['extension', 'mobile', 'qr'] as ConnectionMethod[],
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
        gaslessTransactions: false
      } as WalletFeatures
    })
    
    this.config = config
  }

  async isAvailable(): Promise<WalletAvailability> {
    const detection = detectCoinbaseWallet()
    
    return {
      isAvailable: detection.isInstalled,
      isInstalled: detection.isInstalled,
      isReady: detection.isInstalled,
      downloadUrl: 'https://wallet.coinbase.com',
      deepLinkScheme: 'cbwallet://',
      platforms: [
        {
          isBrowser: typeof window !== 'undefined',
          isMobile: typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
          isIOS: typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent),
          isAndroid: typeof navigator !== 'undefined' && /Android/.test(navigator.userAgent),
          hasWalletExtension: detection.isInstalled
        }
      ] as Platform[]
    }
  }

  async getProvider(): Promise<EIP1193Provider> {
    if (typeof window === 'undefined') {
      throw new WalletNotFoundError('coinbase')
    }

    // Check for Coinbase Wallet specific provider first
    if ((window as any).ethereum?.isCoinbaseWallet) {
      return (window as any).ethereum
    }

    // Check in providers array  
    if ((window as any).ethereum?.providers) {
      const coinbaseProvider = (window as any).ethereum.providers.find(
        (provider: any) => provider.isCoinbaseWallet
      )
      if (coinbaseProvider) {
        return coinbaseProvider
      }
    }

    // Check for coinbaseWalletExtension specifically
    if ((window as any).coinbaseWalletExtension) {
      return (window as any).coinbaseWalletExtension
    }

    // If no extension found but config provided, try SDK (this is optional)
    if (this.config) {
      // We don't throw here, just return null and let the caller handle it
      // This matches RainbowKit's approach where they handle SDK as fallback
      return this.createSDKProvider()
    }

    throw new WalletNotFoundError('coinbase')
  }

  private async createSDKProvider(): Promise<EIP1193Provider> {
    try {
      // Use Function constructor to avoid TypeScript import resolution at compile time
      const importCoinbaseSDK = new Function('return import("@coinbase/wallet-sdk")')
      const coinbaseModule = await importCoinbaseSDK().catch(() => {
        throw new Error('Coinbase Wallet SDK not available')
      })
      
      if (!coinbaseModule?.CoinbaseWalletSDK) {
        throw new Error('CoinbaseWalletSDK not found in module')
      }
      
      const sdk = new coinbaseModule.CoinbaseWalletSDK({
        appName: this.config?.appName || 'Rabit App',
        appLogoUrl: this.config?.appLogoUrl,
        darkMode: this.config?.darkMode || false,
        overrideIsMetaMask: this.config?.overrideIsMetaMask || false
      })

      return sdk.makeWeb3Provider() as EIP1193Provider

    } catch (error) {
      throw new WalletNotFoundError('coinbase')
    }
  }

  async requestInstallation(): Promise<void> {
    if (typeof window !== 'undefined') {
      (window as any).open('https://wallet.coinbase.com', '_blank')
    }
  }

  async openMobileApp(deepLink?: string): Promise<void> {
    if (typeof window !== 'undefined' && deepLink) {
      (window as any).location.href = deepLink
    }
  }

  /**
   * Get the current configuration
   */
  getConfig(): CoinbaseWalletConfig | undefined {
    return this.config
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<CoinbaseWalletConfig>): void {
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * Check if using the browser extension or SDK
   */
  isUsingExtension(): boolean {
    return Boolean(
      (window as any)?.ethereum?.isCoinbaseWallet ||
      (window as any)?.coinbaseWalletExtension
    )
  }

  /**
   * Check if SDK is available
   */
  async isSDKAvailable(): Promise<boolean> {
    try {
      const importCoinbaseSDK = new Function('return import("@coinbase/wallet-sdk")')
      const coinbaseModule = await importCoinbaseSDK()
      return Boolean(coinbaseModule?.CoinbaseWalletSDK)
    } catch {
      return false
    }
  }

  /**
   * Get QR URL for mobile connection (similar to RainbowKit's implementation)
   */
  async getQRUrl(): Promise<string | null> {
    try {
      const provider = await this.getProvider()
      
      // Check if provider has qrUrl property (for SDK)
      if ((provider as any).qrUrl) {
        return (provider as any).qrUrl
      }
      
      return null
    } catch {
      return null
    }
  }
}