/**
 * src/utils/gas.ts
 * Gas estimation and optimization utilities - FIXED VERSION
 */
import { Address, Hex } from '@rabit/types'
import { 
  TransactionRequest, 
  UserOperationRequest, 
  GasEstimate,
  SmartAccountType
} from '../types'
import { 
  DEFAULT_VERIFICATION_GAS_LIMIT,
  DEFAULT_CALL_GAS_LIMIT,
  DEFAULT_PRE_VERIFICATION_GAS,
  DEFAULT_MAX_FEE_PER_GAS,
  DEFAULT_MAX_PRIORITY_FEE_PER_GAS
} from './constants'

/**
 * Estimate gas for a user operation
 */
export function estimateUserOperationGas(
  userOp: UserOperationRequest,
  accountType: SmartAccountType = SmartAccountType.KERNEL
): GasEstimate {
  const callDataGas = estimateCallDataGas(userOp.callData)
  const initCodeGas = userOp.initCode && userOp.initCode !== '0x' 
    ? estimateInitCodeGas(userOp.initCode, accountType)
    : 0n

  return {
    callGasLimit: callDataGas + getBaseCallGas(accountType) + 50000n, // Add buffer
    verificationGasLimit: DEFAULT_VERIFICATION_GAS_LIMIT + initCodeGas,
    preVerificationGas: DEFAULT_PRE_VERIFICATION_GAS + estimatePreVerificationGas(userOp),
    maxFeePerGas: DEFAULT_MAX_FEE_PER_GAS,
    maxPriorityFeePerGas: DEFAULT_MAX_PRIORITY_FEE_PER_GAS
  }
}

/**
 * Estimate gas for a simple transaction
 */
export function estimateTransactionGas(tx: TransactionRequest): GasEstimate {
  const baseGas = 21000n // Base transaction cost
  const dataGas = tx.data ? estimateCallDataGas(tx.data) : 0n
  const valueGas = tx.value && tx.value > 0n ? 9000n : 0n // Additional cost for value transfer

  return {
    callGasLimit: baseGas + dataGas + valueGas + 50000n, // Add buffer
    verificationGasLimit: DEFAULT_VERIFICATION_GAS_LIMIT,
    preVerificationGas: DEFAULT_PRE_VERIFICATION_GAS,
    maxFeePerGas: DEFAULT_MAX_FEE_PER_GAS,
    maxPriorityFeePerGas: DEFAULT_MAX_PRIORITY_FEE_PER_GAS
  }
}

/**
 * Main gas estimation function (alias for estimateTransactionGas)
 * This fixes the missing export error
 */
export function estimateGas(tx: TransactionRequest): GasEstimate {
  return estimateTransactionGas(tx)
}

/**
 * Estimate gas for batch transactions
 */
export function estimateBatchGas(
  txs: TransactionRequest[],
  accountType: SmartAccountType = SmartAccountType.KERNEL
): GasEstimate {
  let totalCallGas = getBaseBatchGas(accountType)
  
  for (const tx of txs) {
    const txGas = estimateTransactionGas(tx)
    totalCallGas += txGas.callGasLimit - 21000n // Subtract base cost, already included in batch
  }

  // Add overhead for batch processing
  totalCallGas += BigInt(txs.length) * 5000n

  return {
    callGasLimit: totalCallGas,
    verificationGasLimit: DEFAULT_VERIFICATION_GAS_LIMIT,
    preVerificationGas: DEFAULT_PRE_VERIFICATION_GAS + BigInt(txs.length) * 1000n,
    maxFeePerGas: DEFAULT_MAX_FEE_PER_GAS,
    maxPriorityFeePerGas: DEFAULT_MAX_PRIORITY_FEE_PER_GAS
  }
}

/**
 * Estimate call data gas cost
 */
export function estimateCallDataGas(callData: Hex): bigint {
  if (!callData || callData === '0x') return 0n

  const bytes = callData.slice(2) // Remove 0x prefix
  let gas = 0n

  for (let i = 0; i < bytes.length; i += 2) {
    const byte = bytes.slice(i, i + 2)
    if (byte === '00') {
      gas += 4n // Zero byte cost
    } else {
      gas += 16n // Non-zero byte cost
    }
  }

  return gas
}

/**
 * Estimate init code gas cost
 */
export function estimateInitCodeGas(
  initCode: Hex,
  accountType: SmartAccountType
): bigint {
  const callDataGas = estimateCallDataGas(initCode)
  const creationGas = getAccountCreationGas(accountType)
  
  return callDataGas + creationGas
}

