/**
 * Device share storage
 * Securely stores the device key share in browser storage (IndexedDB)
 * with AES-256-GCM encryption
 */

import type { EncryptedKeyShare, DeviceShareMetadata } from '@rabit/types';
import { encrypt, decrypt } from '../encryption/aes.js';
import { getSecureRandom } from '../utils/random.js';

const DB_NAME = 'rabit-wallet';
const STORE_NAME = 'key-shares';
const DEVICE_SHARE_KEY = 'device-share';
const ENCRYPTION_KEY_STORE = 'encryption-key';

/**
 * Store the device share encrypted in IndexedDB
 */
export async function storeDeviceShare(
  shareData: Uint8Array,
  metadata: DeviceShareMetadata
): Promise<void> {
  // Get or create the device encryption key
  const encKey = await getOrCreateDeviceEncryptionKey();

  // Encrypt the share
  const encrypted = await encrypt(shareData, encKey);

  const record: EncryptedKeyShare = {
    type: 'device',
    ciphertext: encrypted.ciphertext,
    iv: encrypted.iv,
    tag: '', // GCM tag is included in ciphertext by Web Crypto
    createdAt: Date.now(),
  };

  // Store in IndexedDB
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  await idbPut(store, DEVICE_SHARE_KEY, { share: record, metadata });

  db.close();
}

/**
 * Retrieve and decrypt the device share
 */
export async function getDeviceShare(): Promise<Uint8Array | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);

    const record = await idbGet(store, DEVICE_SHARE_KEY);
    db.close();

    if (!record) return null;

    const encKey = await getOrCreateDeviceEncryptionKey();
    const decrypted = await decrypt(
      { ciphertext: record.share.ciphertext, iv: record.share.iv },
      encKey
    );

    return decrypted;
  } catch {
    return null;
  }
}

/**
 * Check if a device share exists
 */
export async function hasDeviceShare(): Promise<boolean> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const record = await idbGet(store, DEVICE_SHARE_KEY);
    db.close();
    return record !== undefined;
  } catch {
    return false;
  }
}

/**
 * Remove the device share
 */
export async function removeDeviceShare(): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  store.delete(DEVICE_SHARE_KEY);
  db.close();
}

// --- Device encryption key management ---
// The device encryption key is stored in IndexedDB and never leaves the device.
// It's a random 32-byte AES key generated once per device.

async function getOrCreateDeviceEncryptionKey(): Promise<Uint8Array> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  let key = await idbGet(store, ENCRYPTION_KEY_STORE);

  if (!key) {
    // Generate a new random encryption key
    const newKey = getSecureRandom(32);
    const keyHex = Array.from(newKey).map(b => b.toString(16).padStart(2, '0')).join('');
    await idbPut(store, ENCRYPTION_KEY_STORE, keyHex);
    db.close();
    return newKey;
  }

  db.close();

  // Convert hex string back to Uint8Array
  const bytes = new Uint8Array(key.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(key.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

// --- IndexedDB helpers ---

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
    const request = store.put(value, key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function idbGet(store: IDBObjectStore, key: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
