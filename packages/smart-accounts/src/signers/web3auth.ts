/**
 * src/signers/web3auth.ts
 * Web3Auth Signer Implementation
 */
import { Address, Hex } from '@rabit/types'
import { SmartAccountSigner, SignerType, TransactionRequest } from '../types'

// Web3Auth types (simplified)
interface Web3AuthSDK {
  init(): Promise<void>
  connect(loginParams?: any): Promise<any>
  logout(): Promise<void>
  getUserInfo(): Promise<any>
  provider: any
  status: 'connected' | 'connecting' | 'disconnected' | 'errored'
}

// Fixed: Updated config interface with proper theme type compatibility
export interface Web3AuthConfig {
  clientId: string
  chainConfig: {
    chainNamespace: 'eip155'
    chainId: string
    rpcTarget: string
    displayName?: string
    blockExplorer?: string
    ticker?: string
    tickerName?: string
  }
  web3AuthNetwork?: 'sapphire_mainnet' | 'sapphire_devnet' | 'testnet' | 'cyan' | 'aqua'
  uiConfig?: {
    theme?: any  // Changed from specific union to any for compatibility
    loginMethodsOrder?: string[]
    appLogo?: string
    appName?: string
  }
  modalConfig?: any
}

export enum Web3AuthLoginProvider {
  GOOGLE = 'google',
  FACEBOOK = 'facebook',
  TWITTER = 'twitter',
  REDDIT = 'reddit',
  DISCORD = 'discord',
  TWITCH = 'twitch',
  APPLE = 'apple',
  LINE = 'line',
  GITHUB = 'github',
  KAKAO = 'kakao',
  LINKEDIN = 'linkedin',
  WEIBO = 'weibo',
  WECHAT = 'wechat',
  EMAIL_PASSWORDLESS = 'email_passwordless',
  JWT = 'jwt'
}

export class Web3AuthSigner implements SmartAccountSigner {
  public readonly type = SignerType.WEB3AUTH
  public address: Address = '0x' as Address
  private web3auth: Web3AuthSDK | null = null
  private config: Web3AuthConfig
  private isInitialized = false
  private provider: any = null

