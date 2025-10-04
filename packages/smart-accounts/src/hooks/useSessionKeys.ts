/**
 * src/hooks/useSessionKeys.ts
 * React hook for session key management
 */
import { useState, useEffect, useCallback } from 'react'
import { SmartAccount, SessionKey, SmartAccountError } from '../types'

export interface UseSessionKeysReturn {
  sessionKeys: SessionKey[]
  isLoading: boolean
  error: Error | null
  addSessionKey: (key: SessionKey) => Promise<void>
  removeSessionKey: (keyId: string) => Promise<void>
  refreshSessionKeys: () => Promise<void>
  isSessionKeyValid: (keyId: string) => boolean
}

export function useSessionKeys(smartAccount: SmartAccount | null): UseSessionKeysReturn {
  const [sessionKeys, setSessionKeys] = useState<SessionKey[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const refreshSessionKeys = useCallback(async () => {
    if (!smartAccount || !smartAccount.features.sessionKeys) {
      setSessionKeys([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const keys = await smartAccount.getSessionKeys()
      setSessionKeys(keys)
    } catch (err) {
      const error = err instanceof Error ? err : new SmartAccountError('Failed to fetch session keys')
      setError(error)
    } finally {
      setIsLoading(false)
    }
  }, [smartAccount])

  const addSessionKey = useCallback(async (key: SessionKey) => {
    if (!smartAccount) {
      throw new SmartAccountError('Smart account not connected')
    }

    if (!smartAccount.features.sessionKeys) {
      throw new SmartAccountError('Session keys not enabled for this account')
    }

    setIsLoading(true)
    setError(null)

    try {
      await smartAccount.addSessionKey(key)
      await refreshSessionKeys()
    } catch (err) {
      const error = err instanceof Error ? err : new SmartAccountError('Failed to add session key')
      setError(error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [smartAccount, refreshSessionKeys])

  const removeSessionKey = useCallback(async (keyId: string) => {
    if (!smartAccount) {
      throw new SmartAccountError('Smart account not connected')
    }

    setIsLoading(true)
    setError(null)

    try {
      await smartAccount.removeSessionKey(keyId)
      await refreshSessionKeys()
    } catch (err) {
      const error = err instanceof Error ? err : new SmartAccountError('Failed to remove session key')
      setError(error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [smartAccount, refreshSessionKeys])

  const isSessionKeyValid = useCallback((keyId: string) => {
    const sessionKey = sessionKeys.find(key => key.id === keyId)
    if (!sessionKey) return false

    const now = Math.floor(Date.now() / 1000)
    return now >= sessionKey.validAfter && now <= sessionKey.validUntil
  }, [sessionKeys])

  // Load session keys when smart account changes
  useEffect(() => {
    if (smartAccount && smartAccount.features.sessionKeys) {
      refreshSessionKeys()
    } else {
      setSessionKeys([])
    }
  }, [smartAccount, refreshSessionKeys])

  return {
    sessionKeys,
    isLoading,
    error,
    addSessionKey,
    removeSessionKey,
    refreshSessionKeys,
    isSessionKeyValid
  }
}