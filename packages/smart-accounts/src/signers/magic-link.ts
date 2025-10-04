/**
 * src/signers/magic-link.ts
 * Magic Link Signer Implementation
 */
import { Address, Hex } from '@rabit/types'
import { SmartAccountSigner, SignerType, TransactionRequest } from '../types'

// Magic SDK types (simplified)
interface MagicSDK {
  user: {
    login(config: { email: string }): Promise<any>
    logout(): Promise<void>
    isLoggedIn(): Promise<boolean>
    getMetadata(): Promise<{ publicAddress: string; email: string }>
  }
  rpcProvider: {
    request(payload: { method: string; params?: any[] }): Promise<any>
  }
}

// Fixed: Updated config interface with proper types for better compatibility
export interface MagicLinkConfig {
  apiKey: string
  network?: 'mainnet' | 'goerli' | 'sepolia' | 'polygon' | 'mumbai' | string
  locale?: 'en_US' | 'es_ES' | 'fr_FR' | 'de_DE' | 'ja_JP' | 'ko_KR' | 'zh_CN' | string
  endpoint?: string
  testMode?: boolean
}

export class MagicLinkSigner implements SmartAccountSigner {
  public readonly type = SignerType.MAGIC_LINK
  public address: Address = '0x' as Address
  private magic: MagicSDK | null = null
  private config: MagicLinkConfig
  private isInitialized = false

  constructor(config: MagicLinkConfig) {
    this.config = config
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Dynamically import Magic SDK
      const { Magic } = await import('magic-sdk')
      
      // Fixed: Use type assertions for better compatibility with Magic SDK types
      this.magic = new Magic(this.config.apiKey, {
        network: (this.config.network as any) || 'mainnet',
        locale: (this.config.locale as any) || 'en_US',
        endpoint: this.config.endpoint,
        testMode: this.config.testMode || false
      }) as unknown as MagicSDK

      // Check if user is already logged in
      const isLoggedIn = await this.magic.user.isLoggedIn()
      if (isLoggedIn) {
        const metadata = await this.magic.user.getMetadata()
        this.address = metadata.publicAddress as Address
      }

      this.isInitialized = true
    } catch (error) {
      throw new Error(`Failed to initialize Magic Link: ${error}`)
    }
  }

  async login(email: string): Promise<void> {
    await this.initialize()
    
    if (!this.magic) {
      throw new Error('Magic SDK not initialized')
    }

    try {
      await this.magic.user.login({ email })
      const metadata = await this.magic.user.getMetadata()
      this.address = metadata.publicAddress as Address
    } catch (error) {
      throw new Error(`Failed to login with Magic Link: ${error}`)
    }
  }

  async logout(): Promise<void> {
    if (!this.magic) {
      throw new Error('Magic SDK not initialized')
    }

    try {
      await this.magic.user.logout()
      this.address = '0x' as Address
    } catch (error) {
      throw new Error(`Failed to logout from Magic Link: ${error}`)
    }
  }

  async isLoggedIn(): Promise<boolean> {
    if (!this.magic) {
      return false
    }

    try {
      return await this.magic.user.isLoggedIn()
    } catch (error) {
      return false
    }
  }

  async signMessage(message: string | Uint8Array): Promise<Hex> {
    await this.ensureLoggedIn()

    try {
      const messageToSign = typeof message === 'string' ? message : Buffer.from(message).toString('hex')
      
      const signature = await this.magic!.rpcProvider.request({
        method: 'personal_sign',
        params: [messageToSign, this.address]
      })

      return signature as Hex
    } catch (error) {
      throw new Error(`Failed to sign message with Magic Link: ${error}`)
    }
  }

  async signTypedData(domain: any, types: any, value: any): Promise<Hex> {
    await this.ensureLoggedIn()

    try {
      const signature = await this.magic!.rpcProvider.request({
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
      throw new Error(`Failed to sign typed data with Magic Link: ${error}`)
    }
  }

  async signTransaction(tx: TransactionRequest): Promise<Hex> {
    await this.ensureLoggedIn()

    try {
      const signature = await this.magic!.rpcProvider.request({
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
      throw new Error(`Failed to sign transaction with Magic Link: ${error}`)
    }
  }

  // Helper methods
  async getUserMetadata(): Promise<{ publicAddress: string; email: string } | null> {
    if (!this.magic || !(await this.isLoggedIn())) {
      return null
    }

    try {
      return await this.magic.user.getMetadata()
    } catch (error) {
      console.error('Failed to get user metadata:', error)
      return null
    }
  }

  async sendTransaction(tx: TransactionRequest): Promise<Hex> {
    await this.ensureLoggedIn()

    try {
      const txHash = await this.magic!.rpcProvider.request({
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
      throw new Error(`Failed to send transaction with Magic Link: ${error}`)
    }
  }

  private async ensureLoggedIn(): Promise<void> {
    await this.initialize()
    
    if (!this.magic) {
      throw new Error('Magic SDK not initialized')
    }

    const loggedIn = await this.isLoggedIn()
    if (!loggedIn) {
      throw new Error('User not logged in to Magic Link')
    }

    if (!this.address || this.address === '0x') {
      const metadata = await this.magic.user.getMetadata()
      this.address = metadata.publicAddress as Address
    }
  }

  // Configuration getters
  getConfig(): MagicLinkConfig {
    return { ...this.config }
  }

  getMagicInstance(): MagicSDK | null {
    return this.magic
  }
}

/**
 * Create a Magic Link signer
 */
export function createMagicLinkSigner(config: MagicLinkConfig): MagicLinkSigner {
  return new MagicLinkSigner(config)
}

/**
 * Create and login with Magic Link
 */
export async function createAndLoginMagicLinkSigner(
  config: MagicLinkConfig,
  email: string
): Promise<MagicLinkSigner> {
  const signer = new MagicLinkSigner(config)
  await signer.login(email)
  return signer
}

/**
 * Magic Link OAuth providers
 */
export enum MagicOAuthProvider {
  GOOGLE = 'google',
  FACEBOOK = 'facebook',
  APPLE = 'apple',
  GITHUB = 'github',
  BITBUCKET = 'bitbucket',
  GITLAB = 'gitlab',
  LINKEDIN = 'linkedin',
  TWITTER = 'twitter',
  DISCORD = 'discord',
  TWITCH = 'twitch',
  MICROSOFT = 'microsoft'
}

/**
 * Create Magic Link signer with OAuth
 */
export async function createMagicLinkSignerWithOAuth(
  config: MagicLinkConfig,
  provider: MagicOAuthProvider,
  redirectURI?: string
): Promise<MagicLinkSigner> {
  const signer = new MagicLinkSigner(config)
  await signer.initialize()

  if (!signer.getMagicInstance()) {
    throw new Error('Failed to initialize Magic SDK')
  }

  try {
    // OAuth login
    await signer.getMagicInstance()!.rpcProvider.request({
      method: 'magic_oauth_login',
      params: [{
        provider,
        redirectURI: redirectURI || window.location.origin
      }]
    })

    const metadata = await signer.getMagicInstance()!.user.getMetadata()
    signer.address = metadata.publicAddress as Address

    return signer
  } catch (error) {
    throw new Error(`Failed to login with OAuth provider ${provider}: ${error}`)
  }
}