import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { RabitCore, createRabit } from '@rabit/core'
import type { RabitConfig, AuthState, WalletState, StorageAdapter } from '@rabit/types'
import { createMmkvStorage } from './storage'

interface RabitContextValue {
  core: RabitCore
  config: RabitConfig
  auth: AuthState
  wallet: WalletState
}

const RabitContext = createContext<RabitContextValue | null>(null)

export interface RabitProviderProps {
  config: RabitConfig
  children: React.ReactNode
  /** Override the storage adapter (defaults to MMKV). */
  storage?: StorageAdapter
}

/**
 * React Native provider. Same shape as the web `RabitProvider`, but injects a
 * synchronous MMKV storage adapter so the SDK works without the DOM.
 */
export function RabitProvider({ config, children, storage }: RabitProviderProps) {
  const coreRef = useRef<RabitCore | null>(null)

  if (!coreRef.current) {
    const resolved: RabitConfig = { ...config, storage: storage ?? config.storage ?? createMmkvStorage() }
    coreRef.current = createRabit(resolved)
  }
  const core = coreRef.current

  const [auth, setAuth] = useState<AuthState>(core.auth)
  const [wallet, setWallet] = useState<WalletState>(core.wallet)

  useEffect(() => {
    const unsubAuth = core.on('auth:changed', (state) => setAuth(state as AuthState))
    const unsubWallet = core.on('wallet:changed', (state) => setWallet(state as WalletState))
    void core.tryRestoreSession().catch(() => {})
    return () => {
      unsubAuth()
      unsubWallet()
    }
  }, [core])

  const value = useMemo(() => ({ core, config, auth, wallet }), [core, config, auth, wallet])
  return <RabitContext.Provider value={value}>{children}</RabitContext.Provider>
}

export function useRabitContext(): RabitContextValue {
  const ctx = useContext(RabitContext)
  if (!ctx) throw new Error('useRabitContext must be used inside <RabitProvider>')
  return ctx
}
