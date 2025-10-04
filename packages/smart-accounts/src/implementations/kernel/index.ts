import { 
  SmartAccount, 
  SmartAccountConfig, 
  SmartAccountType,
  SmartAccountFeatures,
  TransactionRequest,
  SessionKey,
  SpendingLimit 
} from '../../types'
import { Address, Hash, Hex } from '@rabit/types'
import { KernelAccountClient } from '@/implementations/kernel/client'
import { KernelValidator } from '@/implementations/kernel/validator'
import { predictKernelAddress } from './factory'

export class KernelSmartAccount implements SmartAccount {
  public readonly address: Address
  public readonly type = SmartAccountType.KERNEL
  public readonly signer: SmartAccountConfig['signer']
  public readonly features: SmartAccountFeatures
  public readonly provider: SmartAccountConfig['provider']
  public isDeployed: boolean = false

  private client: KernelAccountClient
  private validator: KernelValidator

  constructor(
    config: SmartAccountConfig,
    client: KernelAccountClient,
    validator: KernelValidator
  ) {
    this.address = config.address!
    this.signer = config.signer
    this.features = {
      gasSponsorship: true,
      batchTransactions: true,
      sessionKeys: true,
      socialRecovery: true,
      spendingLimits: true,
      timeDelays: false,
      multiSig: false,
      customValidation: true,
      ...config.features
    }
    this.provider = config.provider
    this.client = client
    this.validator = validator
  }

  async sendTransaction(tx: TransactionRequest): Promise<Hash> {
    return this.client.sendTransaction(tx)
  }

  async sendBatchTransaction(txs: TransactionRequest[]): Promise<Hash> {
    return this.client.sendBatchTransaction(txs)
  }

  async signMessage(message: string | Uint8Array): Promise<Hex> {
    return this.signer.signMessage(message)
  }

  async signTypedData(domain: any, types: any, value: any): Promise<Hex> {
    return this.signer.signTypedData(domain, types, value)
  }

  async addSessionKey(key: SessionKey): Promise<void> {
    if (!this.features.sessionKeys) {
      throw new Error('Session keys not enabled for this account')
    }
    return this.client.addSessionKey(key)
  }

  async removeSessionKey(keyId: string): Promise<void> {
    return this.client.removeSessionKey(keyId)
  }

  async updateSpendingLimit(limit: SpendingLimit): Promise<void> {
    if (!this.features.spendingLimits) {
      throw new Error('Spending limits not enabled for this account')
    }
    return this.client.updateSpendingLimit(limit)
  }

  async getSessionKeys(): Promise<SessionKey[]> {
    return this.client.getSessionKeys()
  }

  async getSpendingLimits(): Promise<SpendingLimit[]> {
    return this.client.getSpendingLimits()
  }

  async initiateRecovery(newOwner: Address, guardians?: Address[]): Promise<void> {
    if (!this.features.socialRecovery) {
      throw new Error('Social recovery not enabled for this account')
    }
    return this.client.initiateRecovery(newOwner, guardians)
  }

  async approveRecovery(guardian: Address): Promise<void> {
    return this.client.approveRecovery(guardian)
  }

  async executeRecovery(): Promise<void> {
    return this.client.executeRecovery()
  }

  async cancelRecovery(): Promise<void> {
    return this.client.cancelRecovery()
  }

  async getNonce(): Promise<bigint> {
    return this.client.getNonce()
  }

  async getBalance(token?: Address): Promise<bigint> {
    return this.client.getBalance(token)
  }

  async estimateGas(tx: TransactionRequest): Promise<bigint> {
    return this.client.estimateGas(tx)
  }

  async isValidSignature(message: string | Uint8Array, signature: Hex): Promise<boolean> {
    return this.validator.isValidSignature(message, signature)
  }
}

export async function createKernelAccount(config: SmartAccountConfig): Promise<KernelSmartAccount> {
  // Predict account address if not provided
  if (!config.address) {
    config.address = await predictKernelAddress(config)
  }

  // Initialize Kernel client and validator
  const client = new KernelAccountClient(config)
  const validator = new KernelValidator(config.signer)
  
  // Check if account is deployed
  const isDeployed = await client.isAccountDeployed(config.address)
  
  const account = new KernelSmartAccount(config, client, validator)
  account.isDeployed = isDeployed
  
  return account
}

// Kernel-specific features
export interface KernelSessionKey extends SessionKey {
  kernelMode?: 'sudo' | 'plugin' | 'enable'
  executionRule?: {
    validUntil: number
    validAfter: number
    maxValuePerUse: bigint
    maxValuePerPeriod: bigint
  }
}

export interface KernelPluginConfig {
  address: Address
  initData: Hex
  enable: boolean
}

// Re-export utilities
export { predictKernelAddress, getKernelInitCode } from './factory'
export { KernelAccountClient } from '@/implementations/kernel/client'
export { KernelValidator } from '@/implementations/kernel/validator'