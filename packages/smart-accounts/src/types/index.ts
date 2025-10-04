/**
 * src/types/index.ts
 * Core type definitions - FIXED VERSION
 */
import { Address, Hash, Hex } from '@rabit/types'

// Enums
export enum SmartAccountType {
  KERNEL = 'kernel',
  SAFE = 'safe',
  LIGHT_ACCOUNT = 'light_account',
  BICONOMY = 'biconomy',
  SIMPLE_ACCOUNT = 'simple_account',
  COINBASE = 'coinbase'
}

export enum SignerType {
  EOA = 'eoa',
  PASSKEY = 'passkey',
  EMBEDDED = 'embedded',
  MAGIC_LINK = 'magic_link',
  WEB3AUTH = 'web3auth'
}

export enum ProviderType {
  PIMLICO = 'pimlico',
  ALCHEMY = 'alchemy',
  BICONOMY = 'biconomy',
  ZERODEV = 'zerodev',
  STACKUP = 'stackup'
}

// Error Classes (not interfaces)
export class RpcError extends Error {
  public code: number
  public data?: any

  constructor(message: string, code: number = -1, data?: any) {
    super(message)
    this.name = 'RpcError'
    this.code = code
    this.data = data
  }
}

export class SmartAccountError extends Error {
  constructor(
    message: string,
    public code: string = 'UNKNOWN_ERROR',
    public details?: any
  ) {
    super(message)
    this.name = 'SmartAccountError'
  }
}

export class ValidationError extends Error {
  constructor(message: string, public details?: any) {
    super(message)
    this.name = 'ValidationError'
  }
}

// Core interfaces
export interface SmartAccountSigner {
  readonly type: SignerType
  readonly address: Address
  signMessage(message: string | Uint8Array): Promise<Hex>
  signTypedData(domain: any, types: any, value: any): Promise<Hex>
  signTransaction?(tx: TransactionRequest): Promise<Hex>
}

export interface SmartAccountProvider {
  type: ProviderType
  apiKey: string
  chainId: number
  bundlerUrl: string
  paymasterUrl?: string
  entryPointAddress?: Address
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

export interface SmartAccountConfig {
  type: SmartAccountType
  signer: SmartAccountSigner
  provider: SmartAccountProvider
  address?: Address
  features?: Partial<SmartAccountFeatures>
  salt?: string
  recoveryConfig?: RecoveryConfig
}

export interface SmartAccount {
  readonly address: Address
  readonly type: SmartAccountType
  readonly signer: SmartAccountSigner
  readonly features: SmartAccountFeatures
  readonly provider: SmartAccountProvider
  isDeployed: boolean

  sendTransaction(tx: TransactionRequest): Promise<Hash>
  sendBatchTransaction(txs: TransactionRequest[]): Promise<Hash>
  signMessage(message: string | Uint8Array): Promise<Hex>
  signTypedData(domain: any, types: any, value: any): Promise<Hex>
  
  // Session key methods
  addSessionKey(key: SessionKey): Promise<void>
  removeSessionKey(keyId: string): Promise<void>
  getSessionKeys(): Promise<SessionKey[]>
  
  // Spending limit methods
  updateSpendingLimit(limit: SpendingLimit): Promise<void>
  getSpendingLimits(): Promise<SpendingLimit[]>
  
  // Social recovery methods
  initiateRecovery(newOwner: Address, guardians?: Address[]): Promise<void>
  approveRecovery(guardian: Address): Promise<void>
  executeRecovery(): Promise<void>
  cancelRecovery(): Promise<void>
  
