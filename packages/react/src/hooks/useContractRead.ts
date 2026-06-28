/**
 * useContractRead — call a read-only EVM contract function and watch the result.
 */

import { useCallback, useEffect, useState } from 'react';
import { readEvmContract, type Abi } from '@rabit/evm';
import type { ChainId } from '@rabit/types';
import { useRabitContext } from '../provider.js';

export interface UseContractReadArgs {
  /** Defaults to the active EVM chain. */
  chainId?: ChainId;
  address: `0x${string}`;
  abi: Abi;
  functionName: string;
  args?: readonly unknown[];
  /** Auto-fetch on mount and when args change. Default true. */
  enabled?: boolean;
}

export interface UseContractReadReturn<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useContractRead<T = unknown>(
  opts: UseContractReadArgs
): UseContractReadReturn<T> {
  const { core, wallet } = useRabitContext();
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const chainId = opts.chainId ?? wallet.activeChainId ?? undefined;
  const enabled = opts.enabled ?? true;

  const refresh = useCallback(async () => {
    if (!chainId) return;
    setIsLoading(true);
    setError(null);
    try {
      const chain = core.getEvmChain(chainId);
      const result = await readEvmContract<T>({
        chainId,
        address: opts.address,
        abi: opts.abi,
        functionName: opts.functionName,
        args: opts.args,
        rpcUrl: chain?.rpcUrls.default[0]?.url,
      });
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Read failed'));
    } finally {
      setIsLoading(false);
    }
  }, [
    chainId,
    opts.address,
    opts.abi,
    opts.functionName,
    JSON.stringify(opts.args ?? []),
    core,
  ]);

  useEffect(() => {
    if (enabled) refresh();
  }, [enabled, refresh]);

  return { data, isLoading, error, refresh };
}
