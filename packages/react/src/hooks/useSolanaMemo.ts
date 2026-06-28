/**
 * useSolanaMemo — small wrapper around the Solana Memo program.
 * Demonstrates a signed program call with no deployment required.
 */

import { useCallback, useEffect, useState } from 'react';
import { sendSolanaMemo, getRecentSolanaMemos, type MemoEntry } from '@rabit/solana';
import { useRabitContext } from '../provider.js';

export interface UseSolanaMemoReturn {
  memos: MemoEntry[];
  isLoadingMemos: boolean;
  isSending: boolean;
  error: Error | null;
  send: (message: string) => Promise<{ signature: string; explorerUrl?: string }>;
  refresh: () => Promise<void>;
}

export function useSolanaMemo(): UseSolanaMemoReturn {
  const { core, wallet } = useRabitContext();
  const [memos, setMemos] = useState<MemoEntry[]>([]);
  const [isLoadingMemos, setIsLoadingMemos] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const slug = wallet.activeSolanaChainSlug;
  const owner = core.solanaAddress;

  const refresh = useCallback(async () => {
    if (!slug || !owner) return;
    const chain = core.getSolanaChain(slug);
    if (!chain) return;
    setIsLoadingMemos(true);
    setError(null);
    try {
      const list = await getRecentSolanaMemos({ owner, rpcUrl: chain.rpcUrl, limit: 10 });
      setMemos(list);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to load memos'));
    } finally {
      setIsLoadingMemos(false);
    }
  }, [core, slug, owner]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const send = useCallback(
    async (message: string) => {
      if (!slug) throw new Error('No active Solana chain');
      const chain = core.getSolanaChain(slug);
      if (!chain) throw new Error(`Solana chain ${slug} not registered`);
      const pk = core.getSolanaPrivateKey();
      if (!pk) throw new Error('Wallet not unlocked');

      setIsSending(true);
      setError(null);
      try {
        const signature = await sendSolanaMemo({
          privateKeyHex: pk,
          rpcUrl: chain.rpcUrl,
          message,
        });
        const cluster = chain.cluster;
        const explorerUrl =
          cluster === 'mainnet-beta'
            ? `https://solscan.io/tx/${signature}`
            : `https://solscan.io/tx/${signature}?cluster=${cluster}`;
        // Refresh list in the background.
        refresh();
        return { signature, explorerUrl };
      } catch (e) {
        const err = e instanceof Error ? e : new Error('Memo send failed');
        setError(err);
        throw err;
      } finally {
        setIsSending(false);
      }
    },
    [core, slug, refresh]
  );

  return { memos, isLoadingMemos, isSending, error, send, refresh };
}
