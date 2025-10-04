/**
 * src/signers/eoa.ts
 * Fixed EOA Signer implementation with proper null/undefined handling
 */
import { Address, Hex } from '@rabit/types'
import { 
  PrivateKeyAccount, 
  WalletClient, 
  Account,
  Chain,
  createWalletClient,
  http
} from 'viem'
import { privateKeyToAccount, mnemonicToAccount } from 'viem/accounts'
import { SignerType, TransactionRequest } from '../types/index'

// Define ValidationResult interface here since it's not in the main types file
interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export class EOASigner {
  public readonly type = SignerType.EOA
  public readonly address: Address
  private account: PrivateKeyAccount | Account | null
  private walletClient?: WalletClient

  constructor(account: PrivateKeyAccount | Account | null, walletClient?: WalletClient) {
    this.account = account
    // Fix: Handle null account gracefully
    this.address = account?.address || ('0x0000000000000000000000000000000000000000' as Address)
    
    // Fix: Only assign if walletClient exists to avoid exactOptionalPropertyTypes issue
    if (walletClient) {
      this.walletClient = walletClient
    }
  }

  async signMessage(message: string | Uint8Array): Promise<Hex> {
    try {
      // Check if account is initialized
      if (!this.account) {
        throw new Error('Account not initialized')
      }

      const messageParam = typeof message === 'string' 
        ? message 
        : { raw: message }

      if (this.walletClient?.signMessage) {
        return await this.walletClient.signMessage({
          account: this.account,
          message: messageParam
        })
      }

      // Try direct signing with account
      if (this.hasDirectSigningCapability()) {
        const accountWithSigning = this.account as PrivateKeyAccount
        return await accountWithSigning.signMessage({
          message: messageParam
        })
      }

      throw new Error('No signing method available')
    } catch (error) {
      throw new Error(`Failed to sign message: ${error}`)
    }
  }

  async signTypedData(
    domain: any,
    types: Record<string, any>,
    value: any
  ): Promise<Hex> {
    try {
      // Check if account is initialized
      if (!this.account) {
        throw new Error('Account not initialized')
      }

      const typeNames = Object.keys(types)
      if (typeNames.length === 0) {
        throw new Error('No primary type found in types')
      }

      const primaryType = typeNames[0] // Use first type as primary

      const typedDataParams = {
        domain,
        types,
        primaryType,
        message: value
      }

      if (this.walletClient?.signTypedData) {
        return await this.walletClient.signTypedData({
          account: this.account,
          ...typedDataParams
        })
      }

      // Try direct signing with account
      if (this.hasDirectSigningCapability()) {
        const accountWithSigning = this.account as PrivateKeyAccount
        return await accountWithSigning.signTypedData(typedDataParams)
      }

      throw new Error('No signing method available')
    } catch (error) {
      throw new Error(`Failed to sign typed data: ${error}`)
    }
  }

  async signTransaction(transaction: TransactionRequest): Promise<Hex> {
    try {
      // Check if account is initialized
      if (!this.account) {
        throw new Error('Account not initialized')
      }

      if (!this.walletClient?.signTransaction) {
        throw new Error('Wallet client required for transaction signing')
      }

      const txParams = {
        account: this.account,
        chain: this.walletClient.chain || null,
        to: transaction.to,
        value: transaction.value,
        data: transaction.data,
        gas: transaction.gas,
        maxFeePerGas: transaction.maxFeePerGas,
        maxPriorityFeePerGas: transaction.maxPriorityFeePerGas,
        nonce: transaction.nonce ? Number(transaction.nonce) : undefined
      }

      return await this.walletClient.signTransaction(txParams)
    } catch (error) {
      throw new Error(`Failed to sign transaction: ${error}`)
    }
  }

  getAccount(): PrivateKeyAccount | Account | null {
    return this.account
  }

  getWalletClient(): WalletClient | undefined {
    return this.walletClient
  }

  setWalletClient(walletClient: WalletClient): void {
    this.walletClient = walletClient
  }

  private hasDirectSigningCapability(): boolean {
    if (!this.account) return false
    
    return (
      typeof (this.account as any).signMessage === 'function' &&
      typeof (this.account as any).signTypedData === 'function'
    )
  }
}

// Factory functions
export interface EOASignerOptions {
  walletClient?: WalletClient
  chain?: Chain
  rpcUrl?: string
}

export function createEOASigner(
  account: PrivateKeyAccount | Account,
  options?: EOASignerOptions
): EOASigner {
  if (options?.walletClient) {
    return new EOASigner(account, options.walletClient)
  }

  if (options?.chain && options?.rpcUrl) {
    const walletClient = createWalletClient({
      account,
      chain: options.chain,
      transport: http(options.rpcUrl)
    })
    return new EOASigner(account, walletClient)
  }

  return new EOASigner(account)
}

export async function createEOASignerFromPrivateKey(
  privateKey: Hex,
  options?: EOASignerOptions
): Promise<EOASigner> {
  const account = privateKeyToAccount(privateKey)
  
  if (options?.chain && options?.rpcUrl) {
    const walletClient = createWalletClient({
      account,
      chain: options.chain,
      transport: http(options.rpcUrl)
    })
    return new EOASigner(account, walletClient)
  }

  return new EOASigner(account, options?.walletClient)
}

export interface MnemonicOptions extends EOASignerOptions {
  accountIndex?: number
  addressIndex?: number
  changeIndex?: number
}

export async function createEOASignerFromMnemonic(
  mnemonic: string,
  options?: MnemonicOptions
): Promise<EOASigner> {
  const account = mnemonicToAccount(mnemonic, {
    accountIndex: options?.accountIndex || 0,
    addressIndex: options?.addressIndex || 0,
    changeIndex: options?.changeIndex || 0
  })
  
  if (options?.chain && options?.rpcUrl) {
    const walletClient = createWalletClient({
      account,
      chain: options.chain,
      transport: http(options.rpcUrl)
    })
    return new EOASigner(account, walletClient)
  }

  return new EOASigner(account, options?.walletClient)
}

export function createEOASignerWithClient(
  account: PrivateKeyAccount | Account,
  chain: Chain,
  rpcUrl: string
): EOASigner {
  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(rpcUrl)
  })
  
  return new EOASigner(account, walletClient)
}

// Validation
export function validateEOASignerConfig(
  account: PrivateKeyAccount | Account,
  walletClient?: WalletClient
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (!account) {
    errors.push('Account is required')
    return { isValid: false, errors, warnings }
  }

  if (!account.address) {
    errors.push('Account must have a valid address')
  }

  // Check if account has direct signing capability when no wallet client
  if (!walletClient) {
    const hasDirectSigning = 
      typeof (account as any).signMessage === 'function' &&
      typeof (account as any).signTypedData === 'function'
    
    if (!hasDirectSigning) {
      errors.push('Account must support direct signing when no wallet client provided')
    }
  }

  // Validate wallet client account matches
  if (walletClient?.account && walletClient.account.address !== account.address) {
    errors.push('Wallet client account must match the provided account')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}