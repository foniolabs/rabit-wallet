/**
 * PIN-encrypted device share storage.
 *
 * The user's device share is encrypted with PBKDF2(pin)→AES-256-GCM and kept
 * in IndexedDB. Without the PIN nothing in the vault is usable, even with
 * full filesystem access.
 *
 * Has rate-limit protection: after `MAX_ATTEMPTS` wrong PIN attempts the
 * vault is wiped, forcing recovery via the recovery share.
 */

import {
  encryptWithPassword,
  decryptWithPassword,
  type PasswordEncryptedData,
} from '../encryption/aes.js';
import { bytesToHex, hexToBytes } from '../utils/encoding.js';

const DB_NAME = 'rabit-wallet';
const STORE_NAME = 'key-shares';
const VAULT_KEY = 'pin-vault';
const ATTEMPTS_KEY = 'pin-attempts';
const MAX_ATTEMPTS = 5;

interface VaultRecord {
  // Encrypted device share, indexed-prefixed (1 byte index || share bytes)
  encrypted: PasswordEncryptedData;
  /** When the vault was created. */
  createdAt: number;
  /** When the vault was last unlocked. */
  lastUnlockedAt?: number;
}

export interface PinVaultStatus {
  exists: boolean;
  attempts: number;
  remaining: number;
}

/**
 * Encrypt + store the device share, indexed-prefixed, behind a PIN.
 */
export async function storePinVault(shareIndex: number, shareBytes: Uint8Array, pin: string): Promise<void> {
  // Prepend index byte so we can rebuild the typed share later.
  const indexed = new Uint8Array(shareBytes.length + 1);
  indexed[0] = shareIndex;
  indexed.set(shareBytes, 1);

  const encrypted = await encryptWithPassword(indexed, pin);

  const record: VaultRecord = {
    encrypted,
    createdAt: Date.now(),
  };

  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  await idbPut(store, VAULT_KEY, record);
  await idbPut(store, ATTEMPTS_KEY, 0);
  db.close();
}

/**
 * Read + decrypt the vault. Returns `{ index, data }` on success.
 * Throws on wrong PIN. Wipes the vault after `MAX_ATTEMPTS` consecutive failures.
 */
export async function unlockPinVault(pin: string): Promise<{ index: number; dataHex: string }> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  const record = (await idbGet(store, VAULT_KEY)) as VaultRecord | undefined;
  if (!record) {
    db.close();
    throw new PinVaultError('No PIN vault found', 'no_vault');
  }

  let decrypted: Uint8Array;
  try {
    decrypted = await decryptWithPassword(record.encrypted, pin);
  } catch {
    const attempts = ((await idbGet(store, ATTEMPTS_KEY)) as number | undefined) ?? 0;
    const next = attempts + 1;

    if (next >= MAX_ATTEMPTS) {
      await idbDelete(store, VAULT_KEY);
      await idbDelete(store, ATTEMPTS_KEY);
      db.close();
      throw new PinVaultError(
        'Too many wrong attempts. Vault wiped — restore using your recovery key.',
        'vault_wiped'
      );
    }

    await idbPut(store, ATTEMPTS_KEY, next);
    db.close();
    throw new PinVaultError(
      `Wrong PIN. ${MAX_ATTEMPTS - next} attempt${MAX_ATTEMPTS - next === 1 ? '' : 's'} left.`,
      'wrong_pin'
    );
  }

  // Success — reset counter, stamp lastUnlockedAt
  record.lastUnlockedAt = Date.now();
  await idbPut(store, VAULT_KEY, record);
  await idbPut(store, ATTEMPTS_KEY, 0);
  db.close();

  const index = decrypted[0];
  const dataHex = bytesToHex(decrypted.slice(1));
  return { index, dataHex };
}

export async function hasPinVault(): Promise<boolean> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const r = await idbGet(store, VAULT_KEY);
    db.close();
    return r !== undefined;
  } catch {
    return false;
  }
}

export async function clearPinVault(): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  await idbDelete(store, VAULT_KEY);
  await idbDelete(store, ATTEMPTS_KEY);
  db.close();
}

export async function getPinVaultStatus(): Promise<PinVaultStatus> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const exists = (await idbGet(store, VAULT_KEY)) !== undefined;
    const attempts = ((await idbGet(store, ATTEMPTS_KEY)) as number | undefined) ?? 0;
    db.close();
    return { exists, attempts, remaining: Math.max(0, MAX_ATTEMPTS - attempts) };
  } catch {
    return { exists: false, attempts: 0, remaining: MAX_ATTEMPTS };
  }
}

export class PinVaultError extends Error {
  constructor(
    message: string,
    public readonly kind: 'no_vault' | 'wrong_pin' | 'vault_wiped'
  ) {
    super(message);
    this.name = 'PinVaultError';
  }
}

// ---------- IndexedDB plumbing (same DB as device-share.ts) ----------

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function idbPut(store: IDBObjectStore, key: string, value: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    const r = store.put(value, key);
    r.onsuccess = () => resolve();
    r.onerror = () => reject(r.error);
  });
}

function idbGet(store: IDBObjectStore, key: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const r = store.get(key);
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

function idbDelete(store: IDBObjectStore, key: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const r = store.delete(key);
    r.onsuccess = () => resolve();
    r.onerror = () => reject(r.error);
  });
}
