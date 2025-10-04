/**
 * src/types/providers.ts
 * Provider-related types and interfaces
 */
import type { Address, Hash, Hex, ChainId } from '@rabit/types'
import type { UserOperation, UserOperationRequest, UserOperationReceipt, GasEstimate, PaymasterData } from './user-operation'
import type { ProviderType } from './smart-account' // Import from smart-account to avoid duplication

export interface ProviderConfig {
  type: ProviderType
  apiKey: string
  bundlerUrl?: string
  paymasterUrl?: string
  chainId: ChainId
  entryPointAddress?: Address
}

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

export interface SponsorshipPolicy {
  id: string
  name: string
  isActive: boolean
  rules: ProviderSponsorshipRule[]  // Fixed: Use the existing type instead of undefined SponsorshipRule
  gasLimits: {
    maxGasPerTransaction?: bigint
    maxGasPerDay?: bigint
    maxGasPerWeek?: bigint
  }
}

export interface ProviderSponsorshipRule {
  type: 'whitelist_contracts' | 'blacklist_contracts' | 'value_limit' | 'function_selector'
  contracts?: Address[]
  maxValue?: bigint
  selectors?: Hex[]
  condition?: (userOp: UserOperationRequest) => boolean
}

// Type alias for backward compatibility
export type SponsorshipRule = ProviderSponsorshipRule

export interface ProviderClientConfig extends ProviderConfig {
  timeout?: number
  retries?: number
  retryDelay?: number
}

export interface RpcRequestOptions {
  timeout?: number
  retries?: number
  headers?: Record<string, string>
}

export interface RpcError extends Error {
  code: number
  data?: any
}

export interface ProviderMetrics {
  bundlerLatency: number
  paymasterLatency: number
  successRate: number
  lastUpdated: number
}

export interface ProviderStatus {
  isHealthy: boolean
  bundlerStatus: 'online' | 'offline' | 'degraded'
  paymasterStatus: 'online' | 'offline' | 'degraded'
  lastChecked: number
  metrics: ProviderMetrics
}

// Provider-specific configurations
export interface PimlicoConfig extends ProviderConfig {
  type: ProviderType.PIMLICO
  sponsorshipPolicyId?: string
  webhookSecret?: string
}

export interface AlchemyConfig extends ProviderConfig {
  type: ProviderType.ALCHEMY
  gasManagerPolicyId?: string
  debugMode?: boolean
}

export interface ZeroDevConfig extends ProviderConfig {
  type: ProviderType.ZERODEV
  projectId: string
  bundlerProvider?: 'STACKUP' | 'ALCHEMY' | 'PIMLICO'
  paymasterProvider?: 'STACKUP' | 'ALCHEMY' | 'PIMLICO'
}

export interface BiconomyConfig extends ProviderConfig {
  type: ProviderType.BICONOMY
  bundlerUrl: string
  paymasterUrl: string
}

export interface StackupConfig extends ProviderConfig {
  type: ProviderType.STACKUP
  paymasterContext?: {
    type: 'payg' | 'verifying'
    policyId?: string
  }
}

export interface EtherspotConfig extends ProviderConfig {
  type: ProviderType.ETHERSPOT
  projectKey: string
}