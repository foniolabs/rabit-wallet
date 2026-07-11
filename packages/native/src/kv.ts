/**
 * Module-level MMKV key-value store for hooks that persist local state
 * (activity history, imported tokens). Synchronous — mirrors localStorage.
 */
import { MMKV } from 'react-native-mmkv'

const mmkv = new MMKV({ id: 'rabit-wallet-kv' })

export const kv = {
  getItem: (key: string): string | null => mmkv.getString(key) ?? null,
  setItem: (key: string, value: string): void => mmkv.set(key, value),
  removeItem: (key: string): void => mmkv.delete(key),
}
