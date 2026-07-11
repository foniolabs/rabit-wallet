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
if (typeof globalThis.Buffer === 'undefined') {
  globalThis.Buffer = Buffer
}

// Some Solana/eth libs probe for `process`.
if (typeof (globalThis as { process?: unknown }).process === 'undefined') {
  ;(globalThis as { process?: unknown }).process = { env: {} }
}

export {}
