/**
 * Crypto + Buffer polyfills for React Native.
 *
 * MUST be the very first import in your app entry (index.js / App.tsx),
 * before anything touches @noble/@scure/@solana:
 *
 *   import 'rabitwallet-native/polyfills'
 */
import 'react-native-get-random-values'
import { Buffer } from 'buffer'

// @noble/hashes & @scure/* read globalThis.crypto.getRandomValues (provided by
// react-native-get-random-values above). @solana/web3.js and borsh need Buffer.
const g = globalThis as Record<string, unknown>

if (typeof g.Buffer === 'undefined') {
  g.Buffer = Buffer
}

// Some Solana/eth libs probe for `process`.
if (typeof g.process === 'undefined') {
  g.process = { env: {} }
}

export {}
