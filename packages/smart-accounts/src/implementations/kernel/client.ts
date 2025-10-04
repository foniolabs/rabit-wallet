import { Address, Hash, Hex } from '@rabit/types'
import { 
  SmartAccountConfig, 
  TransactionRequest,
  SessionKey,
  SpendingLimit,
  BundlerClient,
  PaymasterClient,
  UserOperation,
  UserOperationRequest,
  SmartAccountError
} from '../../types'
import { BundlerClient as GenericBundlerClient } from '../../clients/bundler'
import { PaymasterClient as GenericPaymasterClient } from '../../clients/paymaster'
import { 
  createUserOperationBuilder,
  createCallData,
  createBatchCallData
} from '../../clients/user-operation'
import { encodeCallData, encodeBatchCallData } from '../../utils/encoding'
import { estimateUserOperationGas } from '../../utils/gas'
import { getKernelInitCode } from './factory'

export class KernelAccountClient {
  private config: SmartAccountConfig
  private bundlerClient?: BundlerClient  
  private paymasterClient?: PaymasterClient

  constructor(config: SmartAccountConfig) {
    this.config = config
    // Initialize bundler and paymaster clients based on provider
    try {
      this.bundlerClient = new GenericBundlerClient(config.provider)
      
      if (config.provider.paymasterUrl) {
        this.paymasterClient = new GenericPaymasterClient(config.provider)
      }
    } catch (error) {
      console.warn('Failed to initialize clients:', error)
    }
  }

  async sendTransaction(tx: TransactionRequest): Promise<Hash> {
    if (!this.bundlerClient) {
      throw new SmartAccountError('Bundler client not initialized', 'CLIENT_NOT_INITIALIZED')
    }

    try {
      // Create user operation for the transaction
      const userOp = await this.createUserOperationForTransaction(tx)
      
      // Send user operation via bundler
      return await this.bundlerClient.sendUserOperation(userOp)
    } catch (error) {
      throw new SmartAccountError(
        `Failed to send transaction: ${error}`,
        'TRANSACTION_FAILED',
        { transaction: tx }
      )
    }
  }

  async sendBatchTransaction(txs: TransactionRequest[]): Promise<Hash> {
    if (!this.bundlerClient) {
      throw new SmartAccountError('Bundler client not initialized', 'CLIENT_NOT_INITIALIZED')
    }

    try {
      // Create user operation for batch transactions
      const userOp = await this.createUserOperationForBatch(txs)
      
      // Send user operation via bundler
      return await this.bundlerClient.sendUserOperation(userOp)
    } catch (error) {
      throw new SmartAccountError(
        `Failed to send batch transaction: ${error}`,
        'BATCH_TRANSACTION_FAILED',
        { transactions: txs }
      )
    }
  }

  async addSessionKey(key: SessionKey): Promise<void> {
    try {
      // Create transaction to add session key to Kernel account
      const addSessionKeyTx: TransactionRequest = {
        to: this.config.address!,
        data: this.encodeAddSessionKeyData(key),
        value: 0n
      }
      
      await this.sendTransaction(addSessionKeyTx)
    } catch (error) {
      throw new SmartAccountError(
        `Failed to add session key: ${error}`,
        'SESSION_KEY_ADD_FAILED',
        { sessionKey: key }
      )
    }
  }

  async removeSessionKey(keyId: string): Promise<void> {
    try {
      // Create transaction to remove session key from Kernel account
      const removeSessionKeyTx: TransactionRequest = {
        to: this.config.address!,
        data: this.encodeRemoveSessionKeyData(keyId),
        value: 0n
      }
      
      await this.sendTransaction(removeSessionKeyTx)
    } catch (error) {
      throw new SmartAccountError(
        `Failed to remove session key: ${error}`,
        'SESSION_KEY_REMOVE_FAILED',
        { keyId }
      )
    }
  }

  async getSessionKeys(): Promise<SessionKey[]> {
    try {
      // Query session keys from Kernel account
      // This would typically involve reading from the account's storage
      // For now, return empty array as this requires contract interaction
      console.warn('getSessionKeys: Contract interaction not yet implemented')
      return []
    } catch (error) {
      throw new SmartAccountError(
        `Failed to get session keys: ${error}`,
        'SESSION_KEY_QUERY_FAILED'
      )
    }
  }

  async updateSpendingLimit(limit: SpendingLimit): Promise<void> {
    try {
      // Create transaction to update spending limit
      const updateLimitTx: TransactionRequest = {
        to: this.config.address!,
        data: this.encodeUpdateSpendingLimitData(limit),
        value: 0n
      }
      
      await this.sendTransaction(updateLimitTx)
    } catch (error) {
      throw new SmartAccountError(
        `Failed to update spending limit: ${error}`,
        'SPENDING_LIMIT_UPDATE_FAILED',
        { limit }
      )
    }
  }

