/**
 * BIP-39 Mnemonic generation and seed derivation
 */

import { generateMnemonic as bip39Generate, mnemonicToSeedSync, validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';

/**
 * Generate a new BIP-39 mnemonic (12 or 24 words)
 */
export function generateMnemonic(strength: 128 | 256 = 128): string {
  return bip39Generate(wordlist, strength);
}

/**
 * Convert a mnemonic to a seed (64 bytes)
 */
export function mnemonicToSeed(mnemonic: string, passphrase?: string): Uint8Array {
  if (!isValidMnemonic(mnemonic)) {
    throw new Error('Invalid mnemonic phrase');
  }
  return mnemonicToSeedSync(mnemonic, passphrase);
}

/**
 * Validate a BIP-39 mnemonic
 */
export function isValidMnemonic(mnemonic: string): boolean {
  return validateMnemonic(mnemonic, wordlist);
}
