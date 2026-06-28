/**
 * Smart account types for Rabit
 * Supports Kernel, Safe, and LightAccount
 */

import type { SmartAccountType } from './wallet.js';
import type { ChainId } from './chain.js';

/**
 * ERC-4337 User Operation
 */
export interface UserOperation {
  sender: string;
  nonce: bigint;
  initCode: string;
  callData: string;
  callGasLimit: bigint;
  verificationGasLimit: bigint;
  preVerificationGas: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  paymasterAndData: string;
  signature: string;
}

/**
 * Smart account configuration
 */
export interface SmartAccountConfig {
  type: SmartAccountType;
  chainId: ChainId;
  entryPointAddress: string;
  factoryAddress: string;
  bundlerUrl: string;
  paymasterUrl?: string;
}

/**
 * Gas sponsorship options
 */
export interface GasSponsorshipOptions {
  enabled: boolean;
  paymasterUrl?: string;
  policy?: {
    maxGasLimit?: bigint;
    maxGasPrice?: bigint;
    allowedOperations?: string[];
  };
}

/**
 * Session key for delegated signing
 */
export interface SessionKey {
  address: string;
  permissions: SessionPermissions;
  expiresAt: number;
}

/**
 * Session permissions
 */
export interface SessionPermissions {
  allowedContracts?: string[];
  allowedFunctions?: string[];
  spendingLimits?: Array<{
    token: string;
    amount: bigint;
    period: number;
  }>;
  validAfter?: number;
  validUntil?: number;
}

/**
 * Batch transaction
 */
export interface BatchTransaction {
  to: string;
  value?: bigint;
  data: string;
}

/**
 * Smart account instance interface
 */
export interface SmartAccount {
  address: string;
  chainId: ChainId;
  type: SmartAccountType;
  isDeployed: boolean;
  owner: string;

  execute(to: string, value: bigint, data: string): Promise<string>;
  executeBatch(transactions: BatchTransaction[]): Promise<string>;
  signMessage(message: string): Promise<string>;
  signTypedData(typedData: unknown): Promise<string>;
  createSessionKey(permissions: SessionPermissions): Promise<SessionKey>;
  revokeSessionKey(sessionKey: string): Promise<string>;
  getNonce(): Promise<bigint>;
  estimateGas(userOp: Partial<UserOperation>): Promise<{
    callGasLimit: bigint;
    verificationGasLimit: bigint;
    preVerificationGas: bigint;
  }>;
}

/**
 * Paymaster service interface
 */
export interface PaymasterService {
  getPaymasterData(userOp: Partial<UserOperation>): Promise<{
    paymasterAndData: string;
    preVerificationGas?: bigint;
    verificationGasLimit?: bigint;
    callGasLimit?: bigint;
  }>;
  isSponsorable(userOp: Partial<UserOperation>): Promise<boolean>;
}

/**
 * Bundler service interface
 */
export interface BundlerService {
  sendUserOperation(userOp: UserOperation): Promise<string>;
  getUserOperationReceipt(userOpHash: string): Promise<UserOperationReceipt | null>;
  estimateUserOperationGas(userOp: Partial<UserOperation>): Promise<{
    callGasLimit: bigint;
    verificationGasLimit: bigint;
    preVerificationGas: bigint;
  }>;
  getSupportedEntryPoints(): Promise<string[]>;
}

/**
 * User operation receipt
 */
export interface UserOperationReceipt {
  userOpHash: string;
  entryPoint: string;
  sender: string;
  nonce: bigint;
  paymaster?: string;
  actualGasCost: bigint;
  actualGasUsed: bigint;
  success: boolean;
  receipt: {
    transactionHash: string;
    blockNumber: bigint;
    gasUsed: bigint;
    status: 'success' | 'reverted';
  };
}
