/**
 * useChains — read and mutate the SDK's EVM chain registry.
 */

import { useCallback, useEffect, useState } from 'react';
import type { EvmChain, ChainId } from '@rabit/types';
import { useRabitContext } from '../provider.js';

export interface UseChainsReturn {
  /** All registered EVM chains. */
  chains: EvmChain[];
  /** Currently active chain ID, or null if no wallet yet. */
  activeChainId: ChainId | null;
  /** The full active chain object, or null. */
  activeChain: EvmChain | null;
  /** Switch to a registered chain. Throws if not registered. */
  switchChain: (chainId: ChainId) => void;
  /** Register a new chain (idempotent). */
  addChain: (chain: EvmChain) => void;
}

export function useChains(): UseChainsReturn {
  const { core, wallet } = useRabitContext();
  const [chains, setChains] = useState<EvmChain[]>(() => core.getEvmChains());

  // Re-pull chain list whenever the wallet state changes (addEvmChain re-emits).
  useEffect(() => {
    setChains(core.getEvmChains());
  }, [core, wallet]);

  const switchChain = useCallback(
    (chainId: ChainId) => core.switchChain(chainId),
    [core]
  );

  const addChain = useCallback(
    (chain: EvmChain) => {
      core.addEvmChain(chain);
      setChains(core.getEvmChains());
    },
    [core]
  );

  const activeChainId = wallet.activeChainId ?? null;
  const activeChain = activeChainId ? core.getEvmChain(activeChainId) ?? null : null;

  return { chains, activeChainId, activeChain, switchChain, addChain };
}
