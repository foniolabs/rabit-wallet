/**
 * Save as src/types/user-operation.ts
 * ERC-4337 UserOperation types and interfaces
 */
import type { Address, Hash, Hex } from '@rabit/types'

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

export interface PackedUserOperation {
  sender: Address
  nonce: bigint
  initCode: Hex
  callData: Hex
  accountGasLimits: Hex // packed callGasLimit and verificationGasLimit
  preVerificationGas: bigint
  gasFees: Hex // packed maxPriorityFeePerGas and maxFeePerGas
  paymasterAndData: Hex
  signature: Hex
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

export interface UserOperationReceipt {
  userOpHash: Hash
  sender: Address
  nonce: bigint
  actualGasCost: bigint
  actualGasUsed: bigint
  success: boolean
  logs: UserOperationLog[]
  receipt: TransactionReceipt
}

export interface UserOperationLog {
  address: Address
  topics: Hash[]
  data: Hex
}

export interface TransactionReceipt {
  transactionHash: Hash
  transactionIndex: bigint
  blockHash: Hash
  blockNumber: bigint
  from: Address
  to: Address | null
  cumulativeGasUsed: bigint
  gasUsed: bigint
  logs: UserOperationLog[]
  status: 'success' | 'reverted'
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

export interface BundlerRpcMethods {
  eth_sendUserOperation: (userOp: UserOperation, entryPoint: Address) => Promise<Hash>
  eth_estimateUserOperationGas: (userOp: UserOperationRequest, entryPoint: Address) => Promise<GasEstimate>
  eth_getUserOperationByHash: (hash: Hash) => Promise<UserOperation | null>
  eth_getUserOperationReceipt: (hash: Hash) => Promise<UserOperationReceipt | null>
  eth_supportedEntryPoints: () => Promise<Address[]>
  eth_chainId: () => Promise<Hex>
}

export interface PaymasterRpcMethods {
  pm_sponsorUserOperation: (userOp: UserOperationRequest, entryPoint: Address, context?: any) => Promise<PaymasterData>
  pm_getPaymasterStubData: (userOp: UserOperationRequest, entryPoint: Address, context?: any) => Promise<PaymasterData>
  pm_getPaymasterData: (userOp: UserOperationRequest, entryPoint: Address, context?: any) => Promise<PaymasterData>
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

export interface UserOperationMiddleware {
  name: string
  gasEstimation?: (userOp: UserOperationRequest) => Promise<UserOperationRequest>
  paymaster?: (userOp: UserOperationRequest) => Promise<UserOperationRequest>
  signing?: (userOp: UserOperationRequest) => Promise<UserOperation>
}

export type UserOperationStatus = 
  | 'pending'
  | 'submitted'
  | 'included'
  | 'confirmed'
  | 'failed'
  | 'reverted'

export interface UserOperationTracker {
  hash: Hash
  status: UserOperationStatus
  submittedAt: number
  includedAt?: number
  confirmedAt?: number
  gasUsed?: bigint
  error?: string
}