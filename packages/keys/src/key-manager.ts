/**
 * KeyManager — orchestrates the full key lifecycle
 *
 * 1. Generate: mnemonic → seed → split into 3 Shamir shares
 * 2. Store: device share → IndexedDB, auth share → backend, recovery share → user
 * 3. Reconstruct: 2 of 3 shares → seed → derive EVM + Solana keys
 */

import type {
  KeyShare,
  KeyGenerationResult,
  KeyReconstructionResult,
  DerivedKeyPair,
  ShareType,
} from '@rabit/types';
import { generateMnemonic, mnemonicToSeed } from './derivation/mnemonic.js';
import { deriveEvmKey, deriveSolanaKey, DERIVATION_PATHS } from './derivation/hd-key.js';
import { splitSecret, combineShares, type ShamirShare } from './shamir/sharing.js';
import { storeDeviceShare, getDeviceShare, hasDeviceShare, removeDeviceShare } from './storage/device-share.js';
import { bytesToHex, hexToBytes } from './utils/encoding.js';

/**
 * Generate a fresh wallet:
 * - Creates a new mnemonic
 * - Derives seed
 * - Splits seed into 3 Shamir shares (2-of-3)
 * - Derives EVM and Solana key pairs
 *
 * Returns the shares + derived keys. The caller is responsible for:
 * - Storing the device share locally (call storeDeviceShareLocally)
 * - Sending the auth share to the backend
 * - Presenting the recovery share to the user for backup
 */
export async function generateWallet(): Promise<KeyGenerationResult & { mnemonic: string }> {
  // 1. Generate mnemonic and seed
  const mnemonic = generateMnemonic(128); // 12 words
  const seed = mnemonicToSeed(mnemonic);

  // 2. Split the seed into 3 shares (threshold = 2)
  const shamirShares = splitSecret(seed, 2, 3);

  // 3. Map to typed shares
  const shareTypes: ShareType[] = ['device', 'auth', 'recovery'];
  const shares: KeyShare[] = shamirShares.map((s, i) => ({
    index: s.index,
    type: shareTypes[i],
    data: bytesToHex(s.data),
    createdAt: Date.now(),
  }));

  // 4. Derive key pairs
  const evmKey = deriveEvmKey(seed);
  const solanaKey = deriveSolanaKey(seed);

  const evmKeyPair: DerivedKeyPair = {
    chain: 'evm',
    derivationPath: DERIVATION_PATHS.EVM,
    publicKey: bytesToHex(evmKey.publicKey),
    address: evmKey.address,
    privateKey: bytesToHex(evmKey.privateKey),
  };

  const solanaKeyPair: DerivedKeyPair = {
    chain: 'solana',
    derivationPath: DERIVATION_PATHS.SOLANA,
    publicKey: bytesToHex(solanaKey.publicKey),
    address: solanaKey.address,
    privateKey: bytesToHex(solanaKey.privateKey),
  };

  return {
    mnemonic,
    shares,
    evmKeyPair,
    solanaKeyPair,
  };
}

/**
 * Derive an additional EVM key from any 2 shares at a custom BIP-44 index.
 * Used by multi-account flows: index 0 is the default account, 1, 2, 3… are
 * the user's "Account 2", "Account 3", etc. — same seed, different paths.
 */
export async function deriveAdditionalEvmKey(
  share1: KeyShare,
  share2: KeyShare,
  index: number
): Promise<DerivedKeyPair> {
  const shamirShares: ShamirShare[] = [
    { index: share1.index, data: hexToBytes(share1.data) },
    { index: share2.index, data: hexToBytes(share2.data) },
  ];
  const seed = combineShares(shamirShares);
  const path = `m/44'/60'/0'/0/${index}`;
  const key = deriveEvmKey(seed, path);
  return {
    chain: 'evm',
    derivationPath: path,
    publicKey: bytesToHex(key.publicKey),
    address: key.address,
    privateKey: bytesToHex(key.privateKey),
  };
}