  constructor(config: Web3AuthConfig) {
    this.config = config
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Dynamically import Web3Auth and required providers
      const { Web3Auth } = await import('@web3auth/modal')
      const { CHAIN_NAMESPACES } = await import('@web3auth/base')
      const { EthereumPrivateKeyProvider } = await import('@web3auth/ethereum-provider')

      // Create the private key provider
      const privateKeyProvider = new EthereumPrivateKeyProvider({
        config: {
          chainConfig: this.config.chainConfig
        }
      })

      // Fixed: Add required privateKeyProvider to Web3Auth options
      this.web3auth = new Web3Auth({
        clientId: this.config.clientId,
        web3AuthNetwork: this.config.web3AuthNetwork || 'sapphire_mainnet',
        chainConfig: this.config.chainConfig, // Use config as-is, it already has chainNamespace
        uiConfig: this.config.uiConfig as any,  // Type assertion for theme compatibility
        privateKeyProvider // Add the required privateKeyProvider
        // Removed modalConfig as it's not part of Web3AuthOptions
      }) as unknown as Web3AuthSDK

      await this.web3auth.init()

      // Check if already connected
      if (this.web3auth.status === 'connected') {
        this.provider = this.web3auth.provider
        await this.updateAddress()
      }

      this.isInitialized = true
    } catch (error) {
      throw new Error(`Failed to initialize Web3Auth: ${error}`)
    }
  }

  async connect(loginProvider?: Web3AuthLoginProvider, extraLoginOptions?: any): Promise<void> {
    await this.initialize()

    if (!this.web3auth) {
      throw new Error('Web3Auth not initialized')
    }

    try {
      const loginParams = loginProvider ? {
        loginProvider,
        ...extraLoginOptions
      } : undefined

      this.provider = await this.web3auth.connect(loginParams)
      await this.updateAddress()
    } catch (error) {
      throw new Error(`Failed to connect with Web3Auth: ${error}`)
    }
  }

  async disconnect(): Promise<void> {
    if (!this.web3auth) {
      throw new Error('Web3Auth not initialized')
    }

    try {
      await this.web3auth.logout()
      this.provider = null
      this.address = '0x' as Address
    } catch (error) {
      throw new Error(`Failed to disconnect from Web3Auth: ${error}`)
    }
  }

  async signMessage(message: string | Uint8Array): Promise<Hex> {
    await this.ensureConnected()

    try {
      const messageToSign = typeof message === 'string' ? message : Buffer.from(message).toString('hex')
      
      const signature = await this.provider.request({
        method: 'personal_sign',
        params: [messageToSign, this.address]
      })

      return signature as Hex
    } catch (error) {
      throw new Error(`Failed to sign message with Web3Auth: ${error}`)
    }
  }

  async signTypedData(domain: any, types: any, value: any): Promise<Hex> {
    await this.ensureConnected()

    try {
      const signature = await this.provider.request({
        method: 'eth_signTypedData_v4',
        params: [
          this.address,
          JSON.stringify({
            domain,
            types,
            primaryType: Object.keys(types)[0],
            message: value
          })
        ]
      })

      return signature as Hex
    } catch (error) {
      throw new Error(`Failed to sign typed data with Web3Auth: ${error}`)
    }
  }

  async signTransaction(tx: TransactionRequest): Promise<Hex> {
    await this.ensureConnected()

    try {
      const signature = await this.provider.request({
        method: 'eth_signTransaction',
        params: [{
          from: this.address,
          to: tx.to,
          value: tx.value ? '0x' + tx.value.toString(16) : '0x0',
          data: tx.data || '0x',
          gas: tx.gas ? '0x' + tx.gas.toString(16) : undefined,
          gasPrice: tx.gasPrice ? '0x' + tx.gasPrice.toString(16) : undefined,
          maxFeePerGas: tx.maxFeePerGas ? '0x' + tx.maxFeePerGas.toString(16) : undefined,
          maxPriorityFeePerGas: tx.maxPriorityFeePerGas ? '0x' + tx.maxPriorityFeePerGas.toString(16) : undefined,
          nonce: tx.nonce ? '0x' + tx.nonce.toString(16) : undefined
        }]
      })

      return signature as Hex
    } catch (error) {
      throw new Error(`Failed to sign transaction with Web3Auth: ${error}`)
    }
  }

  // Helper methods
  async getUserInfo(): Promise<any> {
    if (!this.web3auth || this.web3auth.status !== 'connected') {
      return null
    }

    try {
      return await this.web3auth.getUserInfo()
    } catch (error) {
      console.error('Failed to get user info:', error)
      return null
    }
  }

  async sendTransaction(tx: TransactionRequest): Promise<Hex> {
    await this.ensureConnected()

    try {
      const txHash = await this.provider.request({
        method: 'eth_sendTransaction',
        params: [{
          from: this.address,
          to: tx.to,
          value: tx.value ? '0x' + tx.value.toString(16) : '0x0',
          data: tx.data || '0x',
          gas: tx.gas ? '0x' + tx.gas.toString(16) : undefined,
          gasPrice: tx.gasPrice ? '0x' + tx.gasPrice.toString(16) : undefined,
          maxFeePerGas: tx.maxFeePerGas ? '0x' + tx.maxFeePerGas.toString(16) : undefined,
          maxPriorityFeePerGas: tx.maxPriorityFeePerGas ? '0x' + tx.maxPriorityFeePerGas.toString(16) : undefined,
          nonce: tx.nonce ? '0x' + tx.nonce.toString(16) : undefined
        }]
      })

      return txHash as Hex
    } catch (error) {
      throw new Error(`Failed to send transaction with Web3Auth: ${error}`)
    }
  }

  isConnected(): boolean {
    return this.web3auth?.status === 'connected' && this.provider !== null
  }

  getProvider(): any {
    return this.provider
  }

  private async updateAddress(): Promise<void> {
    if (!this.provider) return

    try {
      const accounts = await this.provider.request({
        method: 'eth_accounts'
      })

      if (accounts && accounts.length > 0) {
        this.address = accounts[0] as Address
      }
    } catch (error) {
      console.error('Failed to get address:', error)
    }
  }

  private async ensureConnected(): Promise<void> {
    await this.initialize()

    if (!this.isConnected()) {
      throw new Error('Web3Auth not connected')
    }

    if (!this.address || this.address === '0x') {
      await this.updateAddress()
    }

    if (!this.address || this.address === '0x') {
      throw new Error('Failed to get address from Web3Auth')
    }
  }

  // Configuration getters
  getConfig(): Web3AuthConfig {
    return { ...this.config }
  }

  getWeb3AuthInstance(): Web3AuthSDK | null {
    return this.web3auth
  }
}

