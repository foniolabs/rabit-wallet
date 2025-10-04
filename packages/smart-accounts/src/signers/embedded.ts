/**
 * src/signers/embedded.ts
 * Embedded Wallet Signer Implementation (Privy-style)
 */
import { Address, Hex } from '@rabit/types'
import { SmartAccountSigner, SignerType, TransactionRequest } from '../types'
import { keccak256, toBytes, recoverAddress, hashMessage } from 'viem'
import { secp256k1 } from '@noble/curves/secp256k1'

export interface EmbeddedWalletConfig {
  entropy?: string
  password?: string
  keyDerivationPath?: string
  storage?: 'localStorage' | 'sessionStorage' | 'memory'
  encryptionKey?: string
  chainId?: number // Added chainId configuration
}

export class EmbeddedSigner implements SmartAccountSigner {
  public readonly type = SignerType.EMBEDDED
  public readonly address: Address
  private privateKey: Uint8Array
  private config: EmbeddedWalletConfig
  private storageKey: string

  constructor(config: EmbeddedWalletConfig = {}) {
    this.config = config
    this.storageKey = 'embedded_wallet_' + (config.keyDerivationPath || 'default')
    
    // Initialize or recover private key
    this.privateKey = this.initializePrivateKey()
    this.address = this.deriveAddress()
  }

  async signMessage(message: string | Uint8Array): Promise<Hex> {
    try {
      const messageBytes = typeof message === 'string' ? toBytes(message) : message
      const messageHash = hashMessage({ raw: messageBytes })
      
      const signature = secp256k1.sign(messageHash.slice(2), this.privateKey)
      
      // Convert to Ethereum signature format
      const r = signature.r.toString(16).padStart(64, '0')
      const s = signature.s.toString(16).padStart(64, '0')
      const v = (signature.recovery! + 27).toString(16).padStart(2, '0')
      
      return ('0x' + r + s + v) as Hex
    } catch (error) {
      throw new Error(`Failed to sign message with embedded wallet: ${error}`)
    }
  }

  async signTypedData(domain: any, types: any, value: any): Promise<Hex> {
    try {
      const { hashTypedData } = await import('viem')
      const hash = hashTypedData({
        domain,
        types,
        primaryType: Object.keys(types)[0],
        message: value
      })

      const signature = secp256k1.sign(hash.slice(2), this.privateKey)
      
      // Convert to Ethereum signature format
      const r = signature.r.toString(16).padStart(64, '0')
      const s = signature.s.toString(16).padStart(64, '0')
      const v = (signature.recovery! + 27).toString(16).padStart(2, '0')
      
      return ('0x' + r + s + v) as Hex
    } catch (error) {
      throw new Error(`Failed to sign typed data with embedded wallet: ${error}`)
    }
  }

  async signTransaction(tx: TransactionRequest): Promise<Hex> {
    try {
      // Create transaction hash
      const { serializeTransaction } = await import('viem')
      
      // Fixed: Add required chainId for EIP-1559 transactions
      const serialized = serializeTransaction({
        to: tx.to,
        value: tx.value,
        data: tx.data,
        gas: tx.gas,
        maxFeePerGas: tx.maxFeePerGas,
        maxPriorityFeePerGas: tx.maxPriorityFeePerGas,
        nonce: tx.nonce ? Number(tx.nonce) : undefined,
        chainId: this.config.chainId || 1, // Use configured chainId or default to mainnet
        type: 'eip1559'
      })

      const hash = keccak256(toBytes(serialized))
      const signature = secp256k1.sign(hash.slice(2), this.privateKey)
      
      // Convert to Ethereum signature format
      const r = signature.r.toString(16).padStart(64, '0')
      const s = signature.s.toString(16).padStart(64, '0')
      const v = (signature.recovery! + 27).toString(16).padStart(2, '0')
      
      return ('0x' + r + s + v) as Hex
    } catch (error) {
      throw new Error(`Failed to sign transaction with embedded wallet: ${error}`)
    }
  }

  // Wallet management methods
  async exportPrivateKey(password?: string): Promise<Hex> {
    if (this.config.password && password !== this.config.password) {
      throw new Error('Invalid password')
    }
    
    return ('0x' + Buffer.from(this.privateKey).toString('hex')) as Hex
  }

  async exportMnemonic(password?: string): Promise<string> {
    if (this.config.password && password !== this.config.password) {
      throw new Error('Invalid password')
    }
    
    // This would return the mnemonic if the wallet was created from one
    // For now, throw an error as we're generating from entropy
    throw new Error('Mnemonic not available for entropy-based wallets')
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    if (this.config.password && oldPassword !== this.config.password) {
      throw new Error('Invalid old password')
    }
    
    this.config.password = newPassword
    this.storePrivateKey(this.privateKey)
  }

