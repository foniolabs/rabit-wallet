/**
 * src/index.ts - Main exports for @rabit/smart-accounts - FIXED VERSION
 */

// Core types
export * from './types'

// Primary implementations (recommended)
export { createKernelAccount, KernelSmartAccount } from './implementations/kernel'
// Note: These will be available when implementations are ready:
// export { createSafeAccount, SafeSmartAccount } from './implementations/safe'
// export { createLightAccount, LightAccountSmartAccount } from './implementations/light-account'

// Provider clients
export { createPimlicoProvider, PimlicoProvider } from './providers/pimlico'
// Note: These will be available when implementations are ready:
// export { createAlchemyProvider, AlchemyProvider } from './providers/alchemy'
// export { createZeroDevProvider, ZeroDevProvider } from './providers/zerodev'

// Bundler and Paymaster clients
export { BundlerClient } from './clients/bundler'
export { PaymasterClient } from './clients/paymaster'

// User Operation utilities
export { 
  UserOperationBuilder,
  createUserOperationBuilder,
  getUserOperationHash,
  packUserOperation,
  createCallData,
  createBatchCallData,
  validateUserOperation as validateUserOp,
  estimateUserOperationGas
} from './clients/user-operation'

// Signer implementations
export { createEOASigner, EOASigner } from './signers/eoa'
export { createPasskeySigner, PasskeySigner, registerPasskey } from './signers/passkey'
export { createEmbeddedSigner, EmbeddedSigner } from './signers/embedded'
export { createMagicLinkSigner, MagicLinkSigner } from './signers/magic-link'
export { createWeb3AuthSigner, Web3AuthSigner } from './signers/web3auth'

// Factory
export { 
  SmartAccountFactory,
  createFactory,
  kernelFactory,
  getBestFactory,
  createOptimalAccount
} from './factory'

// Utilities
export { 
  validateUserOperation,
  validateSmartAccountConfig,
  validateTransactionRequest,
  validateSessionKey,
  validateSpendingLimit,
  isValidAddress as validateAddress,
  isValidHex,
  isSupportedChain
} from './utils/validation'

export { 
  estimateGas,
  estimateTransactionGas,
  estimateBatchGas,
  estimateUserOperationGas as estimateUserOpGas,
  calculateGasCost,
  formatGasCost,
  optimizeGasParameters
} from './utils/gas'

export { 
  isValidAddress, 
  getContractAddress, 
  getCreate2Address,
  normalizeAddress 
} from './utils/address'

export { 
  encodeCallData, 
  encodeBatchCallData,
  encodeUserOperation 
} from './utils/encoding'

// React hooks (commented out until React types are available)
// export { useSmartAccount } from './hooks/useSmartAccount'
// export { useSessionKeys } from './hooks/useSessionKeys'
// export { useGasSponsorship } from './hooks/useGasSponsorship'

// Constants
export {
  ENTRY_POINT_V06_ADDRESS,
  ENTRY_POINT_V07_ADDRESS,
  DEFAULT_ENTRY_POINT_ADDRESS,
  SAFE_FACTORY_ADDRESS,
  KERNEL_FACTORY_ADDRESS,
  LIGHT_ACCOUNT_FACTORY_ADDRESS,
  SUPPORTED_CHAINS,
  CHAIN_CONFIGS
} from './utils/constants'

/**
 * Recommended smart account creator - automatically selects best implementation
 */
export async function createSmartAccount(config: SmartAccountConfig): Promise<SmartAccount> {
  const { SmartAccountType } = await import('./types')
  
  // Default to Kernel for most use cases (best feature set)
  if (!config.type) {
    config.type = SmartAccountType.KERNEL
  }

  switch (config.type) {
    case SmartAccountType.KERNEL:
      const { createKernelAccount } = await import('./implementations/kernel')
      return createKernelAccount(config)
    case SmartAccountType.SAFE:
      throw new Error('Safe Account implementation not yet available')
    case SmartAccountType.LIGHT_ACCOUNT:
      throw new Error('Light Account implementation not yet available')
    default:
      throw new Error(`Unsupported smart account type: ${config.type}`)
  }
}

/**
 * Get recommended smart account type based on use case
 */
export function getRecommendedAccountType(useCase: 'gaming' | 'defi' | 'enterprise' | 'consumer'): SmartAccountType {
  const { SmartAccountType } = require('./types')
  
  switch (useCase) {
    case 'gaming':
    case 'consumer':
      return SmartAccountType.KERNEL // Best UX, session keys
    case 'defi':
      return SmartAccountType.LIGHT_ACCOUNT // Gas optimized
    case 'enterprise':
      return SmartAccountType.SAFE // Most secure, battle-tested
    default:
      return SmartAccountType.KERNEL
  }
}

/**
 * Create smart account with automatic provider and type selection
 */
