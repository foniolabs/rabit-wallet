/**
 * useCustomTokens — manage user-imported tokens, persisted to localStorage.
 *
 * Auto-fetches name/symbol/decimals from the contract when adding (EVM) or
 * the on-chain mint metadata (Solana). Tokens added here merge into the
 * built-in token list shown by useBalances.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { readEvmContract, ERC20_ABI, type EvmTokenDef } from '@rabit/evm';
import type { ChainId, SolanaCluster } from '@rabit/types';
import { fetchSplMintDecimals, type SolanaTokenDef } from '@rabit/solana';
import { useRabitContext } from '../provider.js';

const EVM_STORAGE_KEY = 'rabit:customTokens:evm';
const SOL_STORAGE_KEY = 'rabit:customTokens:solana';

interface PersistedEvmTokens {
  // chainId → tokens
  [chainId: number]: EvmTokenDef[];
}

interface PersistedSolanaTokens {
  // cluster → tokens
  [cluster: string]: SolanaTokenDef[];
}

function loadEvm(): PersistedEvmTokens {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(EVM_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveEvm(data: PersistedEvmTokens) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(EVM_STORAGE_KEY, JSON.stringify(data));
  } catch {/* quota */}
}

function loadSol(): PersistedSolanaTokens {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(SOL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveSol(data: PersistedSolanaTokens) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SOL_STORAGE_KEY, JSON.stringify(data));
  } catch {/* quota */}
}

export interface UseCustomTokensReturn {
  evmTokens: (chainId: ChainId) => EvmTokenDef[];
  solanaTokens: (cluster: SolanaCluster) => SolanaTokenDef[];
  importEvm: (args: {
    chainId: ChainId;
    address: `0x${string}`;
  }) => Promise<EvmTokenDef>;
  importSolana: (args: {
    cluster: SolanaCluster;
    mint: string;
    rpcUrl: string;
  }) => Promise<SolanaTokenDef>;
  remove: (args:
    | { ecosystem: 'evm'; chainId: ChainId; address: string }
    | { ecosystem: 'solana'; cluster: SolanaCluster; mint: string }
  ) => void;
}

export function useCustomTokens(): UseCustomTokensReturn {
  const { core } = useRabitContext();
  const [evm, setEvm] = useState<PersistedEvmTokens>(() => loadEvm());
  const [sol, setSol] = useState<PersistedSolanaTokens>(() => loadSol());

  // Sync across multiple useCustomTokens consumers in the same tab.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === EVM_STORAGE_KEY) setEvm(loadEvm());
      else if (e.key === SOL_STORAGE_KEY) setSol(loadSol());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const evmTokens = useCallback((chainId: ChainId) => evm[chainId] ?? [], [evm]);
  const solanaTokens = useCallback(
    (cluster: SolanaCluster) => sol[cluster] ?? [],
    [sol]
  );

  const importEvm = useCallback(
    async ({ chainId, address }: { chainId: ChainId; address: `0x${string}` }) => {
      const chain = core.getEvmChain(chainId);
      if (!chain) throw new Error(`Chain ${chainId} not registered`);
      const rpcUrl = chain.rpcUrls.default[0]?.url;

      const [symbol, name, decimals] = await Promise.all([
        readEvmContract<string>({ chainId, address, abi: ERC20_ABI, functionName: 'symbol', rpcUrl }),
        readEvmContract<string>({ chainId, address, abi: ERC20_ABI, functionName: 'name', rpcUrl }),
        readEvmContract<number>({ chainId, address, abi: ERC20_ABI, functionName: 'decimals', rpcUrl }),
      ]);

      const token: EvmTokenDef = { symbol, name, decimals: Number(decimals), address };
      const next = { ...evm };
      const list = (next[chainId] ?? []).filter(
        (t) => t.address?.toLowerCase() !== address.toLowerCase()
      );
      list.push(token);
      next[chainId] = list;
      setEvm(next);
      saveEvm(next);
      return token;
    },
    [evm, core]
  );

  const importSolana = useCallback(
    async ({ cluster, mint, rpcUrl }: { cluster: SolanaCluster; mint: string; rpcUrl: string }) => {
      const decimals = await fetchSplMintDecimals({ mint, rpcUrl });
      if (decimals == null) {
        throw new Error("Couldn't read mint info — is the mint address correct?");
      }
      const token: SolanaTokenDef = {
        symbol: mint.slice(0, 4),
        name: `Token ${mint.slice(0, 6)}…${mint.slice(-4)}`,
        decimals,
        mint,
      };
      const next = { ...sol };
      const list = (next[cluster] ?? []).filter((t) => t.mint !== mint);
      list.push(token);
      next[cluster] = list;
      setSol(next);
      saveSol(next);
      return token;
    },
    [sol]
  );

  const remove = useCallback(
    (args:
      | { ecosystem: 'evm'; chainId: ChainId; address: string }
      | { ecosystem: 'solana'; cluster: SolanaCluster; mint: string }
    ) => {
      if (args.ecosystem === 'evm') {
        const next = { ...evm };
        next[args.chainId] = (next[args.chainId] ?? []).filter(
          (t) => t.address?.toLowerCase() !== args.address.toLowerCase()
        );
        setEvm(next);
        saveEvm(next);
      } else {
        const next = { ...sol };
        next[args.cluster] = (next[args.cluster] ?? []).filter((t) => t.mint !== args.mint);
        setSol(next);
        saveSol(next);
      }
    },
    [evm, sol]
  );

  // Memoize the return so consumers can put this in dep arrays without
  // triggering an infinite render loop (the inner callbacks stay stable
  // until state actually changes).
  return useMemo(
    () => ({ evmTokens, solanaTokens, importEvm, importSolana, remove }),
    [evmTokens, solanaTokens, importEvm, importSolana, remove]
  );
}
