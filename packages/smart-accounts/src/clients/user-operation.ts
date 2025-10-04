/**
 * src/clients/user-operation.ts
 * User Operation utilities and builder
 */
import { Address, Hash, Hex } from '@rabit/types'
import { 
  UserOperation,
  UserOperationRequest,
  UserOperationBuilder as IUserOperationBuilder,
  GasEstimate,
  TransactionRequest
} from '../types'
import { keccak256, concat, toBytes, encodeAbiParameters, parseAbiParameters } from 'viem'

export class UserOperationBuilder implements IUserOperationBuilder {
  private userOp: Partial<UserOperation> = {}

  constructor(initialUserOp?: Partial<UserOperationRequest>) {
    if (initialUserOp) {
      this.userOp = { ...initialUserOp }
    }
  }

  setSender(sender: Address): UserOperationBuilder {
    this.userOp.sender = sender
    return this
  }

  setNonce(nonce: bigint): UserOperationBuilder {
    this.userOp.nonce = nonce
    return this
  }

  setInitCode(initCode: Hex): UserOperationBuilder {
    this.userOp.initCode = initCode
    return this
  }

  setCallData(callData: Hex): UserOperationBuilder {
    this.userOp.callData = callData
    return this
  }

  setGasLimits(limits: Partial<GasEstimate>): UserOperationBuilder {
    if (limits.callGasLimit !== undefined) {
      this.userOp.callGasLimit = limits.callGasLimit
    }
    if (limits.verificationGasLimit !== undefined) {
      this.userOp.verificationGasLimit = limits.verificationGasLimit
    }
    if (limits.preVerificationGas !== undefined) {
      this.userOp.preVerificationGas = limits.preVerificationGas
    }
    if (limits.maxFeePerGas !== undefined) {
      this.userOp.maxFeePerGas = limits.maxFeePerGas
    }
    if (limits.maxPriorityFeePerGas !== undefined) {
      this.userOp.maxPriorityFeePerGas = limits.maxPriorityFeePerGas
    }
    return this
  }

  setPaymasterAndData(paymasterAndData: Hex): UserOperationBuilder {
    this.userOp.paymasterAndData = paymasterAndData
    return this
  }

  setSignature(signature: Hex): UserOperationBuilder {
    this.userOp.signature = signature
    return this
  }

  build(): UserOperation {
    this.validateUserOperation()
    return this.userOp as UserOperation
  }

  buildRequest(): UserOperationRequest {
    return this.userOp as UserOperationRequest
  }

  private validateUserOperation(): void {
    const required = ['sender', 'nonce', 'callData', 'callGasLimit', 'verificationGasLimit', 'preVerificationGas', 'maxFeePerGas', 'maxPriorityFeePerGas', 'signature']
    
    for (const field of required) {
      if (this.userOp[field as keyof UserOperation] === undefined) {
        throw new Error(`Missing required field: ${field}`)
      }
    }

    // Set defaults for optional fields
    if (this.userOp.initCode === undefined) {
      this.userOp.initCode = '0x' as Hex
    }
    if (this.userOp.paymasterAndData === undefined) {
      this.userOp.paymasterAndData = '0x' as Hex
    }
  }
}

export function createUserOperationBuilder(initialUserOp?: Partial<UserOperationRequest>): UserOperationBuilder {
  return new UserOperationBuilder(initialUserOp)
}

/**
 * Calculate the user operation hash according to ERC-4337
 */
export function getUserOperationHash(
  userOp: UserOperationRequest,
  entryPointAddress: Address,
  chainId: number
): Hash {
  const packedUserOp = packUserOperation(userOp)
  
  const encoded = encodeAbiParameters(
    parseAbiParameters('bytes32, address, uint256'),
    [keccak256(packedUserOp), entryPointAddress, BigInt(chainId)]
  )
  
  return keccak256(encoded) as Hash
}

/**
 * Pack user operation for hashing
 */
export function packUserOperation(userOp: UserOperationRequest): Hex {
  const packedData = encodeAbiParameters(
    parseAbiParameters('address, uint256, bytes32, bytes32, uint256, uint256, uint256, uint256, uint256, bytes32'),
    [
      userOp.sender || '0x0000000000000000000000000000000000000000',
      userOp.nonce || 0n,
      keccak256(userOp.initCode || '0x'),
      keccak256(userOp.callData),
      userOp.callGasLimit || 0n,
      userOp.verificationGasLimit || 0n,
      userOp.preVerificationGas || 0n,
      userOp.maxFeePerGas || 0n,
      userOp.maxPriorityFeePerGas || 0n,
      keccak256(userOp.paymasterAndData || '0x')
    ]
  )
  
  return packedData as Hex
}