export async function createOptimalSmartAccount(config: {
  signer: SmartAccountSigner
  apiKey: string
  chainId: ChainId
  useCase?: 'gaming' | 'defi' | 'enterprise' | 'consumer'
  preferredProvider?: ProviderType
  features?: Partial<SmartAccountFeatures>
}): Promise<SmartAccount> {
  
  // Select optimal account type based on use case
  const accountType = getRecommendedAccountType(config.useCase || 'consumer')
  
  // Select optimal provider based on use case and account type
  const providerType = config.preferredProvider || getRecommendedProvider(config.useCase, accountType)
  
  // Create provider configuration
  const provider = createProviderConfig(providerType, config.apiKey, config.chainId)
  
  // Create smart account configuration
  const accountConfig: SmartAccountConfig = {
  type: accountType,
  signer: config.signer,
  provider,
  ...(config.features && { features: config.features })
}
  
  return createSmartAccount(accountConfig)
}

/**
 * Helper function to get recommended provider
 */
function getRecommendedProvider(useCase?: string, accountType?: SmartAccountType): ProviderType {
  const { ProviderType } = require('./types')
  
  switch (useCase) {
    case 'gaming':
      return ProviderType.ZERODEV // Best for gaming with Kernel accounts
    case 'defi':
      return ProviderType.ALCHEMY // Reliable for DeFi
    case 'enterprise':
      return ProviderType.PIMLICO // Enterprise features
    case 'consumer':
    default:
      return ProviderType.PIMLICO // Good default choice
  }
}

/**
 * Helper function to create provider configuration
 */
function createProviderConfig(
  type: ProviderType, 
  apiKey: string, 
  chainId: ChainId
): SmartAccountProvider {
  const baseConfig = {
    type,
    apiKey,
    chainId
  }

  switch (type) {
    case ProviderType.PIMLICO:
      return {
        ...baseConfig,
        bundlerUrl: `https://api.pimlico.io/v1/${getChainName(chainId)}/rpc?apikey=${apiKey}`,
        paymasterUrl: `https://api.pimlico.io/v2/${getChainName(chainId)}/rpc?apikey=${apiKey}`
      }
    case ProviderType.ALCHEMY:
      return {
        ...baseConfig,
        bundlerUrl: `https://${getAlchemyNetwork(chainId)}.g.alchemy.com/v2/${apiKey}`,
        paymasterUrl: `https://${getAlchemyNetwork(chainId)}.g.alchemy.com/v2/${apiKey}`
      }
    case ProviderType.ZERODEV:
      return {
        ...baseConfig,
        bundlerUrl: `https://rpc.zerodev.app/api/v2/bundler/${apiKey}`,
        paymasterUrl: `https://rpc.zerodev.app/api/v2/paymaster/${apiKey}`
      }
    case ProviderType.BICONOMY:
      return {
        ...baseConfig,
        bundlerUrl: `https://bundler.biconomy.io/api/v2/${chainId}/${apiKey}`,
        paymasterUrl: `https://paymaster.biconomy.io/api/v1/${chainId}/${apiKey}`
      }
    case ProviderType.STACKUP:
      return {
        ...baseConfig,
        bundlerUrl: `https://api.stackup.sh/v1/node/${apiKey}`,
        paymasterUrl: `https://api.stackup.sh/v1/paymaster/${apiKey}`
      }
    default:
      throw new Error(`Unsupported provider type: ${type}`)
  }
}

function getChainName(chainId: ChainId): string {
  switch (chainId) {
    case 1: return 'ethereum'
    case 137: return 'polygon'
    case 10: return 'optimism'
    case 42161: return 'arbitrum'
    case 8453: return 'base'
    case 56: return 'bsc'
    case 43114: return 'avalanche'
    case 5: return 'goerli'
    case 80001: return 'polygon-mumbai'
    case 420: return 'optimism-goerli'
    case 421613: return 'arbitrum-goerli'
    case 84531: return 'base-goerli'
    case 11155111: return 'sepolia'
    default: return 'ethereum'
  }
}

function getAlchemyNetwork(chainId: ChainId): string {
  switch (chainId) {
    case 1: return 'eth-mainnet'
    case 137: return 'polygon-mainnet'
    case 10: return 'opt-mainnet'
    case 42161: return 'arb-mainnet'
    case 8453: return 'base-mainnet'
    case 5: return 'eth-goerli'
    case 80001: return 'polygon-mumbai'
    case 420: return 'opt-goerli'
    case 421613: return 'arb-goerli'
    case 84531: return 'base-goerli'
    case 11155111: return 'eth-sepolia'
    default: return 'eth-mainnet'
  }
}

// Import types for internal use
import { 
  SmartAccount, 
  SmartAccountConfig, 
  SmartAccountSigner,
  SmartAccountProvider,
  SmartAccountFeatures,
  SmartAccountType, 
  ProviderType, 
  ChainId 
} from './types'

// Version
export const version = '0.1.0'