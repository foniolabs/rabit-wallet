/**
 * Cryptographically secure random number generation
 * Works in both browser (Web Crypto API) and Node.js
 */

/**
 * Get cryptographically secure random bytes.
 * `globalThis.crypto.getRandomValues` is available in modern browsers and in
 * Node 19+. Avoiding `require('crypto')` keeps this bundle ESM/browser-safe.
 */
export function getSecureRandom(length: number): Uint8Array {
  if (typeof globalThis.crypto === 'undefined' || !globalThis.crypto.getRandomValues) {
    throw new Error('Web Crypto getRandomValues is not available in this environment');
  }
  const bytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(bytes);
  return bytes;
}