/**
 * Create call data for a simple transaction
 */
export function createCallData(tx: TransactionRequest): Hex {
  // This is a simplified version - in reality, this would depend on the smart account implementation
  const executeSelector = '0xb61d27f6' // execute(address,uint256,bytes)
  
  const encoded = encodeAbiParameters(
    parseAbiParameters('address, uint256, bytes'),
    [tx.to, tx.value || 0n, tx.data || '0x']
  )
  
  return concat([executeSelector, encoded]) as Hex
}

/**
 * Create call data for batch transactions
 */
export function createBatchCallData(txs: TransactionRequest[]): Hex {
  // This is a simplified version - in reality, this would depend on the smart account implementation
  const executeBatchSelector = '0x18dfb3c7' // executeBatch(address[],uint256[],bytes[])
  
  const targets = txs.map(tx => tx.to)
  const values = txs.map(tx => tx.value || 0n)
  const datas = txs.map(tx => tx.data || '0x')
  
  const encoded = encodeAbiParameters(
    parseAbiParameters('address[], uint256[], bytes[]'),
    [targets, values, datas]
  )
  
  return concat([executeBatchSelector, encoded]) as Hex
}

/**
 * Validate user operation structure
 */
export function validateUserOperation(userOp: UserOperationRequest): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check required fields
  if (!userOp.sender) {
    errors.push('Missing sender address')
  }

  if (!userOp.callData) {
    errors.push('Missing call data')
  }

  if (userOp.nonce === undefined) {
    errors.push('Missing nonce')
  }

  // Check gas limits
  if (userOp.callGasLimit !== undefined && userOp.callGasLimit <= 0n) {
    errors.push('Call gas limit must be positive')
  }

  if (userOp.verificationGasLimit !== undefined && userOp.verificationGasLimit <= 0n) {
    errors.push('Verification gas limit must be positive')
  }

  if (userOp.preVerificationGas !== undefined && userOp.preVerificationGas <= 0n) {
    errors.push('Pre-verification gas must be positive')
  }

  // Check gas prices
  if (userOp.maxFeePerGas !== undefined && userOp.maxPriorityFeePerGas !== undefined) {
    if (userOp.maxFeePerGas < userOp.maxPriorityFeePerGas) {
      errors.push('Max fee per gas cannot be less than max priority fee per gas')
    }
  }

  // Check addresses are valid
  if (userOp.sender && !isValidAddress(userOp.sender)) {
    errors.push('Invalid sender address')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Estimate gas for user operation
 */
export function estimateUserOperationGas(userOp: UserOperationRequest): GasEstimate {
  // This is a simplified estimation - in reality, this would call the bundler
  
  const baseCallGas = 21000n // Base transaction cost
  const callDataGas = BigInt((userOp.callData?.length || 0) * 16) // Rough estimation
  
  return {
    callGasLimit: baseCallGas + callDataGas + 50000n, // Add buffer
    verificationGasLimit: 100000n, // Standard verification gas
    preVerificationGas: 21000n, // Standard pre-verification gas
    maxFeePerGas: 20000000000n, // 20 gwei
    maxPriorityFeePerGas: 2000000000n // 2 gwei
  }
}

/**
 * Helper function to check if an address is valid
 */
function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

/**
 * Convert user operation to packed format (ERC-4337 v0.7)
 */
export function toPackedUserOperation(userOp: UserOperation): any {
  // Pack account gas limits
  const accountGasLimits = concat([
    ('0x' + userOp.callGasLimit.toString(16).padStart(32, '0')) as Hex,
    ('0x' + userOp.verificationGasLimit.toString(16).padStart(32, '0')) as Hex
  ])

  // Pack gas fees
  const gasFees = concat([
    ('0x' + userOp.maxPriorityFeePerGas.toString(16).padStart(32, '0')) as Hex,
    ('0x' + userOp.maxFeePerGas.toString(16).padStart(32, '0')) as Hex
  ])

  return {
    sender: userOp.sender,
    nonce: userOp.nonce,
    initCode: userOp.initCode,
    callData: userOp.callData,
    accountGasLimits,
    preVerificationGas: userOp.preVerificationGas,
    gasFees,
    paymasterAndData: userOp.paymasterAndData,
    signature: userOp.signature
  }
}