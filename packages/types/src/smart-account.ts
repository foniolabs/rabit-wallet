// Account abstraction types
import type { Address, Hash, Hex } from 'viem';
import type { RabitId, Metadata } from './base.js';
import type { ChainId } from './chain.js';
import type { TransactionRequest } from './wallet.js';

/**
 * Smart Account and Account Abstraction types
 */

/**
 * Smart account implementation standards
 */
export type SmartAccountStandard = 
  | 'erc4337'
  | 'erc7702' 
  | 'safe'
  | 'kernel'
  | 'biconomy'
  | 'custom';

/**
 * User operation for ERC-4337
 */
export interface UserOperation {
  /**
   * Account address
   */
  sender: Address;
  
  /**
   * Nonce
   */
  nonce: bigint;
  
  /**
   * Init code for account creation
   */
  initCode: Hex;
  
  /**
   * Call data
   */
  callData: Hex;
  
  /**
   * Call gas limit
   */
  callGasLimit: bigint;
  
  /**
   * Verification gas limit
   */
  verificationGasLimit: bigint;
  
  /**
   * Pre-verification gas
   */
  preVerificationGas: bigint;
  
  /**
   * Max fee per gas
   */
  maxFeePerGas: bigint;
  
  /**
   * Max priority fee per gas
   */
  maxPriorityFeePerGas: bigint;
  
  /**
   * Paymaster and data
   */
  paymasterAndData: Hex;
  
  /**
   * Signature
   */
  signature: Hex;
}

/**
 * Gas sponsorship options
 */
export interface GasSponsorshipOptions {
  /**
   * Whether to sponsor gas
   */
  enabled: boolean;
  
  /**
   * Paymaster address
   */
  paymasterAddress?: Address;
  
  /**
   * Paymaster URL
   */
  paymasterUrl?: string;
  
  /**
   * Sponsor policy
   */
  policy?: {
    /**
     * Maximum gas limit to sponsor
     */
    maxGasLimit?: bigint;
    
    /**
     * Maximum gas price to sponsor
     */
    maxGasPrice?: bigint;
    
    /**
     * Allowed operations
     */
    allowedOperations?: string[];
    
    /**
     * Rate limiting
     */
    rateLimit?: {
      perMinute?: number;
      perHour?: number;
      perDay?: number;
    };
  };
}

/**
 * Smart account configuration
 */
export interface SmartAccountConfig {
  /**
   * Standard implementation
   */
  standard: SmartAccountStandard;
  
  /**
   * Account factory address
   */
  factoryAddress: Address;
  
  /**
   * Implementation address
   */
  implementationAddress?: Address;
  
  /**
   * EntryPoint address (for ERC-4337)
   */
  entryPointAddress?: Address;
  
  /**
   * Bundler configuration
   */
  bundler?: {
    url: string;
    apiKey?: string;
  };
  
  /**
   * Gas sponsorship
   */
  gasSponsorship?: GasSponsorshipOptions;
  
  /**
   * Custom validation modules
   */
  validationModules?: ValidationModule[];
  
  /**
   * Execution modules
   */
  executionModules?: ExecutionModule[];
}

/**
 * Validation module for smart accounts
 */
export interface ValidationModule {
  /**
   * Module identifier
   */
  id: RabitId;
  
  /**
   * Module metadata
   */
  metadata: Metadata;
  
  /**
   * Module address
   */
  address: Address;
  
  /**
   * Module type
   */
  type: 'signature' | 'session' | 'multisig' | 'timelock' | 'custom';
  
  /**
   * Configuration data
   */
  config?: Record<string, unknown>;
}

/**
 * Execution module for smart accounts
 */
export interface ExecutionModule {
  /**
   * Module identifier
   */
  id: RabitId;
  
  /**
   * Module metadata
   */
  metadata: Metadata;
  
  /**
   * Module address
   */
  address: Address;
  
  /**
   * Module type
   */
  type: 'batching' | 'recurring' | 'conditional' | 'custom';
  
  /**
   * Configuration data
   */
  config?: Record<string, unknown>;
}

/**
 * Session key for gasless interactions
 */
export interface SessionKey {
  /**
   * Session key address
   */
  address: Address;
  
  /**
   * Session permissions
   */
  permissions: SessionPermissions;
  
  /**
   * Expiry timestamp
   */
  expiresAt: number;
  
  /**
   * Session metadata
   */
  metadata?: Record<string, unknown>;
}

/**
 * Session permissions
 */
export interface SessionPermissions {
  /**
   * Allowed contracts
   */
  allowedContracts?: Address[];
  
  /**
   * Allowed functions
   */
  allowedFunctions?: string[];
  
  /**
   * Spending limits
   */
  spendingLimits?: Array<{
    token: Address;
    amount: bigint;
    period: number; // seconds
  }>;
  
  /**
   * Time restrictions
   */
  timeRestrictions?: {
    validAfter?: number;
    validUntil?: number;
    validDuring?: Array<{
      start: number; // hour of day (0-23)
      end: number;   // hour of day (0-23)
    }>;
  };
}

/**
 * Batch transaction
 */
export interface BatchTransaction {
  /**
   * Target address
   */
  to: Address;
  
  /**
   * Value to send
   */
  value?: bigint;
  
  /**
   * Call data
   */
  data: Hex;
  
  /**
   * Operation type (call, delegatecall, etc.)
   */
  operation?: number;
}

/**
 * Smart account interface
 */
export interface SmartAccount {
  /**
   * Account address
   */
  address: Address;
  
  /**
   * Chain ID
   */
  chainId: ChainId;
  
  /**
   * Account configuration
   */
  config: SmartAccountConfig;
  
  /**
   * Whether account is deployed
   */
  isDeployed: boolean;
  
