/**
 * src/providers/pimlico/index.ts
 * Pimlico Provider Implementation
 */
import { Address, Hex, ChainId } from '@rabit/types'
import { 
  PimlicoConfig,
  BundlerClient,
  PaymasterClient,
  ProviderType
} from '../../types'
import { PimlicoBundlerClient } from '@/providers/pimlico/bundler'
import { PimlicoPaymasterClient } from './paymaster'

export class PimlicoProvider {
  public readonly type = ProviderType.PIMLICO
  public readonly config: PimlicoConfig
  public readonly bundler: PimlicoBundlerClient
  public readonly paymaster: PimlicoPaymasterClient

  constructor(config: PimlicoConfig) {
    this.config = config
    this.bundler = new PimlicoBundlerClient(config)
    this.paymaster = new PimlicoPaymasterClient(config)
  }

  getBundlerClient(): BundlerClient {
    return this.bundler
  }

  getPaymasterClient(): PaymasterClient {
    return this.paymaster
  }

  getConfig(): PimlicoConfig {
    return { ...this.config }
  }

  // Pimlico-specific methods
  async getGasPrice(): Promise<{ slow: bigint; standard: bigint; fast: bigint }> {
    return this.bundler.getGasPrice()
  }

  async getSponsorshipPolicies(): Promise<any[]> {
    return this.paymaster.getSponsorshipPolicies()
  }

  async validateSponsorshipPolicy(policyId: string, userOpHash: Hex): Promise<boolean> {
    return this.paymaster.validateSponsorshipPolicy(policyId, userOpHash)
  }
}

/**
 * Create a Pimlico provider
 */
export function createPimlicoProvider(config: {
  apiKey: string
  chainId: ChainId
  sponsorshipPolicyId?: string
  webhookSecret?: string
  entryPointAddress?: Address
}): PimlicoProvider {
  const pimlicoConfig: PimlicoConfig = {
    type: ProviderType.PIMLICO,
    apiKey: config.apiKey,
    chainId: config.chainId,
    bundlerUrl: `https://api.pimlico.io/v1/${getChainName(config.chainId)}/rpc?apikey=${config.apiKey}`,
    paymasterUrl: `https://api.pimlico.io/v2/${getChainName(config.chainId)}/rpc?apikey=${config.apiKey}`,
    ...(config.entryPointAddress && { entryPointAddress: config.entryPointAddress }),
    ...(config.sponsorshipPolicyId && { sponsorshipPolicyId: config.sponsorshipPolicyId }),
    ...(config.webhookSecret && { webhookSecret: config.webhookSecret })
  }

  return new PimlicoProvider(pimlicoConfig)
}
/**
 * Create Pimlico client for specific use cases
 */
export function createPimlicoClient(config: {
  apiKey: string
  chainId: ChainId
  useCase?: 'gaming' | 'defi' | 'enterprise' | 'consumer'
  sponsorshipPolicyId?: string
}): PimlicoProvider {
  const provider = createPimlicoProvider(config)

  // Configure based on use case
  switch (config.useCase) {
    case 'gaming':
      // Gaming typically needs fast transactions and gas sponsorship
      break
    case 'defi':
      // DeFi needs precise gas estimation
      break
    case 'enterprise':
      // Enterprise needs reliability and compliance features
      break
    case 'consumer':
    default:
      // Consumer apps need simplicity and gas sponsorship
      break
  }

  return provider
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
    case 84531: return 'base-goerli'
    case 5: return 'goerli'
    case 80001: return 'polygon-mumbai'
    case 420: return 'optimism-goerli'
    case 421613: return 'arbitrum-goerli'
    case 11155111: return 'sepolia'
    default: return 'ethereum'
  }
}

// Re-export clients
export { PimlicoBundlerClient } from '@/providers/pimlico/bundler'
export { PimlicoPaymasterClient } from './paymaster'