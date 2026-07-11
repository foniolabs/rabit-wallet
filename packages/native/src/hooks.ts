/**
 * React Native hooks. The *logic* is identical to the web SDK — they drive
 * RabitCore — so behavior stays consistent across web and native.
 *
 * This scaffold ships the essentials (auth + wallet). Port the rest
 * (useBalances, useSendToken, useOnRamp, useSwap) from `@rabit/react/src/hooks`
 * the same way — they're already DOM-free.
 */
import { useCallback, useState } from 'react'
import { useRabitContext } from './provider'

export function useAuth() {
  const { core, auth } = useRabitContext()
  const [isLoading, setLoading] = useState(false)

  const sendOtp = useCallback((email: string) => core.sendOTP(email), [core])

  const verifyOtp = useCallback(
    async (email: string, code: string, options?: { displayName?: string }) => {
      setLoading(true)
      try {
        return await core.verifyOTP(email, code, options)
      } finally {
        setLoading(false)
      }
    },
    [core],
  )

  const loginWithGoogle = useCallback(
    (idToken: string) => core.authenticateOAuth('google', idToken),
    [core],
  )

  const logout = useCallback(() => core.logout(), [core])

  return {
    isAuthenticated: auth.status === 'authenticated',
    user: auth.user ?? null,
    isLoading,
    sendOtp,
    verifyOtp,
    loginWithGoogle,
    logout,
  }
}

export function useWallet() {
  const { core, wallet } = useRabitContext()
  return {
    evmAddress: core.evmAddress,
    solanaAddress: core.solanaAddress,
    activeAccount: wallet.activeAccount ?? null,
    activeChainId: wallet.activeChainId ?? null,
    isReady: core.isReady,
    switchAccount: (address: string) => core.switchAccount(address),
  }
}
