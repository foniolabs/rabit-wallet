/**
 * useSolanaChains — read and mutate the SDK's Solana chain registry.
 */

import { useCallback, useEffect, useState } from 'react';
import type { SolanaChain, SolanaCluster } from '@rabit/types';
import { useRabitContext } from '../provider.js';

export interface UseSolanaChainsReturn {
  /** All registered Solana chains. */
  chains: SolanaChain[];
  /** Currently active cluster, or null if no wallet yet. */
  activeCluster: SolanaCluster | null;
  /** Currently active chain slug (when multiple chains share a cluster). */
  activeSlug: string | null;
  /** The full active chain object, or null. */
  activeChain: SolanaChain | null;
  /** Switch to a registered Solana chain. Throws if not registered. */
  switchChain: (slugOrChain: string | SolanaChain) => void;
  /** Register a new Solana chain (idempotent). */
  addChain: (chain: SolanaChain) => void;
}

export function useSolanaChains(): UseSolanaChainsReturn {
  const { core, wallet } = useRabitContext();
  const [chains, setChains] = useState<SolanaChain[]>(() => core.getSolanaChains());

  useEffect(() => {
    setChains(core.getSolanaChains());
  }, [core, wallet]);

  const switchChain = useCallback(
    (slugOrChain: string | SolanaChain) => core.switchSolanaChain(slugOrChain),
    [core]
  );

  const addChain = useCallback(
    (chain: SolanaChain) => {
      core.addSolanaChain(chain);
      setChains(core.getSolanaChains());
    },
    [core]
  );

  const activeSlug = wallet.activeSolanaChainSlug ?? null;
  const activeCluster = wallet.activeSolanaCluster ?? null;
  const activeChain = activeSlug ? core.getSolanaChain(activeSlug) ?? null : null;

  return { chains, activeCluster, activeSlug, activeChain, switchChain, addChain };
}