/**
 * Estimate pre-verification gas
 */
export function estimatePreVerificationGas(userOp: UserOperationRequest): bigint {
  // Base pre-verification gas
  let preVerificationGas = 0n

  // Add gas for calldata
  const userOpCallData = serializeUserOperationForGas(userOp)
  preVerificationGas += estimateCallDataGas(userOpCallData)

  // Add overhead for bundler processing
  preVerificationGas += 5000n

  return preVerificationGas
}

/**
 * Get base call gas for different account types
 */
function getBaseCallGas(accountType: SmartAccountType): bigint {
  switch (accountType) {
    case SmartAccountType.KERNEL:
      return 35000n
    case SmartAccountType.SAFE:
      return 45000n
    case SmartAccountType.LIGHT_ACCOUNT:
      return 25000n
    case SmartAccountType.BICONOMY:
      return 40000n
    case SmartAccountType.SIMPLE_ACCOUNT:
      return 30000n
    case SmartAccountType.COINBASE:
      return 35000n
    default:
      return 35000n
  }
}

/**
 * Get base batch gas for different account types
 */
function getBaseBatchGas(accountType: SmartAccountType): bigint {
  switch (accountType) {
    case SmartAccountType.KERNEL:
      return 50000n
    case SmartAccountType.SAFE:
      return 60000n
    case SmartAccountType.LIGHT_ACCOUNT:
      return 40000n
    case SmartAccountType.BICONOMY:
      return 55000n
    case SmartAccountType.SIMPLE_ACCOUNT:
      return 45000n
    case SmartAccountType.COINBASE:
      return 50000n
    default:
      return 50000n
  }
}

/**
 * Get account creation gas for different account types
 */
function getAccountCreationGas(accountType: SmartAccountType): bigint {
  switch (accountType) {
    case SmartAccountType.KERNEL:
      return 200000n
    case SmartAccountType.SAFE:
      return 300000n
    case SmartAccountType.LIGHT_ACCOUNT:
      return 150000n
    case SmartAccountType.BICONOMY:
      return 250000n
    case SmartAccountType.SIMPLE_ACCOUNT:
      return 180000n
    case SmartAccountType.COINBASE:
      return 200000n
    default:
      return 200000n
  }
}

/**
 * Optimize gas parameters based on network conditions
 */
export function optimizeGasParameters(
  baseEstimate: GasEstimate,
  options: {
    priority?: 'low' | 'medium' | 'high'
    maxFeePerGas?: bigint
    networkConditions?: 'congested' | 'normal' | 'fast'
  } = {}
): GasEstimate {
  const { priority = 'medium', networkConditions = 'normal' } = options

  let multiplier = 1.0

  // Adjust based on priority
  switch (priority) {
    case 'low':
      multiplier = 0.8
      break
    case 'medium':
      multiplier = 1.0
      break
    case 'high':
      multiplier = 1.5
      break
  }

  // Adjust based on network conditions
  switch (networkConditions) {
    case 'fast':
      multiplier *= 0.9
      break
    case 'normal':
      multiplier *= 1.0
      break
    case 'congested':
      multiplier *= 2.0
      break
  }

  const optimizedMaxFee = options.maxFeePerGas || 
    BigInt(Math.floor(Number(baseEstimate.maxFeePerGas) * multiplier))
  const optimizedPriorityFee = 
    BigInt(Math.floor(Number(baseEstimate.maxPriorityFeePerGas) * multiplier))

  return {
    ...baseEstimate,
    maxFeePerGas: optimizedMaxFee,
    maxPriorityFeePerGas: optimizedPriorityFee
  }
}

/**
 * Calculate total gas cost in wei
 */
export function calculateGasCost(
  gasEstimate: GasEstimate,
  useMaxFee: boolean = true
): bigint {
  const totalGas = gasEstimate.callGasLimit + 
                   gasEstimate.verificationGasLimit + 
                   gasEstimate.preVerificationGas

  const gasPrice = useMaxFee ? gasEstimate.maxFeePerGas : gasEstimate.maxPriorityFeePerGas
  
  return totalGas * gasPrice
}

/**
 * Format gas cost to human readable string
 */