/**
 * Derive an additional Solana key at a custom index.
 * Solana's standard derivation is m/44'/501'/N'/0' — varying the account
 * (N) gives independent keypairs from the same seed.
 */
export async function deriveAdditionalSolanaKey(
  share1: KeyShare,
  share2: KeyShare,
  index: number
): Promise<DerivedKeyPair> {
  const shamirShares: ShamirShare[] = [
    { index: share1.index, data: hexToBytes(share1.data) },
    { index: share2.index, data: hexToBytes(share2.data) },
  ];
  const seed = combineShares(shamirShares);
  const path = `m/44'/501'/${index}'/0'`;
  const key = deriveSolanaKey(seed, path);
  return {
    chain: 'solana',
    derivationPath: path,
    publicKey: bytesToHex(key.publicKey),
    address: key.address,
    privateKey: bytesToHex(key.privateKey),
  };
}

/**
 * Reconstruct wallet from any 2 shares
 * Returns derived EVM and Solana key pairs
 */
export async function reconstructWallet(
  share1: KeyShare,
  share2: KeyShare
): Promise<KeyReconstructionResult> {
  // Convert shares back to Shamir format
  const shamirShares: ShamirShare[] = [
    { index: share1.index, data: hexToBytes(share1.data) },
    { index: share2.index, data: hexToBytes(share2.data) },
  ];

  // Reconstruct the seed
  const seed = combineShares(shamirShares);

  // Derive key pairs
  const evmKey = deriveEvmKey(seed);
  const solanaKey = deriveSolanaKey(seed);

  return {
    evmKeyPair: {
      chain: 'evm',
      derivationPath: DERIVATION_PATHS.EVM,
      publicKey: bytesToHex(evmKey.publicKey),
      address: evmKey.address,
      privateKey: bytesToHex(evmKey.privateKey),
    },
    solanaKeyPair: {
      chain: 'solana',
      derivationPath: DERIVATION_PATHS.SOLANA,
      publicKey: bytesToHex(solanaKey.publicKey),
      address: solanaKey.address,
      privateKey: bytesToHex(solanaKey.privateKey),
    },
  };
}

/**
 * Store the device share in local IndexedDB
 */
export async function storeDeviceShareLocally(
  share: KeyShare,
  deviceName: string = 'default'
): Promise<void> {
  const shareData = hexToBytes(share.data);

  // Prepend the share index so we can reconstruct the ShamirShare later
  const withIndex = new Uint8Array(shareData.length + 1);
  withIndex[0] = share.index;
  withIndex.set(shareData, 1);

  await storeDeviceShare(withIndex, {
    deviceId: await getDeviceFingerprint(),
    deviceName,
    storedAt: Date.now(),
    lastUsedAt: Date.now(),
  });
}

/**
 * Retrieve the device share from local storage
 */
export async function getLocalDeviceShare(): Promise<KeyShare | null> {
  const data = await getDeviceShare();
  if (!data) return null;

  const index = data[0];
  const shareData = data.slice(1);

  return {
    index,
    type: 'device',
    data: bytesToHex(shareData),
    createdAt: 0, // Unknown, stored separately in metadata
  };
}

/**
 * Check if device has a stored share
 */
export { hasDeviceShare } from './storage/device-share.js';

/**
 * Remove local device share (logout/wipe)
 */
export { removeDeviceShare } from './storage/device-share.js';

/**
 * Generate a simple device fingerprint
 */
async function getDeviceFingerprint(): Promise<string> {
  if (typeof navigator === 'undefined') return 'server';

  const data = [
    navigator.userAgent,
    navigator.language,
    new Date().getTimezoneOffset().toString(),
    screen?.width?.toString() || '',
    screen?.height?.toString() || '',
  ].join('|');

  // Hash it
  const encoder = new TextEncoder();
  const hash = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  const bytes = new Uint8Array(hash);
  return Array.from(bytes.slice(0, 8))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
