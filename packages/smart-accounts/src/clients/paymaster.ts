/**
 * src/clients/paymaster.ts
 * Generic Paymaster Client Implementation
 */
import { Address, Hex } from '@rabit/types'
import { 
  PaymasterClient as IPaymasterClient,
  UserOperationRequest,
  PaymasterData,
  SponsorshipPolicy,
  ProviderConfig,
  RpcError
} from '../types'

export class PaymasterClient implements IPaymasterClient {
  private config: ProviderConfig
  private rpcUrl: string

  constructor(config: ProviderConfig) {
    this.config = config
    this.rpcUrl = config.paymasterUrl || this.getDefaultPaymasterUrl()
  }

  async getPaymasterAndData(userOp: UserOperationRequest, context?: any): Promise<PaymasterData> {
    try {
      const method = this.getPaymasterMethod()
      const result = await this.rpcCall(method, [
        this.serializeUserOperationRequest(userOp),
        this.getEntryPointAddress(),
        context || {}
      ])

      return {
  paymaster: result.paymaster,
  paymasterData: result.paymasterData || '0x',
  ...(result.paymasterVerificationGasLimit && {
    paymasterVerificationGasLimit: BigInt(result.paymasterVerificationGasLimit)
  }),
  ...(result.paymasterPostOpGasLimit && {
    paymasterPostOpGasLimit: BigInt(result.paymasterPostOpGasLimit)
  })
}
    } catch (error) {
      throw this.handleRpcError(error, 'Failed to get paymaster and data')
    }
  }

  async getPaymasterStubData(userOp: UserOperationRequest, context?: any): Promise<PaymasterData> {
    try {
      const method = this.getPaymasterStubMethod()
      const result = await this.rpcCall(method, [
        this.serializeUserOperationRequest(userOp),
        this.getEntryPointAddress(),
        context || {}
      ])

      return {
  paymaster: result.paymaster,
  paymasterData: result.paymasterData || '0x',
  ...(result.paymasterVerificationGasLimit && {
    paymasterVerificationGasLimit: BigInt(result.paymasterVerificationGasLimit)
  }),
  ...(result.paymasterPostOpGasLimit && {
    paymasterPostOpGasLimit: BigInt(result.paymasterPostOpGasLimit)
  })
}
    } catch (error) {
      throw this.handleRpcError(error, 'Failed to get paymaster stub data')
    }
  }

  async validatePaymasterUserOp(userOp: UserOperationRequest): Promise<boolean> {
    try {
      // This is a custom method that might not be available on all paymasters
      const result = await this.rpcCall('pm_validatePaymasterUserOp', [
        this.serializeUserOperationRequest(userOp),
        this.getEntryPointAddress()
      ])
      return result as boolean
    } catch (error) {
      // If method doesn't exist, assume validation passes
      if (this.isMethodNotFoundError(error)) {
        return true
      }
      throw this.handleRpcError(error, 'Failed to validate paymaster user operation')
    }
  }

  async getSponsorshipPolicies(): Promise<SponsorshipPolicy[]> {
    try {
      // This is a custom method for getting sponsorship policies
      const result = await this.rpcCall('pm_getSponsorshipPolicies', [])
      return result.map((policy: any) => ({
        id: policy.id,
        name: policy.name,
        isActive: policy.isActive,
        rules: policy.rules || [],
        gasLimits: {
          maxGasPerTransaction: policy.gasLimits?.maxGasPerTransaction ? BigInt(policy.gasLimits.maxGasPerTransaction) : undefined,
          maxGasPerDay: policy.gasLimits?.maxGasPerDay ? BigInt(policy.gasLimits.maxGasPerDay) : undefined,
          maxGasPerWeek: policy.gasLimits?.maxGasPerWeek ? BigInt(policy.gasLimits.maxGasPerWeek) : undefined
        }
      }))
    } catch (error) {
      // If method doesn't exist, return empty array
      if (this.isMethodNotFoundError(error)) {
        return []
      }
      throw this.handleRpcError(error, 'Failed to get sponsorship policies')
    }
  }

