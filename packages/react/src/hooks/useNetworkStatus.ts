/**
 * useNetworkStatus — current chain's block height + connection health.
 *
 * Polls the active chain's RPC every `pollIntervalMs` (default 12s on EVM,
 * matching ~1 block on most testnets, and 5s on Solana).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchEvmBlockNumber } from '@rabit/evm';
import { fetchSolanaSlot } from '@rabit/solana';
import { useRabitContext } from '../provider.js';

export interface NetworkStatus {
  ecosystem: 'evm' | 'solana';
  chainName: string;
  /** Latest block (EVM) or slot (Solana). */
  latestBlock: number | null;
  /** Block-explorer URL for the active chain (no path). */
  explorerUrl: string | null;
  /** A direct link to the user's account on the explorer. */
  accountExplorerUrl: string | null;
  isHealthy: boolean;
  lastUpdatedAt: number | null;
}

export interface UseNetworkStatusOptions {
  pollIntervalMs?: number;
}

export function useNetworkStatus(opts?: UseNetworkStatusOptions): NetworkStatus | null {
  const { core, wallet } = useRabitContext();
  const [status, setStatus] = useState<NetworkStatus | null>(null);
  const reqId = useRef(0);

  const refresh = useCallback(async () => {
    const id = ++reqId.current;
    const account = wallet.activeAccount;
    if (!account) return;

    if (account.ecosystem === 'evm' && wallet.activeChainId) {
      const chain = core.getEvmChain(wallet.activeChainId);
      if (!chain) return;
      const explorer = chain.blockExplorers?.default.url ?? null;
      try {
        const block = await fetchEvmBlockNumber({
          chainId: chain.id,
          rpcUrl: chain.rpcUrls.default[0]?.url,
        });
        if (reqId.current !== id) return;
        setStatus({
          ecosystem: 'evm',
          chainName: chain.name,
          latestBlock: Number(block),
          explorerUrl: explorer,
          accountExplorerUrl: explorer ? `${explorer}/address/${account.address}` : null,
          isHealthy: true,
          lastUpdatedAt: Date.now(),
        });
      } catch {
        if (reqId.current !== id) return;
        setStatus((s) => (s ? { ...s, isHealthy: false } : null));
      }
      return;
    }

    if (account.ecosystem === 'solana' && wallet.activeSolanaChainSlug) {
      const chain = core.getSolanaChain(wallet.activeSolanaChainSlug);
      if (!chain) return;
      const explorer = chain.blockExplorer?.url ?? null;
      const cluster = chain.cluster;
      const accountQuery =
        cluster === 'mainnet-beta'
          ? `https://solscan.io/account/${account.address}`
          : `https://solscan.io/account/${account.address}?cluster=${cluster}`;
      try {
        const slot = await fetchSolanaSlot(chain.rpcUrl);
        if (reqId.current !== id) return;
        setStatus({
          ecosystem: 'solana',
          chainName: chain.name,
          latestBlock: slot,
          explorerUrl: explorer,
          accountExplorerUrl: accountQuery,
          isHealthy: true,
          lastUpdatedAt: Date.now(),
        });
      } catch {
        if (reqId.current !== id) return;
        setStatus((s) => (s ? { ...s, isHealthy: false } : null));
      }
    }
  }, [core, wallet]);

  useEffect(() => {
    refresh();
    const interval = opts?.pollIntervalMs ?? (wallet.activeAccount?.ecosystem === 'solana' ? 5000 : 12000);
    const t = setInterval(refresh, interval);
    return () => clearInterval(t);
  }, [refresh, opts?.pollIntervalMs, wallet.activeAccount?.ecosystem]);

  return status;
}
