/**
 * src/hooks/useGasSponsorship.ts
 * React hook for gas sponsorship management
 */
import { useState, useEffect, useCallback } from 'react'
import { SmartAccount, TransactionRequest, SmartAccountError } from '../types'
import { calculateGasCost, estimateUserOperationGas } from '../utils/gas'

export interface GasSponsorshipInfo {
  isSponsored: boolean
  estimatedCost: bigint
  sponsorshipPolicy?: string
  remainingQuota?: bigint
}

export interface UseGasSponsorshipReturn {
  sponsorshipInfo: GasSponsorshipInfo | null
  isLoading: boolean
  error: Error | null
  checkSponsorship: (tx: TransactionRequest) => Promise<GasSponsorshipInfo>
  refreshQuota: () => Promise<void>
}

export function useGasSponsorship(smartAccount: SmartAccount | null): UseGasSponsorshipReturn {
  const [sponsorshipInfo, setSponsorshipInfo] = useState<GasSponsorshipInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const checkSponsorship = useCallback(async (tx: TransactionRequest): Promise<GasSponsorshipInfo> => {
    if (!smartAccount) {
      throw new SmartAccountError('Smart account not connected')
    }

    setIsLoading(true)
    setError(null)

    try {
      // Estimate gas for the transaction
      const gasEstimate = estimateUserOperationGas({
        sender: smartAccount.address,
        callData: '0x', // This would be properly encoded in real implementation
        nonce: 0n // This would be fetched from the account
      }, smartAccount.type)

      const estimatedCost = calculateGasCost(gasEstimate)

      // Check if gas sponsorship is enabled
      const isSponsored = smartAccount.features.gasSponsorship

      const info: GasSponsorshipInfo = {
        isSponsored,
        estimatedCost,
        sponsorshipPolicy: isSponsored ? 'default' : undefined,
        remainingQuota: isSponsored ? 1000000000000000000n : undefined // 1 ETH equivalent
      }

      setSponsorshipInfo(info)
      return info
    } catch (err) {
      const error = err instanceof Error ? err : new SmartAccountError('Failed to check sponsorship')
      setError(error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [smartAccount])

  const refreshQuota = useCallback(async () => {
    if (!smartAccount || !smartAccount.features.gasSponsorship) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // In a real implementation, this would fetch the actual quota from the paymaster
      const remainingQuota = 1000000000000000000n // 1 ETH equivalent

      setSponsorshipInfo(prev => prev ? {
        ...prev,
        remainingQuota
      } : null)
    } catch (err) {
      const error = err instanceof Error ? err : new SmartAccountError('Failed to refresh quota')
      setError(error)
    } finally {
      setIsLoading(false)
    }
  }, [smartAccount])

  // Reset sponsorship info when smart account changes
  useEffect(() => {
    setSponsorshipInfo(null)
    setError(null)
  }, [smartAccount])

  return {
    sponsorshipInfo,
    isLoading,
    error,
    checkSponsorship,
    refreshQuota
  }
}