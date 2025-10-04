/**
 * src/hooks/useSmartAccount.ts
 * React hook for smart account management
 */
import { useState, useEffect, useCallback } from 'react'
import { 
  SmartAccount, 
  SmartAccountConfig, 
  TransactionRequest,
  SmartAccountError 
} from '../types'
import { createSmartAccount } from '../index'

export interface UseSmartAccountOptions extends Omit<SmartAccountConfig, 'address'> {
  autoConnect?: boolean
  onError?: (error: Error) => void
  onAccountCreated?: (account: SmartAccount) => void
}

export interface UseSmartAccountReturn {
  smartAccount: SmartAccount | null
  isLoading: boolean
  isConnected: boolean
  error: Error | null
  connect: () => Promise<void>
  disconnect: () => void
  sendTransaction: (tx: TransactionRequest) => Promise<string>
  sendBatchTransaction: (txs: TransactionRequest[]) => Promise<string>
  retry: () => Promise<void>
}

export function useSmartAccount(options: UseSmartAccountOptions): UseSmartAccountReturn {
  const [smartAccount, setSmartAccount] = useState<SmartAccount | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const { autoConnect = true, onError, onAccountCreated, ...config } = options

  const connect = useCallback(async () => {
    if (isLoading || smartAccount) return

    setIsLoading(true)
    setError(null)

    try {
      const account = await createSmartAccount(config)
      setSmartAccount(account)
      onAccountCreated?.(account)
    } catch (err) {
      const error = err instanceof Error ? err : new SmartAccountError('Failed to create smart account')
      setError(error)
      onError?.(error)
    } finally {
      setIsLoading(false)
    }
  }, [config, isLoading, smartAccount, onAccountCreated, onError])

  const disconnect = useCallback(() => {
    setSmartAccount(null)
    setError(null)
  }, [])

  const sendTransaction = useCallback(async (tx: TransactionRequest) => {
    if (!smartAccount) {
      throw new SmartAccountError('Smart account not connected')
    }

    try {
      return await smartAccount.sendTransaction(tx)
    } catch (err) {
      const error = err instanceof Error ? err : new SmartAccountError('Transaction failed')
      setError(error)
      onError?.(error)
      throw error
    }
  }, [smartAccount, onError])

  const sendBatchTransaction = useCallback(async (txs: TransactionRequest[]) => {
    if (!smartAccount) {
      throw new SmartAccountError('Smart account not connected')
    }

    try {
      return await smartAccount.sendBatchTransaction(txs)
    } catch (err) {
      const error = err instanceof Error ? err : new SmartAccountError('Batch transaction failed')
      setError(error)
      onError?.(error)
      throw error
    }
  }, [smartAccount, onError])

  const retry = useCallback(async () => {
    if (error && !isLoading) {
      await connect()
    }
  }, [error, isLoading, connect])

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && !smartAccount && !isLoading && !error) {
      connect()
    }
  }, [autoConnect, smartAccount, isLoading, error, connect])

  return {
    smartAccount,
    isLoading,
    isConnected: !!smartAccount,
    error,
    connect,
    disconnect,
    sendTransaction,
    sendBatchTransaction,
    retry
  }
}