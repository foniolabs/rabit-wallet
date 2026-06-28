/**
 * BIP-32/44 Hierarchical Deterministic key derivation
 * Derives both EVM (secp256k1) and Solana (ed25519) keys from the same seed
 */

import { HDKey } from '@scure/bip32';
import { secp256k1 } from '@noble/curves/secp256k1';
import { ed25519 } from '@noble/curves/ed25519';
import { keccak_256 } from '@noble/hashes/sha3';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils';

/** BIP-44 paths */
export const DERIVATION_PATHS = {
  /** Standard Ethereum path */
  EVM: "m/44'/60'/0'/0/0",
  /** Standard Solana path */
  SOLANA: "m/44'/501'/0'/0'",
} as const;

export interface DerivedKey {
  privateKey: Uint8Array;
  publicKey: Uint8Array;
  address: string;
  derivationPath: string;
}

/**
 * Derive an EVM (Ethereum) key pair from a seed
 * Uses secp256k1 curve, keccak256 for address
 */
export function deriveEvmKey(seed: Uint8Array, path: string = DERIVATION_PATHS.EVM): DerivedKey {
  const hdkey = HDKey.fromMasterSeed(seed);
  const child = hdkey.derive(path);

  if (!child.privateKey) {
    throw new Error('Failed to derive EVM private key');
  }

  const privateKey = child.privateKey;
  const publicKey = child.publicKey!;

  // Ethereum address: keccak256 of uncompressed public key (without 04 prefix), take last 20 bytes
  // We need the uncompressed public key for this
  const pubKeyUncompressed = uncompressPublicKey(publicKey);
  // Remove the 04 prefix
  const pubKeyBody = pubKeyUncompressed.slice(1);
  const hash = keccak_256(pubKeyBody);
  const addressBytes = hash.slice(-20);
  const address = checksumAddress(bytesToHex(addressBytes));

  return {
    privateKey,
    publicKey,
    address,
    derivationPath: path,
  };
}

/**
 * Derive a Solana key pair from a seed
 * Uses Ed25519 curve, base58 for address
 */
export function deriveSolanaKey(seed: Uint8Array, path: string = DERIVATION_PATHS.SOLANA): DerivedKey {
  // Solana uses a different derivation: SLIP-10 for ed25519
  // We derive 32 bytes from the BIP-32 path, then use as ed25519 seed
  const hdkey = HDKey.fromMasterSeed(seed);
  const child = hdkey.derive(path);

  if (!child.privateKey) {
    throw new Error('Failed to derive Solana private key');
  }

  // Use the derived 32 bytes as the ed25519 private key seed
  const ed25519PrivateKey = child.privateKey;
  const ed25519PublicKey = ed25519.getPublicKey(ed25519PrivateKey);

  // Solana address is the base58-encoded public key
  const address = base58Encode(ed25519PublicKey);

  return {
    privateKey: ed25519PrivateKey,
    publicKey: ed25519PublicKey,
    address,
    derivationPath: path,
  };
}

/**
 * Uncompress a secp256k1 public key
 */
function uncompressPublicKey(compressed: Uint8Array): Uint8Array {
  const point = secp256k1.ProjectivePoint.fromHex(compressed);
  return point.toRawBytes(false); // false = uncompressed
}

/**
 * EIP-55 checksum address encoding
 */
function checksumAddress(hexAddress: string): string {
  const addr = hexAddress.toLowerCase().replace('0x', '');
  const hash = bytesToHex(keccak_256(new TextEncoder().encode(addr)));

  let result = '0x';
  for (let i = 0; i < addr.length; i++) {
    if (parseInt(hash[i], 16) >= 8) {
      result += addr[i].toUpperCase();
    } else {
      result += addr[i];
    }
  }
  return result;
}

/**
 * Base58 encoding (for Solana addresses)
 */
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

  // Leading zeros
  let output = '';
  for (const byte of bytes) {
    if (byte === 0) output += BASE58_ALPHABET[0];
    else break;
  }

  // Convert digits to base58 string (digits are in reverse order)
  for (let i = digits.length - 1; i >= 0; i--) {
    output += BASE58_ALPHABET[digits[i]];
  }

  return output;
}