  /**
   * Account owner/signer
   */
  owner: Address;
  
  /**
   * Execute a single transaction
   */
  execute(transaction: TransactionRequest): Promise<Hash>;
  
  /**
   * Execute multiple transactions in batch
   */
  executeBatch(transactions: BatchTransaction[]): Promise<Hash>;
  
  /**
   * Create session key
   */
  createSessionKey(permissions: SessionPermissions): Promise<SessionKey>;
  
  /**
   * Revoke session key
   */
  revokeSessionKey(sessionKey: Address): Promise<Hash>;
  
  /**
   * Get account nonce
   */
  getNonce(): Promise<bigint>;
  
  /**
   * Estimate gas for operation
   */
  estimateGas(operation: Partial<UserOperation>): Promise<{
    callGasLimit: bigint;
    verificationGasLimit: bigint;
    preVerificationGas: bigint;
  }>;
  
  /**
   * Sign user operation
   */
  signUserOperation(userOp: UserOperation): Promise<Hex>;
}

/**
 * Smart account provider interface
 */
export interface SmartAccountProvider {
  /**
   * Provider identifier
   */
  readonly id: RabitId;
  
  /**
   * Provider metadata
   */
  readonly metadata: Metadata;
  
  /**
   * Supported standards
   */
  readonly supportedStandards: SmartAccountStandard[];
  
  /**
   * Create a new smart account
   */
  createAccount(config: SmartAccountConfig): Promise<SmartAccount>;
  
  /**
   * Get existing smart account
   */
  getAccount(address: Address, chainId: ChainId): Promise<SmartAccount>;
  
  /**
   * Check if address is a smart account
   */
  isSmartAccount(address: Address, chainId: ChainId): Promise<boolean>;
  
  /**
   * Get account creation code
   */
  getAccountInitCode(owner: Address, config: SmartAccountConfig): Promise<Hex>;
  
  /**
   * Predict account address
   */
  predictAccountAddress(owner: Address, config: SmartAccountConfig): Promise<Address>;
}

/**
 * Paymaster service interface
 */
export interface PaymasterService {
  /**
   * Service identifier
   */
  readonly id: RabitId;
  
  /**
   * Service metadata
   */
  readonly metadata: Metadata;
  
  /**
   * Get paymaster data for user operation
   */
  getPaymasterData(userOp: Partial<UserOperation>): Promise<{
    paymasterAndData: Hex;
    preVerificationGas?: bigint;
    verificationGasLimit?: bigint;
    callGasLimit?: bigint;
  }>;
  
  /**
   * Check if operation is sponsored
   */
  isSponsorable(userOp: Partial<UserOperation>): Promise<boolean>;
  
  /**
   * Get sponsorship limits
   */
  getSponsorshipLimits(): Promise<{
    maxGasLimit: bigint;
    maxGasPrice: bigint;
    dailyLimit?: bigint;
  }>;
}

/**
 * Bundler service interface
 */
export interface BundlerService {
  /**
   * Service identifier
   */
  readonly id: RabitId;
  
  /**
   * Service metadata
   */
  readonly metadata: Metadata;
  
  /**
   * Submit user operation
   */
  sendUserOperation(userOp: UserOperation): Promise<Hash>;
  
  /**
   * Get user operation receipt
   */
  getUserOperationReceipt(userOpHash: Hash): Promise<UserOperationReceipt | null>;
  
  /**
   * Estimate user operation gas
   */
  estimateUserOperationGas(userOp: Partial<UserOperation>): Promise<{
    callGasLimit: bigint;
    verificationGasLimit: bigint;
    preVerificationGas: bigint;
  }>;
  
  /**
   * Get supported entry points
   */
  getSupportedEntryPoints(): Promise<Address[]>;
}

/**
 * User operation receipt
 */
export interface UserOperationReceipt {
  /**
   * User operation hash
   */
  userOpHash: Hash;
  
  /**
   * Entry point address
   */
  entryPoint: Address;
  
  /**
   * Sender address
   */
  sender: Address;
  
  /**
   * Nonce
   */
  nonce: bigint;
  
  /**
   * Paymaster address
   */
  paymaster?: Address;
  
  /**
   * Actual gas cost
   */
  actualGasCost: bigint;
  
  /**
   * Actual gas used
   */
  actualGasUsed: bigint;
  
  /**
   * Success flag
   */
  success: boolean;
  
  /**
   * Logs
   */
  logs: Array<{
    address: Address;
    topics: Hex[];
    data: Hex;
  }>;
  
  /**
   * Transaction receipt
   */
  receipt: {
    transactionHash: Hash;
    blockNumber: bigint;
    blockHash: Hash;
    transactionIndex: number;
    gasUsed: bigint;
    cumulativeGasUsed: bigint;
    status: 'success' | 'reverted';
  };
}

/**
 * Account recovery options
 */
export interface AccountRecoveryOptions {
  /**
   * Recovery method
   */
  method: 'social' | 'email' | 'guardians' | 'timelock' | 'custom';
  
  /**
   * Guardian addresses for social recovery
   */
  guardians?: Address[];
  
  /**
   * Threshold for guardian approval
   */
  threshold?: number;
  
  /**
   * Recovery delay in seconds
   */
  delay?: number;
  
  /**
   * Email for recovery
   */
  email?: string;
  
  /**
   * Custom recovery contract
   */
  recoveryContract?: Address;
}

/**
 * Multi-signature configuration
 */
export interface MultiSigConfig {
  /**
   * Owner addresses
   */
  owners: Address[];
  
  /**
   * Required signatures threshold
   */
  threshold: number;
  
  /**
   * Timelock delay for sensitive operations
   */
  timelockDelay?: number;
}