/**
 * Create a Web3Auth signer
 */
export function createWeb3AuthSigner(config: Web3AuthConfig): Web3AuthSigner {
  return new Web3AuthSigner(config)
}

/**
 * Create and connect with Web3Auth
 */
export async function createAndConnectWeb3AuthSigner(
  config: Web3AuthConfig,
  loginProvider?: Web3AuthLoginProvider,
  extraLoginOptions?: any
): Promise<Web3AuthSigner> {
  const signer = new Web3AuthSigner(config)
  await signer.connect(loginProvider, extraLoginOptions)
  return signer
}

/**
 * Create Web3Auth signer with specific provider
 */
export async function createWeb3AuthSignerWithProvider(
  config: Web3AuthConfig,
  provider: Web3AuthLoginProvider,
  options?: {
    login_hint?: string
    domain?: string
    verifierIdField?: string
    connection?: string
    [key: string]: any
  }
): Promise<Web3AuthSigner> {
  const signer = new Web3AuthSigner(config)
  await signer.connect(provider, options)
  return signer
}

/**
 * Helper to create common Web3Auth configurations
 */
export function createWeb3AuthConfig(
  clientId: string,
  chainId: number,
  rpcUrl: string,
  overrides?: Partial<Web3AuthConfig>
): Web3AuthConfig {
  const chainIdHex = '0x' + chainId.toString(16)
  
  const defaultConfig: Web3AuthConfig = {
    clientId,
    chainConfig: {
      chainNamespace: 'eip155',
      chainId: chainIdHex,
      rpcTarget: rpcUrl,
      displayName: getChainName(chainId),
      blockExplorer: getBlockExplorer(chainId),
      ticker: 'ETH',
      tickerName: 'Ethereum'
    },
    web3AuthNetwork: 'sapphire_mainnet',
    uiConfig: {
      theme: 'auto',
      appName: 'Smart Account App',
      loginMethodsOrder: ['google', 'facebook', 'twitter', 'email_passwordless']
    }
  }

  return { ...defaultConfig, ...overrides }
}

function getChainName(chainId: number): string {
  switch (chainId) {
    case 1: return 'Ethereum Mainnet'
    case 137: return 'Polygon'
    case 10: return 'Optimism'
    case 42161: return 'Arbitrum'
    case 8453: return 'Base'
    case 56: return 'BNB Chain'
    case 43114: return 'Avalanche'
    case 5: return 'Goerli'
    case 80001: return 'Polygon Mumbai'
    default: return 'Unknown Chain'
  }
}

function getBlockExplorer(chainId: number): string {
  switch (chainId) {
    case 1: return 'https://etherscan.io'
    case 137: return 'https://polygonscan.com'
    case 10: return 'https://optimistic.etherscan.io'
    case 42161: return 'https://arbiscan.io'
    case 8453: return 'https://basescan.org'
    case 56: return 'https://bscscan.com'
    case 43114: return 'https://snowtrace.io'
    case 5: return 'https://goerli.etherscan.io'
    case 80001: return 'https://mumbai.polygonscan.com'
    default: return 'https://etherscan.io'
  }
}