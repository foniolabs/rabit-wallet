/**
 * useFeeEstimate — get a friendly fee estimate (native units + optional USD)
 * to feed into <TransactionPreview /> via its `fee` prop.
 *
 * Two specialized hooks:
 *   useEvmFeeEstimate — estimates gas × gasPrice for an EVM call.
 *   useSolanaFeeEstimate — Solana txs have a flat-ish base fee per signature.
 */

import { useCallback, useState } from 'react';
import { estimateEvmFee, formatUnits, formatEther, type Abi } from '@rabit/evm';
import type { ChainId } from '@rabit/types';
import { useRabitContext } from '../provider.js';
import type { FeeEstimate } from '../components/TransactionPreview.js';

export interface UseFeeEstimateReturn {
  fee: FeeEstimate | null;
  isLoading: boolean;
  error: Error | null;
  estimate: (args: EvmEstimateArgs) => Promise<FeeEstimate | null>;
  reset: () => void;
}

export interface EvmEstimateArgs {
  chainId?: ChainId;
  to: `0x${string}`;
  /** Optional ABI + functionName + args to estimate a contract call. */
  abi?: Abi;
  functionName?: string;
  callArgs?: readonly unknown[];
  value?: bigint;
}

const NATIVE_PRICE_CACHE: Record<string, { price: number; expiry: number }> = {};

async function fetchNativePrice(symbol: string): Promise<number | null> {
  const key = symbol.toUpperCase();
  const cached = NATIVE_PRICE_CACHE[key];
  if (cached && cached.expiry > Date.now()) return cached.price;
  const idMap: Record<string, string> = {
    ETH: 'ethereum',
    POL: 'matic-network',
    MATIC: 'matic-network',
    BNB: 'binancecoin',
    SOL: 'solana',
  };
  const id = idMap[key];
  if (!id) return null;
  try {
    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`);
    const json = await res.json();
    const price = json[id]?.usd;
    if (typeof price !== 'number') return null;
    NATIVE_PRICE_CACHE[key] = { price, expiry: Date.now() + 60_000 };
    return price;
  } catch {
    return null;
  }
}

export function useEvmFeeEstimate(): UseFeeEstimateReturn {
  const { core, wallet } = useRabitContext();
  const [fee, setFee] = useState<FeeEstimate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const estimate = useCallback(
    async (args: EvmEstimateArgs): Promise<FeeEstimate | null> => {
      setIsLoading(true);
      setError(null);
      try {
        const chainId = args.chainId ?? wallet.activeChainId;
        if (!chainId) return null;
        const chain = core.getEvmChain(chainId);
        if (!chain) return null;
        const fromAddress = core.evmAddress as `0x${string}` | null;
        if (!fromAddress) return null;

        const { totalWei, gas, gasPrice } = await estimateEvmFee({
          chainId,
          from: fromAddress,
          to: args.to,
          value: args.value,
          abi: args.abi,
          functionName: args.functionName,
          callArgs: args.callArgs,
          rpcUrl: chain.rpcUrls.default[0]?.url,
        });

        const native = `${formatEther(totalWei)} ${chain.nativeCurrency.symbol}`;
        const detail = `${gas.toLocaleString()} × ${formatUnits(gasPrice, 9)} gwei`;

        let fiat: string | undefined;
        const price = await fetchNativePrice(chain.nativeCurrency.symbol);
        if (price) {
          const usd = parseFloat(formatEther(totalWei)) * price;
          fiat = `≈ $${usd.toFixed(usd < 0.01 ? 4 : 2)}`;
        }

        const result: FeeEstimate = { native, fiat, detail };
        setFee(result);
        return result;
      } catch (e) {
        setError(e instanceof Error ? e : new Error('Fee estimate failed'));
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [core, wallet]
  );

  const reset = useCallback(() => {
    setFee(null);
    setError(null);
  }, []);

  return { fee, isLoading, error, estimate, reset };
}

export function useSolanaFeeEstimate(): {
  fee: FeeEstimate | null;
  estimate: () => Promise<FeeEstimate | null>;
  reset: () => void;
} {
  const [fee, setFee] = useState<FeeEstimate | null>(null);

  const estimate = useCallback(async (): Promise<FeeEstimate | null> => {
    // Solana base fee per signature is 5000 lamports. We assume one signature;
    // for multi-sig you'd multiply.
    const lamports = 5000;
    const sol = lamports / 1_000_000_000;
    const native = `~${sol.toFixed(6)} SOL`;
    let fiat: string | undefined;
    const price = await fetchNativePrice('SOL');
    if (price) {
      const usd = sol * price;
      fiat = `≈ $${usd.toFixed(usd < 0.01 ? 4 : 2)}`;
    }
    const result: FeeEstimate = { native, fiat, detail: '5,000 lamports / signature' };
    setFee(result);
    return result;
  }, []);

  const reset = useCallback(() => setFee(null), []);

  return { fee, estimate, reset };
}