export function formatGasCost(
  gasCostWei: bigint,
  options: {
    currency?: 'ETH' | 'GWEI' | 'WEI'
    decimals?: number
  } = {}
): string {
  const { currency = 'ETH', decimals = 6 } = options

  switch (currency) {
    case 'WEI':
      return gasCostWei.toString() + ' wei'
    case 'GWEI':
      const gwei = Number(gasCostWei) / 1e9
      return gwei.toFixed(decimals) + ' gwei'
    case 'ETH':
    default:
      const eth = Number(gasCostWei) / 1e18
      return eth.toFixed(decimals) + ' ETH'
  }
}

/**
 * Estimate gas for ERC-20 token operations
 */
export function estimateERC20Gas(operation: 'transfer' | 'approve' | 'transferFrom'): bigint {
  switch (operation) {
    case 'transfer':
      return 65000n
    case 'approve':
      return 46000n
    case 'transferFrom':
      return 70000n
    default:
      return 65000n
  }
}

/**
 * Estimate gas for NFT operations
 */
export function estimateNFTGas(
  operation: 'transfer' | 'approve' | 'setApprovalForAll' | 'mint',
  tokenStandard: 'ERC721' | 'ERC1155' = 'ERC721'
): bigint {
  const base = tokenStandard === 'ERC721' ? 80000n : 90000n

  switch (operation) {
    case 'transfer':
      return base
    case 'approve':
      return base - 20000n
    case 'setApprovalForAll':
      return base - 25000n
    case 'mint':
      return base + 50000n
    default:
      return base
  }
}

/**
 * Buffer gas estimates for safety
 */
export function addGasBuffer(
  gasEstimate: GasEstimate,
  bufferPercentage: number = 20
): GasEstimate {
  const multiplier = 1 + (bufferPercentage / 100)

  return {
    callGasLimit: BigInt(Math.floor(Number(gasEstimate.callGasLimit) * multiplier)),
    verificationGasLimit: BigInt(Math.floor(Number(gasEstimate.verificationGasLimit) * multiplier)),
    preVerificationGas: BigInt(Math.floor(Number(gasEstimate.preVerificationGas) * multiplier)),
    maxFeePerGas: gasEstimate.maxFeePerGas,
    maxPriorityFeePerGas: gasEstimate.maxPriorityFeePerGas
  }
}

/**
 * Serialize user operation for gas calculation
 */
function serializeUserOperationForGas(userOp: UserOperationRequest): Hex {
  // Simplified serialization for gas estimation
  const fields = [
    userOp.sender || '0x',
    userOp.nonce?.toString(16) || '0',
    userOp.initCode || '0x',
    userOp.callData,
    userOp.callGasLimit?.toString(16) || '0',
    userOp.verificationGasLimit?.toString(16) || '0',
    userOp.preVerificationGas?.toString(16) || '0',
    userOp.maxFeePerGas?.toString(16) || '0',
    userOp.maxPriorityFeePerGas?.toString(16) || '0',
    userOp.paymasterAndData || '0x',
    userOp.signature || '0x'
  ]

  return ('0x' + fields.join('').replace(/0x/g, '')) as Hex
}

/**
 * Get recommended gas parameters for different networks
 */
export function getNetworkGasConfig(chainId: number): {
  maxFeePerGas: bigint
  maxPriorityFeePerGas: bigint
  gasMultiplier: number
} {
  switch (chainId) {
    case 1: // Ethereum Mainnet
      return {
        maxFeePerGas: 30000000000n, // 30 gwei
        maxPriorityFeePerGas: 2000000000n, // 2 gwei
        gasMultiplier: 1.0
      }
    case 137: // Polygon
      return {
        maxFeePerGas: 50000000000n, // 50 gwei
        maxPriorityFeePerGas: 30000000000n, // 30 gwei
        gasMultiplier: 1.2
      }
    case 10: // Optimism
      return {
        maxFeePerGas: 1000000n, // 0.001 gwei
        maxPriorityFeePerGas: 1000000n, // 0.001 gwei
        gasMultiplier: 1.0
      }
    case 42161: // Arbitrum
      return {
        maxFeePerGas: 1000000000n, // 1 gwei
        maxPriorityFeePerGas: 1000000000n, // 1 gwei
        gasMultiplier: 1.0
      }
    case 8453: // Base
      return {
        maxFeePerGas: 1000000n, // 0.001 gwei
        maxPriorityFeePerGas: 1000000n, // 0.001 gwei
        gasMultiplier: 1.0
      }
    default:
      return {
        maxFeePerGas: DEFAULT_MAX_FEE_PER_GAS,
        maxPriorityFeePerGas: DEFAULT_MAX_PRIORITY_FEE_PER_GAS,
        gasMultiplier: 1.0
      }
  }
}