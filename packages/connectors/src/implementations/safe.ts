/**
 * Safe (formerly Gnosis Safe) connector implementation
 * For connecting to Safe smart contract wallets
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

export class SafeConnector extends BaseWalletConnector {
  private safeProvider: EIP1193Provider | null = null

  constructor() {
    super({
      id: 'safe',
      type: 'safe',
      metadata: {
        name: 'Safe',
        description: 'Connect to Safe smart wallet',
        icon: 'https://safe.global/images/logo-no-text.svg',
        urls: {
          website: 'https://safe.global',
          documentation: 'https://docs.safe.global',
          support: 'https://help.safe.global'
        }
      },
      connectionMethods: ['extension'] as ConnectionMethod[],
      features: {
        signMessage: true,
        signTypedData: true,
        personalSign: false, // Safe doesn't support personal_sign
        switchChain: false,   // Safe doesn't support chain switching
        addChain: false,
        watchAsset: false,
        batchTransactions: true,
        sessions: false,
        isSmartWallet: true,
        accountAbstraction: true,
        gaslessTransactions: false
      } as WalletFeatures
    })
  }

  async isAvailable(): Promise<WalletAvailability> {
    const isInSafeContext = this.isInSafeApp()

    return {
      isAvailable: isInSafeContext,
      isInstalled: isInSafeContext,
      isReady: isInSafeContext,
      downloadUrl: 'https://safe.global',
      platforms: [
        {
          isBrowser: typeof window !== 'undefined',
          isMobile: false,
          isIOS: false,
          isAndroid: false,
          hasWalletExtension: false
        }
      ] as Platform[]
    }
  }

  async getProvider(): Promise<EIP1193Provider> {
    if (!this.isInSafeApp()) {
      throw new WalletNotFoundError('safe')
    }

    // Return cached provider if it exists
    if (this.safeProvider !== null) {
      return this.safeProvider
    }

    // Check for Safe App provider first (newer Safe apps)
    const existingProvider = (window as any).ethereum
    if (existingProvider?.isSafe) {
      this.safeProvider = existingProvider
      return existingProvider
    }

    // Fallback to Safe Apps SDK if available
    try {
      // Use Function constructor to avoid TypeScript import resolution at compile time
      const importSafeSDK = new Function('return import("@safe-global/safe-apps-sdk")')
      const safeModule = await importSafeSDK().catch(() => {
        throw new Error('Safe Apps SDK not available')
      })
      
      if (!safeModule?.default) {
        throw new Error('Safe Apps SDK not found in module')
      }
      
      const sdk = new safeModule.default()
      
      // Create EIP1193 compatible provider
      const provider: EIP1193Provider = {
        request: async ({ method, params }: { method: string; params?: any[] }) => {
          switch (method) {
            case 'eth_requestAccounts':
            case 'eth_accounts': {
              const safeInfo = await sdk.safe.getInfo()
              return [safeInfo.safeAddress]
            }
            
            case 'eth_chainId': {
              const safeInfo = await sdk.safe.getInfo()
              return `0x${safeInfo.chainId.toString(16)}`
            }
            
            case 'personal_sign': {
              throw new Error('personal_sign is not supported by Safe')
            }
            
            case 'eth_signTypedData_v4': {
              const [address, typedData] = params || []
              const response = await sdk.txs.signTypedMessage(JSON.parse(typedData))
              return response.signature
            }
            
            case 'eth_sendTransaction': {
              const [transaction] = params || []
              const response = await sdk.txs.send({
                txs: [transaction]
              })
              return response.safeTxHash
            }
            
            default:
              throw new Error(`Method ${method} not supported by Safe connector`)
          }
        },
        
        on: (event: string, listener: (...args: any[]) => void) => {
          // Safe doesn't emit events in the traditional sense
          console.log(`Safe provider: listening to ${event}`)
        },
        
        removeListener: (event: string, listener: (...args: any[]) => void) => {
          console.log(`Safe provider: removing listener for ${event}`)
        }
      }

      // Cache and return the provider
      this.safeProvider = provider
      return provider

    } catch (error) {
      throw new WalletNotFoundError('safe')
    }
  }

  private isInSafeApp(): boolean {
    if (typeof window === 'undefined') {
      return false
    }

    try {
      // Check if we're in an iframe context (Safe App)
      return window.self !== window.top
    } catch {
      return false
    }
  }

  /**
   * Override connect to handle Safe-specific flow
   */
  async connect(options?: any) {
    if (!this.isInSafeApp()) {
      throw new WalletNotFoundError('safe')
    }

    return super.connect(options)
  }

  /**
   * Safe-specific methods
   */
  
  /**
   * Check if SDK is available
   */
  async isSDKAvailable(): Promise<boolean> {
    try {
      const importSafeSDK = new Function('return import("@safe-global/safe-apps-sdk")')
      const safeModule = await importSafeSDK()
      return Boolean(safeModule?.default)
    } catch {
      return false
    }
  }

  /**
   * Get Safe info if available
   */
  async getSafeInfo() {
    if (!this.safeProvider) {
      return null
    }

    try {
      const accounts = await this.safeProvider.request({ method: 'eth_accounts' }) as string[]
      const chainId = await this.safeProvider.request({ method: 'eth_chainId' }) as string
      
      return {
        safeAddress: accounts[0],
        chainId: parseInt(chainId, 16)
      }
    } catch {
      return null
    }
  }
}