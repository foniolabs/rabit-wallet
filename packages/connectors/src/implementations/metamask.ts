/**
 * MetaMask wallet connector
 * Supports browser extension and mobile app via deep links
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
import { detectMetaMask } from '../utils/detection.js'

export class MetaMaskConnector extends BaseWalletConnector {
  constructor() {
    super({
      id: 'metamask',
      type: 'injected',
      metadata: {
        name: 'MetaMask',
        description: 'Connect to your MetaMask wallet',
        icon: 'https://raw.githubusercontent.com/MetaMask/brand-resources/master/SVG/metamask-fox.svg',
        urls: {
          website: 'https://metamask.io',
          documentation: 'https://docs.metamask.io',
          support: 'https://metamask.zendesk.com'
        }
      },
      connectionMethods: ['extension', 'mobile'] as ConnectionMethod[],
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
  }

  async isAvailable(): Promise<WalletAvailability> {
    const detection = detectMetaMask()
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : ''
    
    return {
      isAvailable: detection.isInstalled,
      isInstalled: detection.isInstalled,
      isReady: detection.isInstalled,
      downloadUrl: 'https://metamask.io/download/',
      deepLinkScheme: 'metamask://',
      platforms: [
        {
          isBrowser: typeof window !== 'undefined',
          isMobile: /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent),
          isIOS: /iPad|iPhone|iPod/.test(userAgent),
          isAndroid: /Android/.test(userAgent),
          hasWalletExtension: detection.isInstalled
        }
      ] as Platform[]
    }
  }

  async getProvider(): Promise<EIP1193Provider> {
    if (typeof window === 'undefined') {
      throw new WalletNotFoundError('metamask')
    }

    // Check for MetaMask specific provider first
    if ((window as any).ethereum?.isMetaMask) {
      return (window as any).ethereum
    }

    // Check in providers array (for when multiple wallets are installed)
    if ((window as any).ethereum?.providers) {
      const metamaskProvider = (window as any).ethereum.providers.find(
        (provider: any) => provider.isMetaMask
      )
      if (metamaskProvider) {
        return metamaskProvider
      }
    }

    throw new WalletNotFoundError('metamask')
  }

  /**
   * Request to add MetaMask to browser if not installed
   */
  async requestInstallation(): Promise<void> {
    if (typeof window !== 'undefined') {
      window.open('https://metamask.io/download/', '_blank')
    }
  }

  /**
   * Open MetaMask mobile app via deep link
   */
  async openMobileApp(deepLink?: string): Promise<void> {
    if (typeof window !== 'undefined' && deepLink) {
      window.location.href = deepLink
    }
  }

  /**
   * Generate mobile deep link for connection
   */
  generateMobileDeepLink(uri?: string): string {
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : ''
    const isAndroid = /Android/.test(userAgent)
    const isIOS = /iPad|iPhone|iPod/.test(userAgent)
    
    if (!uri) {
      return isAndroid 
        ? 'metamask://wc'
        : isIOS
          ? 'metamask://wc'
          : 'https://metamask.app.link/wc'
    }
    
    return isAndroid
      ? `metamask://wc?uri=${encodeURIComponent(uri)}`
      : isIOS
        ? `metamask://wc?uri=${encodeURIComponent(uri)}`
        : `https://metamask.app.link/wc?uri=${encodeURIComponent(uri)}`
  }

  /**
   * Check if MetaMask is unlocked
   */
  async isUnlocked(): Promise<boolean> {
    try {
      const provider = await this.getProvider()
      if ((provider as any)._metamask?.isUnlocked) {
        return await (provider as any)._metamask.isUnlocked()
      }
      
      // Fallback: try to get accounts (will fail if locked)
      const accounts = await provider.request({ method: 'eth_accounts' })
      return Array.isArray(accounts) && accounts.length > 0
    } catch {
      return false
    }
  }
}