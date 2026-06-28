/**
 * useActivity — unified activity feed.
 *
 *  • Records every transaction the SDK sends through it (sends, swaps, contract
 *    writes, memos) to localStorage with a friendly label.
 *  • For Solana, also pulls on-chain history from `getSignaturesForAddress`
 *    so prior activity (or activity from other wallets/devices on the same
 *    address) shows up.
 *
 * No external API keys. EVM history isn't pulled from explorers in this
 * baseline — devs can layer Zerion/SimpleHash on top via the same UI hook
 * by composing extra entries into the returned list.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getRecentSolanaMemos } from '@rabit/solana';
import { useRabitContext } from '../provider.js';

export type ActivityKind =
  | 'send_native'
  | 'send_token'
  | 'approve'
  | 'swap'
  | 'memo'
  | 'contract_call'
  | 'sign_message'
  | 'on_chain';

export interface ActivityEntry {
  /** Stable id — for SDK-recorded entries, the tx hash. */
  id: string;
  ecosystem: 'evm' | 'solana';
  /** Raw chain id (EVM) or cluster name (Solana). */
  chain: string;
  kind: ActivityKind;
  /** One-line plain-English description. */
  title: string;
  /** Optional subtitle, e.g. "1.5 USDC → 0xabc…". */
  subtitle?: string;
  /** Tx hash / signature. */
  hash?: string;
  /** Block-explorer URL. */
  explorerUrl?: string;
  /** Account that triggered this. */
  address: string;
  /** ms since epoch. */
  timestamp: number;
  /** Status: pending / confirmed / failed. */
  status: 'pending' | 'confirmed' | 'failed';
}

const STORAGE_KEY_PREFIX = 'rabit:activity:';

function keyFor(userId: string | null | undefined) {
  return `${STORAGE_KEY_PREFIX}${userId ?? 'anon'}`;
}

function loadLocal(userId: string | null | undefined): ActivityEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(keyFor(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocal(userId: string | null | undefined, list: ActivityEntry[]) {
  if (typeof window === 'undefined') return;
  try {
    // Keep only the last 200 entries — plenty for UI, bounded.
    const trimmed = list.slice(0, 200);
    window.localStorage.setItem(keyFor(userId), JSON.stringify(trimmed));
  } catch {/* quota */}
}

export interface UseActivityReturn {
  entries: ActivityEntry[];
  isLoading: boolean;
  /** Refresh on-chain entries for the active Solana account. */
  refresh: () => Promise<void>;
  /** Append an entry (used internally + by hooks like useSendToken). */
  record: (entry: Omit<ActivityEntry, 'id'> & { id?: string }) => void;
  /** Clear all locally-stored activity for the current user. */
  clear: () => void;
}

export function useActivity(): UseActivityReturn {
  const { core, auth, wallet } = useRabitContext();
  const userId = auth.user?.id ?? null;
  const [local, setLocal] = useState<ActivityEntry[]>(() => loadLocal(userId));
  const [solanaOnChain, setSolanaOnChain] = useState<ActivityEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Reload local when user changes.
  useEffect(() => {
    setLocal(loadLocal(userId));
  }, [userId]);

  // Cross-tab sync.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === keyFor(userId)) setLocal(loadLocal(userId));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [userId]);

  const refresh = useCallback(async () => {
    const owner = core.solanaAddress;
    const slug = wallet.activeSolanaChainSlug;
    if (!owner || !slug) {
      setSolanaOnChain([]);
      return;
    }
    const chain = core.getSolanaChain(slug);
    if (!chain) return;

    setIsLoading(true);
    try {
      const entries = await getRecentSolanaMemos({
        owner,
        rpcUrl: chain.rpcUrl,
        limit: 20,
      });
      const cluster = chain.cluster;
      const explorerBase =
        cluster === 'mainnet-beta'
          ? 'https://solscan.io/tx/'
          : `https://solscan.io/tx/`;
      const clusterQ = cluster === 'mainnet-beta' ? '' : `?cluster=${cluster}`;
      setSolanaOnChain(
        entries.map<ActivityEntry>((e) => ({
          id: e.signature,
          ecosystem: 'solana',
          chain: cluster,
          kind: e.memo ? 'memo' : 'on_chain',
          title: e.memo ? `Memo: ${e.memo}` : 'On-chain transaction',
          subtitle: undefined,
          hash: e.signature,
          explorerUrl: `${explorerBase}${e.signature}${clusterQ}`,
          address: owner,
          timestamp: e.blockTime ? e.blockTime * 1000 : Date.now(),
          status: 'confirmed',
        }))
      );
    } catch {
      setSolanaOnChain([]);
    } finally {
      setIsLoading(false);
    }
  }, [core, wallet.activeSolanaChainSlug]);

  // Auto-refresh when active Solana cluster/address changes.
  useEffect(() => {
    refresh();
  }, [refresh]);

  const record = useCallback<UseActivityReturn['record']>(
    (entry) => {
      const id = entry.id ?? entry.hash ?? `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const next = [{ ...entry, id }, ...local].slice(0, 200);
      setLocal(next);
      saveLocal(userId, next);
    },
    [local, userId]
  );

  const clear = useCallback(() => {
    setLocal([]);
    saveLocal(userId, []);
  }, [userId]);

  // Merge + dedupe by hash, sort newest-first.
  const entries = useMemo(() => {
    const merged = new Map<string, ActivityEntry>();
    for (const e of [...solanaOnChain, ...local]) {
      const key = e.hash ?? e.id;
      // Local entries win — they have the friendlier titles we set on record().
      const existing = merged.get(key);
      if (!existing || e.title !== 'On-chain transaction') {
        merged.set(key, e);
      }
    }
    return Array.from(merged.values()).sort((a, b) => b.timestamp - a.timestamp);
  }, [local, solanaOnChain]);

  return { entries, isLoading, refresh, record, clear };
}