  async getSpendingLimits(): Promise<SpendingLimit[]> {
    try {
      // Query spending limits from Kernel account
      // This would typically involve reading from the account's storage
      // For now, return empty array as this requires contract interaction
      console.warn('getSpendingLimits: Contract interaction not yet implemented')
      return []
    } catch (error) {
      throw new SmartAccountError(
        `Failed to get spending limits: ${error}`,
        'SPENDING_LIMIT_QUERY_FAILED'
      )
    }
  }

  async initiateRecovery(newOwner: Address, guardians?: Address[]): Promise<void> {
    try {
      // Create transaction to initiate recovery process
      const initiateRecoveryTx: TransactionRequest = {
        to: this.config.address!,
        data: this.encodeInitiateRecoveryData(newOwner, guardians),
        value: 0n
      }
      
      await this.sendTransaction(initiateRecoveryTx)
    } catch (error) {
      throw new SmartAccountError(
        `Failed to initiate recovery: ${error}`,
        'RECOVERY_INITIATE_FAILED',
        { newOwner, guardians }
      )
    }
  }

  async approveRecovery(guardian: Address): Promise<void> {
    try {
      // Create transaction to approve recovery
      const approveRecoveryTx: TransactionRequest = {
        to: this.config.address!,
        data: this.encodeApproveRecoveryData(guardian),
        value: 0n
      }
      
      await this.sendTransaction(approveRecoveryTx)
    } catch (error) {
      throw new SmartAccountError(
        `Failed to approve recovery: ${error}`,
        'RECOVERY_APPROVE_FAILED',
        { guardian }
      )
    }
  }

  async executeRecovery(): Promise<void> {
    try {
      // Create transaction to execute recovery
      const executeRecoveryTx: TransactionRequest = {
        to: this.config.address!,
        data: this.encodeExecuteRecoveryData(),
        value: 0n
      }
      
      await this.sendTransaction(executeRecoveryTx)
    } catch (error) {
      throw new SmartAccountError(
        `Failed to execute recovery: ${error}`,
        'RECOVERY_EXECUTE_FAILED'
      )
    }
  }

  async cancelRecovery(): Promise<void> {
    try {
      // Create transaction to cancel recovery
      const cancelRecoveryTx: TransactionRequest = {
        to: this.config.address!,
        data: this.encodeCancelRecoveryData(),
        value: 0n
      }
      
      await this.sendTransaction(cancelRecoveryTx)
    } catch (error) {
      throw new SmartAccountError(
        `Failed to cancel recovery: ${error}`,
        'RECOVERY_CANCEL_FAILED'
      )
    }
  }

  async getNonce(): Promise<bigint> {
    try {
      // Get nonce from the account
      // This would typically query the account's nonce from the blockchain
      // For now, return 0 as a placeholder
      console.warn('getNonce: Blockchain query not yet implemented')
      return 0n
    } catch (error) {
      throw new SmartAccountError(
        `Failed to get nonce: ${error}`,
        'NONCE_QUERY_FAILED'
      )
    }
  }

  async getBalance(token?: Address): Promise<bigint> {
    try {
      // Get balance from chain
      // This would typically use a public client to query balance
      // For now, return 0 as placeholder
      console.warn('getBalance: Blockchain query not yet implemented')
      return 0n
    } catch (error) {
      throw new SmartAccountError(
        `Failed to get balance: ${error}`,
        'BALANCE_QUERY_FAILED',
        { token }
      )
    }
  }

  async estimateGas(tx: TransactionRequest): Promise<bigint> {
    try {
      if (!this.bundlerClient) {
        // Fallback to simple estimation
        return 21000n + (tx.data ? BigInt(tx.data.length * 16) : 0n)
      }

      // Create user operation for gas estimation
      const userOp = await this.createUserOperationRequest(tx)
      
      // Estimate gas via bundler
      const gasEstimate = await this.bundlerClient.estimateUserOperationGas(userOp)
      
      return gasEstimate.callGasLimit + gasEstimate.verificationGasLimit + gasEstimate.preVerificationGas
    } catch (error) {
      console.warn('Gas estimation failed, using fallback:', error)
      // Fallback estimation
      return 100000n
    }
  }

  async isAccountDeployed(address: Address): Promise<boolean> {
    try {
      // Check if account is deployed by querying bytecode
      // This would typically use a public client
      // For now, return false as placeholder
      console.warn('isAccountDeployed: Blockchain query not yet implemented')
      return false
    } catch (error) {
      console.warn('Deployment check failed:', error)
      return false
    }
  }

