/**
 * Save as src/types/smart-account.ts
 */
import type { Address, Hash, Hex, ChainId } from '@rabit/types'

export enum SmartAccountType {
  SAFE = 'safe',
  KERNEL = 'kernel',
  LIGHT_ACCOUNT = 'light_account',
  BICONOMY = 'biconomy',
  SIMPLE_ACCOUNT = 'simple_account',
  COINBASE = 'coinbase'
}

export enum ProviderType {
  PIMLICO = 'pimlico',
  ALCHEMY = 'alchemy',
  BICONOMY = 'biconomy',
  ZERODEV = 'zerodev',
  STACKUP = 'stackup',
  ETHERSPOT = 'etherspot'
}

export enum SignerType {
  EOA = 'eoa',
  EMBEDDED = 'embedded',
  PASSKEY = 'passkey',
  MAGIC_LINK = 'magic_link',
  WEB3AUTH = 'web3auth',
  CUSTOM = 'custom'
}

export interface SmartAccountFeatures {
  gasSponsorship: boolean
  batchTransactions: boolean
  sessionKeys: boolean
  socialRecovery: boolean
  spendingLimits: boolean
  timeDelays: boolean
  multiSig: boolean
  customValidation: boolean
}

export interface TransactionRequest {
  to: Address
  value?: bigint
  data?: Hex
  gas?: bigint
  gasPrice?: bigint
  maxFeePerGas?: bigint
  maxPriorityFeePerGas?: bigint
  nonce?: bigint
}

export interface SmartAccountSigner {
  type: SignerType
  address: Address
  signMessage(message: string | Uint8Array): Promise<Hex>
  signTypedData(domain: any, types: any, value: any): Promise<Hex>
  signTransaction?(tx: TransactionRequest): Promise<Hex>
}

export interface SmartAccountProvider {
  type: ProviderType
  chainId: ChainId
  bundlerUrl: string
  paymasterUrl?: string
  apiKey: string
}

export interface SessionKey {
  id: string
  publicKey: Hex
  permissions: Permission[]
  validUntil: number
  validAfter: number
  maxGasPerTransaction?: bigint
  allowedContracts?: Address[]
}

export interface Permission {
  target: Address
  selector: Hex
  maxValue?: bigint
  rules?: PermissionRule[]
}

export interface PermissionRule {
  type: 'time_limit' | 'usage_limit' | 'amount_limit'
  value: bigint
  consumed?: bigint
}

export interface SpendingLimit {
  token: Address // Address(0) for native token
  amount: bigint
  period: number // in seconds
  resetTime?: number
}

export interface GasPolicy {
  type: 'sponsored' | 'user_pays' | 'hybrid'
  maxGasPerTransaction?: bigint
  maxGasPerDay?: bigint
  allowedContracts?: Address[]
  sponsorshipRules?: SponsorshipRule[]
}

export interface SponsorshipRule {
  type: 'whitelist' | 'contract_filter' | 'value_limit'
  contracts?: Address[]
  maxValue?: bigint
  condition?: (tx: TransactionRequest) => boolean
}

export interface RecoveryConfig {
  guardians: Address[]
  threshold: number
  recoveryPeriod: number
  isRecoveryActive?: boolean
  recoveryRequest?: {
    newOwner: Address
    approvals: Address[]
    validAfter: number
  }
}

export interface SmartAccountConfig {
  type: SmartAccountType
  signer: SmartAccountSigner
  provider: SmartAccountProvider
  features?: Partial<SmartAccountFeatures>
  gasPolicy?: GasPolicy
  recoveryConfig?: RecoveryConfig
  salt?: Hex
}

export interface SmartAccount {
  address: Address
  type: SmartAccountType
  signer: SmartAccountSigner
  features: SmartAccountFeatures
  provider: SmartAccountProvider
  isDeployed: boolean
  
  // Core operations
  sendTransaction(tx: TransactionRequest): Promise<Hash>
  sendBatchTransaction(txs: TransactionRequest[]): Promise<Hash>
  signMessage(message: string | Uint8Array): Promise<Hex>
  signTypedData(domain: any, types: any, value: any): Promise<Hex>
  
  // Account management
  addSessionKey(key: SessionKey): Promise<void>
  removeSessionKey(keyId: string): Promise<void>
  updateSpendingLimit(limit: SpendingLimit): Promise<void>
  getSessionKeys(): Promise<SessionKey[]>
  getSpendingLimits(): Promise<SpendingLimit[]>
  
  // Recovery
  initiateRecovery(newOwner: Address, guardians?: Address[]): Promise<void>
  approveRecovery(guardian: Address): Promise<void>
  executeRecovery(): Promise<void>
  cancelRecovery(): Promise<void>
  
  // Utilities
  getNonce(): Promise<bigint>
  getBalance(token?: Address): Promise<bigint>
  estimateGas(tx: TransactionRequest): Promise<bigint>
  isValidSignature(message: string | Uint8Array, signature: Hex): Promise<boolean>
}

export interface SmartAccountFactory {
  type: SmartAccountType
  
  createAccount(config: SmartAccountConfig): Promise<SmartAccount>
  predictAccountAddress(config: SmartAccountConfig): Promise<Address>
  isAccountDeployed(address: Address): Promise<boolean>
  getAccountCode(address: Address): Promise<Hex>
  getInitCode(config: SmartAccountConfig): Promise<Hex>
}