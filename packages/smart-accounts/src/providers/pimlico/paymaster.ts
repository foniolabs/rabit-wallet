import { Address, Hex } from '@rabit/types'
import { 
  PaymasterClient as IPaymasterClient,
  UserOperationRequest,
  PaymasterData,
  SponsorshipPolicy,
  PimlicoConfig,
  RpcError
} from '../../types'

export class PimlicoPaymasterClient implements IPaymasterClient {
  private config: PimlicoConfig
  private rpcUrl: string

  constructor(config: PimlicoConfig) {
    this.config = config
    this.rpcUrl = config.paymasterUrl || this.getDefaultPaymasterUrl()
  }

  async getPaymasterAndData(userOp: UserOperationRequest, context?: any): Promise<PaymasterData> {
    try {
      const result = await this.rpcCall('pm_sponsorUserOperation', [
        this.serializeUserOperationRequest(userOp),
        this.getEntryPointAddress(),
        {
          sponsorshipPolicyId: this.config.sponsorshipPolicyId,
          ...context
        }
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
      const result = await this.rpcCall('pm_getPaymasterStubData', [
        this.serializeUserOperationRequest(userOp),
        this.getEntryPointAddress(),
        {
          sponsorshipPolicyId: this.config.sponsorshipPolicyId,
          ...context
        }
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

  // Pimlico-specific methods
  async validateSponsorshipPolicy(policyId: string, userOpHash: Hex): Promise<boolean> {
    try {
      const result = await this.rpcCall('pimlico_validateSponsorshipPolicy', [
        policyId,
        userOpHash
      ])
      return result as boolean
    } catch (error) {
      // If method doesn't exist, assume validation passes
      if (this.isMethodNotFoundError(error)) {
        return true
      }
      throw this.handleRpcError(error, 'Failed to validate sponsorship policy')
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

  private getDefaultPaymasterUrl(): string {
    const chainId = this.config.chainId
    const apiKey = this.config.apiKey
    return `https://api.pimlico.io/v2/${this.getChainName(chainId)}/rpc?apikey=${apiKey}`
  }

  private getEntryPointAddress(): Address {
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
      case 11155111: return 'sepolia'
      default: return 'ethereum'
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