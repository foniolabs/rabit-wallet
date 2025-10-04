/**
 * src/utils/validation.ts
 * Fixed validation utilities with proper null/undefined handling
 */
import { Address, Hex } from '@rabit/types'
import {
  SmartAccountConfig,
  SmartAccountType,
  SignerType,
  TransactionRequest,
  UserOperationRequest,
  UserOperation,
  SessionKey,
  SpendingLimit,
  ValidationError,
  ProviderType
} from '../types'

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

// Helper functions for validation
export function isValidAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

export function isValidHex(hex: string): boolean {
  if (!hex || typeof hex !== 'string') return false
  return /^0x[a-fA-F0-9]*$/.test(hex)
}

export function isValidSignature(signature: string): boolean {
  if (!signature || typeof signature !== 'string') return false
  const withoutPrefix = signature.replace('0x', '')
  const length = withoutPrefix.length
  // Valid signature lengths: 64 bytes (128 chars), 65 bytes (130 chars), 66 bytes (132 chars)
  return /^0x[a-fA-F0-9]{128,132}$/.test(signature)
}

export function isSupportedChain(chainId: number): boolean {
  const supportedChains = [1, 137, 10, 42161, 8453, 56, 43114, 5, 80001]
  return supportedChains.includes(chainId)
}

export function normalizeAddress(address: string): Address {
  if (!isValidAddress(address)) {
    throw new ValidationError(`Invalid address: ${address}`)
  }
  return address.toLowerCase() as Address
}

export function normalizeHex(hex: string): Hex {
  if (!isValidHex(hex)) {
    throw new ValidationError(`Invalid hex string: ${hex}`)
  }
  return hex.toLowerCase() as Hex
}

