/**
 * A synchronous StorageAdapter backed by MMKV — the piece that lets the SDK
 * persist the session + device share off the DOM.
 *
 * MMKV is synchronous (unlike AsyncStorage), which matches RabitCore's storage
 * contract exactly, so no async refactor of the core is needed.
 */
import { MMKV } from 'react-native-mmkv'
import type { StorageAdapter } from '@rabit/types'

export function createMmkvStorage(id = 'rabit-wallet'): StorageAdapter {
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
}
