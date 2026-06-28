/**
 * AES-256-GCM encryption/decryption for key share storage
 * Uses Web Crypto API (available in both browsers and Node.js 20+)
 */

import { getSecureRandom } from '../utils/random.js';

export interface EncryptedData {
  /** Base64-encoded ciphertext */
  ciphertext: string;
  /** Base64-encoded initialization vector (12 bytes) */
  iv: string;
}

export interface PasswordEncryptedData extends EncryptedData {
  /** Base64-encoded salt for PBKDF2 (32 bytes) */
  salt: string;
}

/**
 * Get the Web Crypto API subtle interface.
 * In modern browsers and Node 20+, `globalThis.crypto.subtle` is available, so
 * no fallback is needed. Avoiding `require('crypto')` here keeps the bundle
 * compatible with ESM-only browser builds.
 */
function getSubtle(): SubtleCrypto {
  if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.subtle) {
    return globalThis.crypto.subtle;
  }
  throw new Error('Web Crypto API is not available in this environment');
}

/**
 * Encrypt data with a raw AES-256-GCM key
 */
export async function encrypt(
  data: Uint8Array,
  key: Uint8Array
): Promise<EncryptedData> {
  const subtle = getSubtle();
  const iv = getSecureRandom(12); // 96-bit IV for GCM

  const cryptoKey = await subtle.importKey(
    'raw',
    key,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  const ciphertext = await subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    data
  );

  return {
    ciphertext: uint8ToBase64(new Uint8Array(ciphertext)),
    iv: uint8ToBase64(iv),
  };
}

/**
 * Decrypt data with a raw AES-256-GCM key
 */
export async function decrypt(
  encrypted: EncryptedData,
  key: Uint8Array
): Promise<Uint8Array> {
  const subtle = getSubtle();

  const cryptoKey = await subtle.importKey(
    'raw',
    key,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  const plaintext = await subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToUint8(encrypted.iv) },
    cryptoKey,
    base64ToUint8(encrypted.ciphertext)
  );

  return new Uint8Array(plaintext);
}

/**
 * Derive an encryption key from a password using PBKDF2
 */
export async function deriveKeyFromPassword(
  password: string,
  salt?: Uint8Array
): Promise<{ key: Uint8Array; salt: Uint8Array }> {
  const subtle = getSubtle();
  const useSalt = salt || getSecureRandom(32);

  const baseKey = await subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const derivedBits = await subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: useSalt,
      iterations: 600_000, // OWASP recommended
      hash: 'SHA-256',
    },
    baseKey,
    256 // 32 bytes for AES-256
  );

  return {
    key: new Uint8Array(derivedBits),
    salt: useSalt,
  };
}

/**
 * Encrypt data with a password (PBKDF2 + AES-256-GCM)
 */
export async function encryptWithPassword(
  data: Uint8Array,
  password: string
): Promise<PasswordEncryptedData> {
  const { key, salt } = await deriveKeyFromPassword(password);
  const encrypted = await encrypt(data, key);

  return {
    ...encrypted,
    salt: uint8ToBase64(salt),
  };
}

/**
 * Decrypt data with a password
 */
export async function decryptWithPassword(
  encrypted: PasswordEncryptedData,
  password: string
): Promise<Uint8Array> {
  const salt = base64ToUint8(encrypted.salt);
  const { key } = await deriveKeyFromPassword(password, salt);
  return decrypt(encrypted, key);
}

// --- Encoding helpers ---

function uint8ToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }
  // Browser
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function base64ToUint8(base64: string): Uint8Array {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(base64, 'base64'));
  }
  // Browser
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
