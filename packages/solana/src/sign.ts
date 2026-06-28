/**
 * Solana off-chain message signing — for "Sign in with Solana" and other
 * dApp-issued challenges. Returns a base58 signature, the same shape Phantom
 * returns from its `signMessage` API.
 */

import { ed25519 } from '@noble/curves/ed25519';
import { hexToBytes } from './hex.js';

export interface SignMessageResult {
  /** Raw 64-byte ed25519 signature in base58 (Phantom-compatible). */
  signature: string;
  /** Public key in base58 (the wallet's Solana address). */
  publicKey: string;
}

const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

function base58Encode(bytes: Uint8Array): string {
  const digits = [0];
  for (const byte of bytes) {
    let carry = byte;
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8;
      digits[j] = carry % 58;
      carry = (carry / 58) | 0;
    }
    while (carry > 0) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }
  let leading = '';
  for (const byte of bytes) {
    if (byte === 0) leading += BASE58_ALPHABET[0];
    else break;
  }
  let body = '';
  for (let i = digits.length - 1; i >= 0; i--) body += BASE58_ALPHABET[digits[i]];
  return leading + body;
}

/**
 * Sign a UTF-8 message with the ed25519 private key.
 */
export function signSolanaMessage(args: {
  privateKeyHex: string;
  message: string;
}): SignMessageResult {
  const seed = hexToBytes(args.privateKeyHex);
  if (seed.length !== 32) throw new Error(`Expected 32-byte ed25519 seed, got ${seed.length}`);
  const messageBytes = new TextEncoder().encode(args.message);
  const signature = ed25519.sign(messageBytes, seed);
  const publicKey = ed25519.getPublicKey(seed);
  return {
    signature: base58Encode(signature),
    publicKey: base58Encode(publicKey),
  };
}