  // Utility methods
  getNonce(): Promise<bigint>
  getBalance(token?: Address): Promise<bigint>
  estimateGas(tx: TransactionRequest): Promise<bigint>
  isValidSignature(message: string | Uint8Array, signature: Hex): Promise<boolean>
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

export interface UserOperationRequest {
  sender?: Address
  nonce?: bigint
  initCode?: Hex
  callData: Hex
  callGasLimit?: bigint
  verificationGasLimit?: bigint
  preVerificationGas?: bigint
  maxFeePerGas?: bigint
  maxPriorityFeePerGas?: bigint
  paymasterAndData?: Hex
  signature?: Hex
}

export interface UserOperation {
  sender: Address
  nonce: bigint
  initCode: Hex
  callData: Hex
  callGasLimit: bigint
  verificationGasLimit: bigint
  preVerificationGas: bigint
  maxFeePerGas: bigint
  maxPriorityFeePerGas: bigint
  paymasterAndData: Hex
  signature: Hex
}

export interface GasEstimate {
  callGasLimit: bigint
  verificationGasLimit: bigint
  preVerificationGas: bigint
  maxFeePerGas: bigint
  maxPriorityFeePerGas: bigint
}

export interface PaymasterData {
  paymaster: Address
  paymasterData: Hex
  paymasterVerificationGasLimit?: bigint
  paymasterPostOpGasLimit?: bigint
}

export interface SessionKey {
  id: string
  publicKey: Hex
  permissions: SessionKeyPermission[]
  validAfter: number
  validUntil: number
  masterSessionKey?: boolean
}

export interface SessionKeyPermission {
  target: Address
  selector: Hex
  maxValuePerUse?: bigint
  validUntil?: number
}

export interface SpendingLimit {
  token: Address
  amount: bigint
  period: number
  spent: bigint
  resetTime: number
}

export interface RecoveryConfig {
  guardians: Address[]
  threshold: number
  delay?: number
}

export interface UserOperationReceipt {
  userOpHash: Hash
  sender: Address
  nonce: bigint
  actualGasCost: bigint
  actualGasUsed: bigint
  success: boolean
  logs: any[]
  receipt: {
    transactionHash: Hash
    transactionIndex: bigint
    blockHash: Hash
    blockNumber: bigint
    from: Address
    to?: Address
    cumulativeGasUsed: bigint
    gasUsed: bigint
    logs: any[]
    status: 'success' | 'reverted'
  }
}

// Client interfaces
export interface BundlerClient {
  sendUserOperation(userOp: UserOperation): Promise<Hash>
  estimateUserOperationGas(userOp: UserOperationRequest): Promise<GasEstimate>
  getUserOperationByHash(hash: Hash): Promise<UserOperation | null>
  getUserOperationReceipt(hash: Hash): Promise<UserOperationReceipt | null>
  getSupportedEntryPoints(): Promise<Address[]>
  getChainId(): Promise<Hex>
}

export interface PaymasterClient {
  getPaymasterAndData(userOp: UserOperationRequest, context?: any): Promise<PaymasterData>
  getPaymasterStubData(userOp: UserOperationRequest, context?: any): Promise<PaymasterData>
  validatePaymasterUserOp(userOp: UserOperationRequest): Promise<boolean>
  getSponsorshipPolicies(): Promise<SponsorshipPolicy[]>
}

export interface ProviderConfig {
  type: ProviderType
  apiKey: string
  chainId: number
  bundlerUrl: string
  paymasterUrl?: string
  entryPointAddress?: Address
}

// Provider-specific configs
export interface PimlicoConfig extends ProviderConfig {
  type: ProviderType.PIMLICO
  sponsorshipPolicyId?: string
  webhookSecret?: string
}

export interface SponsorshipPolicy {
  id: string
  name: string
  isActive: boolean
  rules: SponsorshipRule[]
  gasLimits: {
    maxGasPerTransaction?: bigint
    maxGasPerDay?: bigint
    maxGasPerWeek?: bigint
  }
}

export interface SponsorshipRule {
  type: 'whitelist' | 'spending_limit' | 'rate_limit'
  target?: Address
  maxAmount?: bigint
  period?: number
  enabled: boolean
}

export interface UserOperationBuilder {
  setSender(sender: Address): UserOperationBuilder
  setNonce(nonce: bigint): UserOperationBuilder
  setInitCode(initCode: Hex): UserOperationBuilder
  setCallData(callData: Hex): UserOperationBuilder
  setGasLimits(limits: Partial<GasEstimate>): UserOperationBuilder
  setPaymasterAndData(paymasterAndData: Hex): UserOperationBuilder
  setSignature(signature: Hex): UserOperationBuilder
  build(): UserOperation
  buildRequest(): UserOperationRequest
}

// Type alias for chain ID
export type ChainId = number