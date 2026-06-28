/**
 * Key management types for Rabit split-key architecture
 */

/**
 * Types of key shares in the 2-of-3 Shamir scheme
 */
export type ShareType = 'device' | 'auth' | 'recovery';

/**
 * A single Shamir share
 */
export interface KeyShare {
  /** Share index (1, 2, or 3) */
  index: number;
  /** Share type */
  type: ShareType;
  /** The share data (hex-encoded) */
  data: string;
  /** Creation timestamp */
  createdAt: number;
}

/**
 * Encrypted key share for storage
 */
export interface EncryptedKeyShare {
  /** Share type */
  type: ShareType;
  /** AES-256-GCM encrypted share data */
  ciphertext: string;
  /** Initialization vector */
  iv: string;
  /** Auth tag */
  tag: string;
  /** Salt used for key derivation (if password-encrypted) */
  salt?: string;
  /** Creation timestamp */
  createdAt: number;
}

/**
 * Master key material (never stored directly)
 */
export interface MasterKeyMaterial {
  /** Raw seed bytes (hex) */
  seed: string;
  /** BIP-39 mnemonic (only shown to user once during backup) */
  mnemonic: string;
}

/**
 * Derived key pair for a specific chain
 */
export interface DerivedKeyPair {
  /** Chain ecosystem */
  chain: 'evm' | 'solana';
  /** BIP-44 derivation path */
  derivationPath: string;
  /** Public key (hex) */
  publicKey: string;
  /** Address on the target chain */
  address: string;
  /** Private key (hex) — held in memory only, never stored */
  privateKey: string;
}

/**
 * Key generation result after auth
 */
export interface KeyGenerationResult {
  /** The 3 shares */
  shares: KeyShare[];
  /** Derived EVM key pair */
  evmKeyPair: DerivedKeyPair;
  /** Derived Solana key pair */
  solanaKeyPair: DerivedKeyPair;
}

/**
 * Key reconstruction input (any 2 of 3 shares)
 */
export interface KeyReconstructionInput {
  shares: [KeyShare, KeyShare];
}

/**
 * Key reconstruction result
 */
export interface KeyReconstructionResult {
  /** Derived EVM key pair */
  evmKeyPair: DerivedKeyPair;
  /** Derived Solana key pair */
  solanaKeyPair: DerivedKeyPair;
}

/**
 * Device share storage metadata
 */
export interface DeviceShareMetadata {
  /** Device identifier (fingerprint) */
  deviceId: string;
  /** Device name/label */
  deviceName: string;
  /** When the share was stored on this device */
  storedAt: number;
  /** Last used timestamp */
  lastUsedAt: number;
}

/**
 * Recovery share options
 */
export interface RecoveryOptions {
  /** Recovery method */
  method: 'manual_backup' | 'social_recovery' | 'security_questions';
  /** For social recovery: guardian email addresses */
  guardianEmails?: string[];
  /** For social recovery: threshold needed */
  guardianThreshold?: number;
}
