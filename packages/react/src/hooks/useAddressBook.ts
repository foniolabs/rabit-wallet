/**
 * useAddressBook — saved recipients per user, persisted to localStorage.
 *
 * Auto-records every recipient the user successfully sends to (recently used),
 * and lets them save a friendly alias for any address.
 *
 * Storage key is namespaced per logged-in user so switching accounts shows the
 * right book.
 */

import { useCallback, useEffect, useState } from 'react';
import { useRabitContext } from '../provider.js';

export interface AddressBookEntry {
  address: string;
  /** Friendly name. */
  label: string;
  ecosystem: 'evm' | 'solana';
  /** Last-used timestamp (ms). 0 if never used. */
  lastUsedAt: number;
  /** True if the user explicitly saved this entry (vs auto-recorded). */
  pinned: boolean;
}

const STORAGE_KEY_PREFIX = 'rabit:addressbook:';

function keyFor(userId: string | null | undefined) {
  return `${STORAGE_KEY_PREFIX}${userId ?? 'anon'}`;
}

function load(userId: string | null | undefined): AddressBookEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(keyFor(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(userId: string | null | undefined, entries: AddressBookEntry[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(keyFor(userId), JSON.stringify(entries));
  } catch {/* quota */}
}

export interface UseAddressBookReturn {
  entries: AddressBookEntry[];
  /** Save / update a friendly label for an address. */
  upsert: (entry: Omit<AddressBookEntry, 'lastUsedAt' | 'pinned'> & { pinned?: boolean }) => void;
  /** Mark an address as recently used. Auto-creates an entry if absent. */
  touch: (args: { address: string; ecosystem: 'evm' | 'solana' }) => void;
  remove: (address: string) => void;
  /** Lookup a label for an address (case-insensitive for EVM). */
  labelFor: (address: string) => string | null;
}

export function useAddressBook(): UseAddressBookReturn {
  const { auth } = useRabitContext();
  const userId = auth.user?.id;
  const [entries, setEntries] = useState<AddressBookEntry[]>(() => load(userId));

  // Reload when the active user changes.
  useEffect(() => {
    setEntries(load(userId));
  }, [userId]);

  // Sync across tabs.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === keyFor(userId)) setEntries(load(userId));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [userId]);

  const upsert = useCallback<UseAddressBookReturn['upsert']>(
    (entry) => {
      const next = [...entries];
      const idx = next.findIndex((e) => sameAddr(e.address, entry.address));
      if (idx >= 0) {
        next[idx] = { ...next[idx], ...entry, pinned: entry.pinned ?? next[idx].pinned ?? true };
      } else {
        next.push({
          ...entry,
          pinned: entry.pinned ?? true,
          lastUsedAt: 0,
        });
      }
      setEntries(next);
      save(userId, next);
    },
    [entries, userId]
  );

  const touch = useCallback<UseAddressBookReturn['touch']>(
    ({ address, ecosystem }) => {
      const next = [...entries];
      const idx = next.findIndex((e) => sameAddr(e.address, address));
      const now = Date.now();
      if (idx >= 0) {
        next[idx] = { ...next[idx], lastUsedAt: now };
      } else {
        next.push({
          address,
          ecosystem,
          label: '',
          lastUsedAt: now,
          pinned: false,
        });
      }
      setEntries(next);
      save(userId, next);
    },
    [entries, userId]
  );

  const remove = useCallback<UseAddressBookReturn['remove']>(
    (address) => {
      const next = entries.filter((e) => !sameAddr(e.address, address));
      setEntries(next);
      save(userId, next);
    },
    [entries, userId]
  );

  const labelFor = useCallback<UseAddressBookReturn['labelFor']>(
    (address) => entries.find((e) => sameAddr(e.address, address))?.label || null,
    [entries]
  );

  return { entries, upsert, touch, remove, labelFor };
}

function sameAddr(a: string, b: string): boolean {
  // EVM addresses compare case-insensitive; Solana base58 is case-sensitive.
  if (a.startsWith('0x') && b.startsWith('0x')) {
    return a.toLowerCase() === b.toLowerCase();
  }
  return a === b;
}
