/**
 * Private-key export helpers — format the in-memory hex keys into the shapes
 * users actually paste into other wallets.
 *
 *   EVM        →  `0x…` hex (MetaMask, Rabby, Frame all accept this)
 *   Solana     →  base58 secret key (Phantom, Solflare, Backpack)
 *               or `[u8; 64]` byte array (Solana CLI, Solflare alt format)
 */

import { ed25519 } from '@noble/curves/ed25519';
import { hexToBytes } from './utils/encoding.js';

/**
 * Format a hex EVM private key as an `0x`-prefixed string. Idempotent.
 */
export function exportEvmPrivateKey(privateKeyHex: string): string {
  return privateKeyHex.startsWith('0x') ? privateKeyHex : `0x${privateKeyHex}`;
}

/**
 * Build the full 64-byte ed25519 secret key (32 seed bytes + 32 public key
 * bytes) — that's what every Solana wallet's "import private key" field expects.
 */
function buildSolanaSecretKey(privateKeyHex: string): Uint8Array {
  const seed = hexToBytes(privateKeyHex);
  if (seed.length !== 32) {
    throw new Error(`Expected 32-byte ed25519 seed, got ${seed.length} bytes`);
  }
  const publicKey = ed25519.getPublicKey(seed);
  const secretKey = new Uint8Array(64);
  secretKey.set(seed, 0);
  secretKey.set(publicKey, 32);
  return secretKey;
}

/**
 * Solana 64-byte secret key, base58-encoded.
 * This is the format Phantom / Solflare / Backpack accept on import.
 */
export function exportSolanaSecretKeyBase58(privateKeyHex: string): string {
  return base58Encode(buildSolanaSecretKey(privateKeyHex));
}

/**
 * Solana 64-byte secret key as a JSON byte array — Solana CLI compatible.
 * (`solana-keygen recover` and the file-system keypair format both use this.)
 */
export function exportSolanaSecretKeyArray(privateKeyHex: string): number[] {
  return Array.from(buildSolanaSecretKey(privateKeyHex));
}

// ---------- base58 (same alphabet as Solana) ----------

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
  for (let i = digits.length - 1; i >= 0; i--) {
    body += BASE58_ALPHABET[digits[i]];
  }
  return leading + body;
}