  private async rpcCall(method: string, params: any[]): Promise<any> {
    const body = {
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    // Add API key to headers based on provider type
    if (this.config.apiKey) {
      switch (this.config.type) {
        case 'pimlico':
          // Pimlico uses API key in URL typically
          break
        case 'alchemy':
          headers['Authorization'] = `Bearer ${this.config.apiKey}`
          break
        case 'biconomy':
          headers['authToken'] = this.config.apiKey
          break
        case 'zerodev':
          headers['Authorization'] = `Bearer ${this.config.apiKey}`
          break
        case 'stackup':
          headers['Authorization'] = `Bearer ${this.config.apiKey}`
          break
        default:
          headers['Authorization'] = `Bearer ${this.config.apiKey}`
      }
    }

    const response = await fetch(this.rpcUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    if (data.error) {
      const error = new RpcError(data.error.message)
      error.code = data.error.code
      error.data = data.error.data
      throw error
    }

    return data.result
  }

  private serializeUserOperationRequest(userOp: UserOperationRequest): any {
    return {
      sender: userOp.sender || '0x',
      nonce: userOp.nonce ? '0x' + userOp.nonce.toString(16) : '0x0',
      initCode: userOp.initCode || '0x',
      callData: userOp.callData,
      callGasLimit: userOp.callGasLimit ? '0x' + userOp.callGasLimit.toString(16) : undefined,
      verificationGasLimit: userOp.verificationGasLimit ? '0x' + userOp.verificationGasLimit.toString(16) : undefined,
      preVerificationGas: userOp.preVerificationGas ? '0x' + userOp.preVerificationGas.toString(16) : undefined,
      maxFeePerGas: userOp.maxFeePerGas ? '0x' + userOp.maxFeePerGas.toString(16) : undefined,
      maxPriorityFeePerGas: userOp.maxPriorityFeePerGas ? '0x' + userOp.maxPriorityFeePerGas.toString(16) : undefined,
      paymasterAndData: userOp.paymasterAndData || '0x',
      signature: userOp.signature || '0x'
    }
  }

  private getPaymasterMethod(): string {
    switch (this.config.type) {
      case 'pimlico':
        return 'pm_sponsorUserOperation'
      case 'alchemy':
        return 'alchemy_requestGasAndPaymasterAndData'
      case 'biconomy':
        return 'pm_sponsorUserOperation'
      case 'zerodev':
        return 'pm_sponsorUserOperation'
      case 'stackup':
        return 'pm_sponsorUserOperation'
      default:
        return 'pm_sponsorUserOperation'
    }
  }

  private getPaymasterStubMethod(): string {
    switch (this.config.type) {
      case 'pimlico':
        return 'pm_getPaymasterStubData'
      case 'alchemy':
        return 'alchemy_requestPaymasterAndData'
      case 'biconomy':
        return 'pm_getPaymasterStubData'
      case 'zerodev':
        return 'pm_getPaymasterStubData'
      case 'stackup':
        return 'pm_getPaymasterStubData'
      default:
        return 'pm_getPaymasterStubData'
    }
  }

  private getDefaultPaymasterUrl(): string {
    const chainId = this.config.chainId
    const apiKey = this.config.apiKey

    switch (this.config.type) {
      case 'pimlico':
        return `https://api.pimlico.io/v2/${this.getChainName(chainId)}/rpc?apikey=${apiKey}`
      case 'alchemy':
        return `https://${this.getAlchemyNetwork(chainId)}.g.alchemy.com/v2/${apiKey}`
      case 'stackup':
        return `https://api.stackup.sh/v1/paymaster/${apiKey}`
      case 'biconomy':
        return `https://paymaster.biconomy.io/api/v1/${chainId}/${apiKey}`
      case 'zerodev':
        return `https://rpc.zerodev.app/api/v2/paymaster/${apiKey}`
      default:
        throw new Error(`Unsupported provider type: ${this.config.type}`)
    }
  }

  private getEntryPointAddress(): Address {
    // Default to EntryPoint v0.6 address
    return this.config.entryPointAddress || '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789' as Address
  }

  private getChainName(chainId: number): string {
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
      default: return 'ethereum'
    }
  }

  private getAlchemyNetwork(chainId: number): string {
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
      default: return 'eth-mainnet'
    }
  }

  private isMethodNotFoundError(error: any): boolean {
    return error.code === -32601 || error.message?.includes('method not found')
  }

  private handleRpcError(error: any, context: string): Error {
    if (error instanceof RpcError) {
      return error
    }

    const rpcError = new RpcError(`${context}: ${error.message}`)
    rpcError.code = error.code || -1
    rpcError.data = error.data
    return rpcError
  }
}