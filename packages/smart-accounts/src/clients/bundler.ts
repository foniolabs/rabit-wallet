/**
 * src/clients/bundler.ts
 * Generic Bundler Client Implementation
 */
import { Address, Hash, Hex } from '@rabit/types'
import { 
  BundlerClient as IBundlerClient,
  UserOperation,
  UserOperationRequest,
  UserOperationReceipt,
  GasEstimate,
  ProviderConfig,
  RpcError
} from '../types'

export class BundlerClient implements IBundlerClient {
  private config: ProviderConfig
  private rpcUrl: string

  constructor(config: ProviderConfig) {
    this.config = config
    this.rpcUrl = config.bundlerUrl || this.getDefaultBundlerUrl()
  }

  async sendUserOperation(userOp: UserOperation): Promise<Hash> {
    try {
      const result = await this.rpcCall('eth_sendUserOperation', [
        this.serializeUserOperation(userOp),
        this.getEntryPointAddress()
      ])
      return result as Hash
    } catch (error) {
      throw this.handleRpcError(error, 'Failed to send user operation')
    }
  }

  async estimateUserOperationGas(userOp: UserOperationRequest): Promise<GasEstimate> {
    try {
      const result = await this.rpcCall('eth_estimateUserOperationGas', [
        this.serializeUserOperationRequest(userOp),
        this.getEntryPointAddress()
      ])

      return {
        callGasLimit: BigInt(result.callGasLimit),
        verificationGasLimit: BigInt(result.verificationGasLimit),
        preVerificationGas: BigInt(result.preVerificationGas),
        maxFeePerGas: BigInt(result.maxFeePerGas || '0x0'),
        maxPriorityFeePerGas: BigInt(result.maxPriorityFeePerGas || '0x0')
      }
    } catch (error) {
      throw this.handleRpcError(error, 'Failed to estimate user operation gas')
    }
  }

  async getUserOperationByHash(hash: Hash): Promise<UserOperation | null> {
    try {
      const result = await this.rpcCall('eth_getUserOperationByHash', [hash])
      
      if (!result) {
        return null
      }

      return this.deserializeUserOperation(result)
    } catch (error) {
      throw this.handleRpcError(error, 'Failed to get user operation by hash')
    }
  }

  async getUserOperationReceipt(hash: Hash): Promise<UserOperationReceipt | null> {
    try {
      const result = await this.rpcCall('eth_getUserOperationReceipt', [hash])
      
      if (!result) {
        return null
      }

      return {
        userOpHash: result.userOpHash,
        sender: result.sender,
        nonce: BigInt(result.nonce),
        actualGasCost: BigInt(result.actualGasCost),
        actualGasUsed: BigInt(result.actualGasUsed),
        success: result.success,
        logs: result.logs || [],
        receipt: {
          transactionHash: result.receipt.transactionHash,
          transactionIndex: BigInt(result.receipt.transactionIndex),
          blockHash: result.receipt.blockHash,
          blockNumber: BigInt(result.receipt.blockNumber),
          from: result.receipt.from,
          to: result.receipt.to,
          cumulativeGasUsed: BigInt(result.receipt.cumulativeGasUsed),
          gasUsed: BigInt(result.receipt.gasUsed),
          logs: result.receipt.logs || [],
          status: result.receipt.status === '0x1' ? 'success' : 'reverted'
        }
      }
    } catch (error) {
      throw this.handleRpcError(error, 'Failed to get user operation receipt')
    }
  }

  async getSupportedEntryPoints(): Promise<Address[]> {
    try {
      const result = await this.rpcCall('eth_supportedEntryPoints', [])
      return result as Address[]
    } catch (error) {
      throw this.handleRpcError(error, 'Failed to get supported entry points')
    }
  }

  async getChainId(): Promise<Hex> {
    try {
      const result = await this.rpcCall('eth_chainId', [])
      return result as Hex
    } catch (error) {
      throw this.handleRpcError(error, 'Failed to get chain ID')
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

  private serializeUserOperation(userOp: UserOperation): any {
    return {
      sender: userOp.sender,
      nonce: '0x' + userOp.nonce.toString(16),
      initCode: userOp.initCode,
      callData: userOp.callData,
      callGasLimit: '0x' + userOp.callGasLimit.toString(16),
      verificationGasLimit: '0x' + userOp.verificationGasLimit.toString(16),
      preVerificationGas: '0x' + userOp.preVerificationGas.toString(16),
      maxFeePerGas: '0x' + userOp.maxFeePerGas.toString(16),
      maxPriorityFeePerGas: '0x' + userOp.maxPriorityFeePerGas.toString(16),
      paymasterAndData: userOp.paymasterAndData,
      signature: userOp.signature
    }
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

  private deserializeUserOperation(data: any): UserOperation {
    return {
      sender: data.sender,
      nonce: BigInt(data.nonce),
      initCode: data.initCode,
      callData: data.callData,
      callGasLimit: BigInt(data.callGasLimit),
      verificationGasLimit: BigInt(data.verificationGasLimit),
      preVerificationGas: BigInt(data.preVerificationGas),
      maxFeePerGas: BigInt(data.maxFeePerGas),
      maxPriorityFeePerGas: BigInt(data.maxPriorityFeePerGas),
      paymasterAndData: data.paymasterAndData,
      signature: data.signature
    }
  }

  private getDefaultBundlerUrl(): string {
    const chainId = this.config.chainId
    const apiKey = this.config.apiKey

    switch (this.config.type) {
      case 'pimlico':
        return `https://api.pimlico.io/v1/${this.getChainName(chainId)}/rpc?apikey=${apiKey}`
      case 'alchemy':
        return `https://${this.getAlchemyNetwork(chainId)}.g.alchemy.com/v2/${apiKey}`
      case 'stackup':
        return `https://api.stackup.sh/v1/node/${apiKey}`
      case 'biconomy':
        return `https://bundler.biconomy.io/api/v2/${chainId}/${apiKey}`
      case 'zerodev':
        return `https://rpc.zerodev.app/api/v2/bundler/${apiKey}`
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