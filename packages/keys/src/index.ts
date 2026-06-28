/**
 * @rabit/keys — Split-key management for Rabit embedded wallet
 *
 * Handles the full key lifecycle:
 * - Wallet generation (mnemonic → seed → Shamir shares + derived keys)
 * - Key reconstruction (2-of-3 shares → seed → derived keys)
 * - Device share storage (encrypted IndexedDB)
 * - EVM + Solana key derivation from same seed
 * - AES-256-GCM encryption for share storage
 */

// Main key manager API
export {
  generateWallet,
  reconstructWallet,
  deriveAdditionalEvmKey,
  deriveAdditionalSolanaKey,
  storeDeviceShareLocally,
  getLocalDeviceShare,
  hasDeviceShare,
  removeDeviceShare,
} from './key-manager.js';

// Shamir secret sharing (lower-level)
export { splitSecret, combineShares } from './shamir/sharing.js';
export type { ShamirShare } from './shamir/sharing.js';

// Key derivation
export { generateMnemonic, mnemonicToSeed, isValidMnemonic } from './derivation/mnemonic.js';
export { deriveEvmKey, deriveSolanaKey, DERIVATION_PATHS } from './derivation/hd-key.js';

// Encryption
export {
  encrypt,
  decrypt,
  encryptWithPassword,
  decryptWithPassword,
  deriveKeyFromPassword,
} from './encryption/aes.js';

// Utilities
export { bytesToHex, hexToBytes } from './utils/encoding.js';
export { getSecureRandom } from './utils/random.js';

// Private-key export helpers
export {
  exportEvmPrivateKey,
  exportSolanaSecretKeyBase58,
  exportSolanaSecretKeyArray,
} from './export.js';

// PIN vault
export {
  storePinVault,
  unlockPinVault,
  hasPinVault,
  clearPinVault,
  getPinVaultStatus,
  PinVaultError,
} from './storage/pin-vault.js';
export type { PinVaultStatus } from './storage/pin-vault.js';