  // Private helper methods

  private async createUserOperationForTransaction(tx: TransactionRequest): Promise<UserOperation> {
    const userOpRequest = await this.createUserOperationRequest(tx)
    return this.buildCompleteUserOperation(userOpRequest)
  }

  private async createUserOperationForBatch(txs: TransactionRequest[]): Promise<UserOperation> {
    // Use encodeBatchCallData directly to avoid function signature issues
    const calls = txs.map(tx => ({
      target: tx.to,
      value: tx.value || 0n,
      data: tx.data || '0x' as Hex
    }))
    
    const callData = encodeBatchCallData(calls)
    
    const userOpRequest: UserOperationRequest = {
      sender: this.config.address!,
      callData,
      nonce: await this.getNonce()
    }

    return this.buildCompleteUserOperation(userOpRequest)
  }

  private async createUserOperationRequest(tx: TransactionRequest): Promise<UserOperationRequest> {
    // Fix: Use encodeCallData directly with proper parameters
    const callData = encodeCallData(tx.to, tx.value || 0n, tx.data || '0x')
    
    return {
      sender: this.config.address!,
      callData,
      nonce: await this.getNonce()
    }
  }

  private async buildCompleteUserOperation(userOpRequest: UserOperationRequest): Promise<UserOperation> {
    // Get init code if account not deployed
    const isDeployed = await this.isAccountDeployed(this.config.address!)
    const initCode = isDeployed ? '0x' as Hex : await getKernelInitCode(this.config)

    // Estimate gas
    const gasEstimate = estimateUserOperationGas({
      ...userOpRequest,
      initCode
    })

    // Get paymaster data if available
    let paymasterAndData: Hex = '0x'
    if (this.paymasterClient) {
      try {
        const paymasterData = await this.paymasterClient.getPaymasterAndData(userOpRequest)
        paymasterAndData = `${paymasterData.paymaster}${paymasterData.paymasterData.slice(2)}` as Hex
      } catch (error) {
        // Continue without paymaster if it fails
        console.warn('Paymaster failed, continuing without sponsorship:', error)
      }
    }

    // Build complete user operation
    const builder = createUserOperationBuilder()
      .setSender(userOpRequest.sender!)
      .setNonce(userOpRequest.nonce!)
      .setInitCode(initCode)
      .setCallData(userOpRequest.callData)
      .setGasLimits(gasEstimate)
      .setPaymasterAndData(paymasterAndData)

    // Sign the user operation
    const userOp = builder.buildRequest()
    const signature = await this.signUserOperation(userOp)
    
    return builder.setSignature(signature).build()
  }

  private async signUserOperation(userOp: UserOperationRequest): Promise<Hex> {
    // Create user operation hash and sign it
    // This is a simplified implementation - in production you'd use proper ERC-4337 hash
    const message = `UserOperation:${JSON.stringify(userOp)}`
    return await this.config.signer.signMessage(message)
  }

  // Encoding methods for Kernel-specific operations (placeholders)
  private encodeAddSessionKeyData(key: SessionKey): Hex {
    // Encode call data for adding session key
    // This would use the actual Kernel contract ABI
    console.warn('encodeAddSessionKeyData: ABI encoding not yet implemented')
    return '0x' as Hex
  }

  private encodeRemoveSessionKeyData(keyId: string): Hex {
    // Encode call data for removing session key
    console.warn('encodeRemoveSessionKeyData: ABI encoding not yet implemented')
    return '0x' as Hex
  }

  private encodeUpdateSpendingLimitData(limit: SpendingLimit): Hex {
    // Encode call data for updating spending limit
    console.warn('encodeUpdateSpendingLimitData: ABI encoding not yet implemented')
    return '0x' as Hex
  }

  private encodeInitiateRecoveryData(newOwner: Address, guardians?: Address[]): Hex {
    // Encode call data for initiating recovery
    console.warn('encodeInitiateRecoveryData: ABI encoding not yet implemented')
    return '0x' as Hex
  }

  private encodeApproveRecoveryData(guardian: Address): Hex {
    // Encode call data for approving recovery
    console.warn('encodeApproveRecoveryData: ABI encoding not yet implemented')
    return '0x' as Hex
  }

  private encodeExecuteRecoveryData(): Hex {
    // Encode call data for executing recovery
    console.warn('encodeExecuteRecoveryData: ABI encoding not yet implemented')
    return '0x' as Hex
  }

  private encodeCancelRecoveryData(): Hex {
    // Encode call data for canceling recovery
    console.warn('encodeCancelRecoveryData: ABI encoding not yet implemented')
    return '0x' as Hex
  }
}