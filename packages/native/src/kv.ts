/**
 * Synchronous key-value store for hooks that persist local state.
 * Native → MMKV (fast, synchronous). Web / no native module → localStorage.
 */
import { MMKV } from 'react-native-mmkv'

interface KV {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
}

function makeStore(): KV {
  try {
    const mmkv = new MMKV({ id: 'rabit-wallet-kv' })
    return {
      getItem: (k) => mmkv.getString(k) ?? null,
      setItem: (k, v) => mmkv.set(k, v),
      removeItem: (k) => mmkv.delete(k),
    }
  } catch {
    // Web (react-native-web) or any env without the native module.
    const ls = (globalThis as { localStorage?: Storage }).localStorage
    return {
      getItem: (k) => (ls ? ls.getItem(k) : null),
      setItem: (k, v) => {
        try {
          ls?.setItem(k, v)
        } catch {
          /* quota */
        }
      },
      removeItem: (k) => {
        try {
          ls?.removeItem(k)
        } catch {
          /* noop */
        }
      },
    }
  }
}

export const kv: KV = makeStore()