// Main validation functions
export function validateUserOperation(userOp: UserOperationRequest): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Early return for null/undefined input
  if (!userOp || typeof userOp !== 'object') {
    return {
      isValid: false,
      errors: ['Invalid user operation: input is null, undefined, or not an object'],
      warnings: []
    }
  }

  // Validate sender
  if (!userOp.sender) {
    errors.push('Missing sender address')
  } else if (!isValidAddress(userOp.sender)) {
    errors.push('Invalid sender address format')
  }

  // Validate call data
  if (!userOp.callData) {
    errors.push('Missing call data')
  } else if (!isValidHex(userOp.callData)) {
    errors.push('Invalid call data format')
  }

  // Validate nonce
  if (userOp.nonce === undefined || userOp.nonce === null) {
    errors.push('Missing nonce')
  } else if (userOp.nonce < 0n) {
    errors.push('Nonce cannot be negative')
  }

  // Validate gas limits
  if (userOp.callGasLimit !== undefined) {
    if (userOp.callGasLimit <= 0n) {
      errors.push('Call gas limit must be positive')
    } else if (userOp.callGasLimit > 10000000n) {
      warnings.push('Call gas limit is very high')
    }
  }

  if (userOp.verificationGasLimit !== undefined) {
    if (userOp.verificationGasLimit <= 0n) {
      errors.push('Verification gas limit must be positive')
    }
  }

  if (userOp.preVerificationGas !== undefined) {
    if (userOp.preVerificationGas <= 0n) {
      errors.push('Pre-verification gas must be positive')
    } else if (userOp.preVerificationGas < 21000n) {
      warnings.push('Pre-verification gas might be too low')
    }
  }

  // Validate gas prices
  if (userOp.maxFeePerGas !== undefined && userOp.maxPriorityFeePerGas !== undefined) {
    if (userOp.maxFeePerGas < userOp.maxPriorityFeePerGas) {
      errors.push('Max fee per gas cannot be less than max priority fee per gas')
    }
  }

  if (userOp.maxFeePerGas !== undefined && userOp.maxFeePerGas > 1000000000000n) {
    warnings.push('Max fee per gas is very high (>1000 gwei)')
  }

  // Validate hex fields
  if (userOp.initCode && !isValidHex(userOp.initCode)) {
    errors.push('Invalid init code format')
  }

  if (userOp.paymasterAndData && !isValidHex(userOp.paymasterAndData)) {
    errors.push('Invalid paymaster and data format')
  }

  if (userOp.signature && !isValidHex(userOp.signature)) {
    errors.push('Invalid signature format')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

export function validateSmartAccountConfig(config: SmartAccountConfig): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Early return for null/undefined input
  if (!config || typeof config !== 'object') {
    return {
      isValid: false,
      errors: ['Invalid smart account config: input is null, undefined, or not an object'],
      warnings: []
    }
  }

  // Validate account type
  if (!config.type) {
    errors.push('Account type is required')
  }

  // Validate signer
  if (!config.signer) {
    errors.push('Signer is required')
  } else {
    if (!config.signer.address || !isValidAddress(config.signer.address)) {
      errors.push('Invalid signer address')
    }
  }

  // Validate provider
  if (!config.provider) {
    errors.push('Provider is required')
  } else {
    if (!config.provider.apiKey) {
      warnings.push('No API key provided for provider')
    }

    if (!config.provider.chainId) {
      errors.push('Chain ID is required')
    } else if (!isSupportedChain(config.provider.chainId)) {
      warnings.push(`Chain ID ${config.provider.chainId} might not be supported`)
    }
  }

  // Validate recovery configuration if social recovery is enabled
  if (config.features?.socialRecovery && config.recoveryConfig) {
    if (!config.recoveryConfig.guardians || config.recoveryConfig.guardians.length === 0) {
      errors.push('Recovery guardians are required when social recovery is enabled')
    } else {
      // Validate guardian addresses
      config.recoveryConfig.guardians.forEach((guardian, index) => {
        if (!isValidAddress(guardian)) {
          errors.push(`Invalid guardian address: ${guardian}`)
        }
      })

      // Validate threshold
      if (config.recoveryConfig.threshold > config.recoveryConfig.guardians.length) {
        errors.push('Recovery threshold cannot exceed number of guardians')
      }

      if (config.recoveryConfig.threshold <= 0) {
        errors.push('Recovery threshold must be positive')
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

export function validateTransactionRequest(tx: TransactionRequest): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Early return for null/undefined input
  if (!tx || typeof tx !== 'object') {
    return {
      isValid: false,
      errors: ['Invalid transaction request: input is null, undefined, or not an object'],
      warnings: []
    }
  }

  // Validate recipient
  if (!tx.to) {
    errors.push('Transaction recipient address is required')
  } else if (!isValidAddress(tx.to)) {
    errors.push('Invalid recipient address format')
  }

  // Validate value
  if (tx.value !== undefined && tx.value < 0n) {
    errors.push('Transaction value cannot be negative')
  }

  // Validate data
  if (tx.data && !isValidHex(tx.data)) {
    errors.push('Invalid transaction data format')
  }

  // Validate gas parameters
  if (tx.gas !== undefined && tx.gas <= 0n) {
    errors.push('Gas limit must be positive')
  }

  // Check for conflicting gas parameters
  if (tx.gasPrice && (tx.maxFeePerGas || tx.maxPriorityFeePerGas)) {
    warnings.push('Both legacy gas price and EIP-1559 gas parameters provided')
  }

  // Validate EIP-1559 gas prices
  if (tx.maxFeePerGas !== undefined && tx.maxPriorityFeePerGas !== undefined) {
    if (tx.maxFeePerGas < tx.maxPriorityFeePerGas) {
      errors.push('Max fee per gas cannot be less than max priority fee per gas')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

export function validateSessionKey(sessionKey: SessionKey): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Early return for null/undefined input
  if (!sessionKey || typeof sessionKey !== 'object') {
    return {
      isValid: false,
      errors: ['Invalid session key: input is null, undefined, or not an object'],
      warnings: []
    }
  }

  // Validate ID
  if (!sessionKey.id || sessionKey.id.trim() === '') {
    errors.push('Session key ID is required')
  }

  // Validate public key
  if (!sessionKey.publicKey || !isValidHex(sessionKey.publicKey)) {
    errors.push('Valid public key is required')
  }

  // Validate permissions
  if (!sessionKey.permissions || sessionKey.permissions.length === 0) {
    errors.push('Session key must have at least one permission')
  } else {
    sessionKey.permissions.forEach((permission, index) => {
      if (!isValidAddress(permission.target)) {
        errors.push('Permission target must be a valid address')
      }
    })
  }

  // Validate time range
  if (sessionKey.validAfter >= sessionKey.validUntil) {
    errors.push('Valid until must be greater than valid after')
  }

  // Check if session key is expired
  const now = Math.floor(Date.now() / 1000)
  if (sessionKey.validUntil < now) {
    errors.push('Session key has already expired')
  }

  // Warn if session key is not yet valid
  if (sessionKey.validAfter > now) {
    warnings.push('Session key is not yet valid')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

export function validateSpendingLimit(limit: SpendingLimit): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Early return for null/undefined input
  if (!limit || typeof limit !== 'object') {
    return {
      isValid: false,
      errors: ['Invalid spending limit: input is null, undefined, or not an object'],
      warnings: []
    }
  }

  // Validate token address
  if (!limit.token || !isValidAddress(limit.token)) {
    errors.push('Valid token address is required')
  }

  // Validate amount
  if (limit.amount <= 0n) {
    errors.push('Spending limit amount must be positive')
  }

  // Validate period
  if (limit.period <= 0) {
    errors.push('Spending limit period must be positive')
  }

  // Check reset time
  const now = Math.floor(Date.now() / 1000)
  if (limit.resetTime < now) {
    warnings.push('Spending limit reset time is in the past')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

export function validateCompleteUserOperation(userOp: UserOperation): ValidationResult {
  const baseValidation = validateUserOperation(userOp)
  
  if (!baseValidation.isValid) {
    return baseValidation
  }

  const errors = [...baseValidation.errors]
  const warnings = [...baseValidation.warnings]

  // Additional validation for complete user operation
  if (!userOp.signature || userOp.signature === '0x') {
    errors.push('User operation must be signed')
  } else if (!isValidSignature(userOp.signature)) {
    errors.push('Invalid signature format')
  }

  // Check for required fields in complete user operation
  const requiredFields = ['callGasLimit', 'verificationGasLimit', 'preVerificationGas', 'maxFeePerGas', 'maxPriorityFeePerGas']
  requiredFields.forEach(field => {
    if (userOp[field as keyof UserOperation] === undefined) {
      errors.push(`Missing required field: ${field}`)
    }
  })

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

export function validateBatchTransactions(transactions: TransactionRequest[]): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Check if batch is empty
  if (!transactions || transactions.length === 0) {
    errors.push('Batch transactions cannot be empty')
    return { isValid: false, errors, warnings }
  }

  // Warn about large batch sizes
  if (transactions.length > 100) {
    warnings.push('Large batch size might cause gas limit issues')
  }

  let totalValue = 0n
  
  // Validate each transaction
  transactions.forEach((tx, index) => {
    if (!tx) return // Skip null transactions
    
    const txValidation = validateTransactionRequest(tx)
    
    // Add index prefix to errors
    txValidation.errors.forEach(error => {
      errors.push(`Transaction ${index}: ${error}`)
    })
    
    txValidation.warnings.forEach(warning => {
      warnings.push(`Transaction ${index}: ${warning}`)
    })

    // Accumulate total value
    if (tx.value) {
      totalValue += tx.value
    }
  })

  // Warn about high total value (>100 ETH)
  if (totalValue > 100n * 10n ** 18n) {
    warnings.push('Total batch value is very high')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}