  // Storage methods
  private initializePrivateKey(): Uint8Array {
    // Try to load existing key from storage
    const stored = this.loadPrivateKey()
    if (stored) {
      return stored
    }

    // Generate new private key
    let privateKey: Uint8Array

    if (this.config.entropy) {
      // Derive from provided entropy
      privateKey = this.deriveFromEntropy(this.config.entropy)
    } else {
      // Generate random private key
      privateKey = secp256k1.utils.randomPrivateKey()
    }

    // Store the private key
    this.storePrivateKey(privateKey)
    
    return privateKey
  }

  private deriveFromEntropy(entropy: string): Uint8Array {
    // Use PBKDF2 to derive private key from entropy
    const encoder = new TextEncoder()
    const entropyBytes = encoder.encode(entropy)
    const salt = encoder.encode('embedded_wallet_salt')
    
    // Simplified derivation - in production, use proper PBKDF2
    const hash = keccak256(new Uint8Array([...entropyBytes, ...salt]))
    return new Uint8Array(Buffer.from(hash.slice(2), 'hex'))
  }

  private deriveAddress(): Address {
    const publicKey = secp256k1.getPublicKey(this.privateKey, false)
    const publicKeyHash = keccak256(publicKey.slice(1)) // Remove 0x04 prefix
    return ('0x' + publicKeyHash.slice(-40)) as Address
  }

  private loadPrivateKey(): Uint8Array | null {
    try {
      const storage = this.getStorage()
      if (!storage) return null

      const encrypted = storage.getItem(this.storageKey)
      if (!encrypted) return null

      return this.decrypt(encrypted)
    } catch (error) {
      console.warn('Failed to load private key from storage:', error)
      return null
    }
  }

  private storePrivateKey(privateKey: Uint8Array): void {
    try {
      const storage = this.getStorage()
      if (!storage) return

      const encrypted = this.encrypt(privateKey)
      storage.setItem(this.storageKey, encrypted)
    } catch (error) {
      console.warn('Failed to store private key:', error)
    }
  }

  private getStorage(): Storage | null {
    if (typeof window === 'undefined') return null

    switch (this.config.storage) {
      case 'localStorage':
        return window.localStorage
      case 'sessionStorage':
        return window.sessionStorage
      case 'memory':
      default:
        return null // Memory storage means don't persist
    }
  }

  private encrypt(data: Uint8Array): string {
    // Simple XOR encryption with password/key
    // In production, use proper encryption like AES
    const key = this.getEncryptionKey()
    const encrypted = new Uint8Array(data.length)
    
    for (let i = 0; i < data.length; i++) {
      encrypted[i] = data[i] ^ key.charCodeAt(i % key.length)
    }
    
    return Buffer.from(encrypted).toString('base64')
  }

  private decrypt(encrypted: string): Uint8Array {
    // Simple XOR decryption
    const data = new Uint8Array(Buffer.from(encrypted, 'base64'))
    const key = this.getEncryptionKey()
    const decrypted = new Uint8Array(data.length)
    
    for (let i = 0; i < data.length; i++) {
      decrypted[i] = data[i] ^ key.charCodeAt(i % key.length)
    }
    
    return decrypted
  }

  private getEncryptionKey(): string {
    return this.config.encryptionKey || this.config.password || 'default_key'
  }

  // Static factory methods
  static async create(config: EmbeddedWalletConfig = {}): Promise<EmbeddedSigner> {
    return new EmbeddedSigner(config)
  }

  static async fromEntropy(
    entropy: string,
    config: Omit<EmbeddedWalletConfig, 'entropy'> = {}
  ): Promise<EmbeddedSigner> {
    return new EmbeddedSigner({ ...config, entropy })
  }

  static async fromPassword(
    password: string,
    config: Omit<EmbeddedWalletConfig, 'password'> = {}
  ): Promise<EmbeddedSigner> {
    return new EmbeddedSigner({ ...config, password })
  }
}

/**
 * Create an embedded signer
 */
export function createEmbeddedSigner(config: EmbeddedWalletConfig = {}): EmbeddedSigner {
  return new EmbeddedSigner(config)
}

/**
 * Create an embedded signer from entropy
 */
export function createEmbeddedSignerFromEntropy(
  entropy: string,
  config: Omit<EmbeddedWalletConfig, 'entropy'> = {}
): EmbeddedSigner {
  return new EmbeddedSigner({ ...config, entropy })
}

/**
 * Create an embedded signer with password protection
 */
export function createEmbeddedSignerWithPassword(
  password: string,
  config: Omit<EmbeddedWalletConfig, 'password'> = {}
): EmbeddedSigner {
  return new EmbeddedSigner({ ...config, password, storage: 'localStorage' })
}