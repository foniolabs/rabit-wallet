/**
 * The StorageAdapter injected into RabitCore for session + device-share
 * persistence. Native → MMKV (synchronous, matches the core contract). Web /
 * no native module → localStorage.
 */
import { MMKV } from 'react-native-mmkv'
import type { StorageAdapter } from '@rabit/types'

export function createMmkvStorage(id = 'rabit-wallet'): StorageAdapter {
  try {
    const mmkv = new MMKV({ id })
    return {
      getItem: (key) => mmkv.getString(key) ?? null,
      setItem: (key, value) => {
        mmkv.set(key, value)
      },
      removeItem: (key) => {
        mmkv.delete(key)
      },
    }
  } catch {
    const ls = (globalThis as { localStorage?: Storage }).localStorage
    return {
      getItem: (key) => (ls ? ls.getItem(key) : null),
      setItem: (key, value) => {
        try {
          ls?.setItem(key, value)
        } catch {
          /* quota */
        }
      },
      removeItem: (key) => {
        try {
          ls?.removeItem(key)
        } catch {
          /* noop */
        }
      },
    }
  }
}
