/**
 * useSwap — quote + execute swaps using LiFi (EVM) or Jupiter (Solana).
 *
 * Auto-routes by the active account's ecosystem.
 */

import { useCallback, useState } from 'react';
import {
  getLiFiQuote,
  executeLiFiQuote,
  formatLiFiAmount,
  LIFI_NATIVE_ADDRESS,
  parseUnits,
  type LiFiQuote,
  type EvmTokenDef,
} from '@rabit/evm';
import {
  getJupiterQuote,
  executeJupiterSwap,
  SOL_MINT,
  type JupiterQuote,
  type SolanaTokenDef,
} from '@rabit/solana';
import { useRabitContext } from '../provider.js';
import { useActivity } from './useActivity.js';

export interface SwapQuote {
  ecosystem: 'evm' | 'solana';
  /** Output amount, formatted human-readable. */
  toAmountFormatted: string;
  /** Min output after slippage, formatted. */
  toAmountMinFormatted: string;
  /** Aggregator/route name, e.g. "lifi", "jupiter:Whirlpool". */
  routeName: string;
  /** Optional gas/fee summary in USD if the aggregator returned it. */
  gasUsd?: string;
  /** Price impact, percentage as a number. */
  priceImpactPct?: number;
  /** Underlying raw quote — pass back to execute(). */
  raw: LiFiQuote | JupiterQuote;
}

export interface SwapTokenSpec {
  /** EVM contract address or Solana mint. Use null for native EVM coin. */
  address: string | null;
  decimals: number;
  symbol: string;
  /** EVM only: chainId of the token. */
  chainId?: number;
}

export interface UseSwapReturn {
  quote: SwapQuote | null;
  isQuoting: boolean;
  isSwapping: boolean;
  error: Error | null;
  /** Fetch a quote (does NOT submit a transaction). */
  getQuote: (args: {
    from: SwapTokenSpec;
    to: SwapTokenSpec;
    /** Human-readable amount, e.g. "1.5". */
    amount: string;
    /** Optional slippage in basis points (50 = 0.5%). */
    slippageBps?: number;
  }) => Promise<SwapQuote>;
  /** Execute the cached quote. */
  execute: () => Promise<{ hash: string; explorerUrl?: string }>;
  reset: () => void;
}

export function useSwap(): UseSwapReturn {
  const { core, wallet } = useRabitContext();
  const activity = useActivity();
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [isQuoting, setIsQuoting] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getQuote = useCallback<UseSwapReturn['getQuote']>(
    async ({ from, to, amount, slippageBps }) => {
      const ecosystem = wallet.activeAccount?.ecosystem;
      if (!ecosystem) throw new Error('No active account');
      setIsQuoting(true);
      setError(null);
      try {
        if (ecosystem === 'evm') {
          const fromChainId = from.chainId ?? wallet.activeChainId;
          const toChainId = to.chainId ?? wallet.activeChainId;
          if (!fromChainId || !toChainId) throw new Error('No active EVM chain');
          const fromAddress = (core.evmAddress ?? '0x') as `0x${string}`;
          const fromAmount = parseUnits(amount, from.decimals).toString();

          const lifi = await getLiFiQuote({
            fromChainId,
            toChainId,
            fromTokenAddress: (from.address ?? LIFI_NATIVE_ADDRESS) as `0x${string}`,
            toTokenAddress: (to.address ?? LIFI_NATIVE_ADDRESS) as `0x${string}`,
            fromAmount,
            fromAddress,
            slippage: slippageBps != null ? slippageBps / 10000 : undefined,
          });

          const next: SwapQuote = {
            ecosystem: 'evm',
            toAmountFormatted: formatLiFiAmount(lifi.toAmount, to.decimals),
            toAmountMinFormatted: formatLiFiAmount(lifi.toAmountMin, to.decimals),
            routeName: lifi.toolName,
            gasUsd: lifi.gasCostUSD,
            raw: lifi,
          };
          setQuote(next);
          return next;
        }

        // Solana → Jupiter
        if (!wallet.activeSolanaChainSlug) throw new Error('No active Solana chain');
        const inputMint = from.address ?? SOL_MINT;
        const outputMint = to.address ?? SOL_MINT;
        const amountRaw = BigInt(Math.round(parseFloat(amount) * Math.pow(10, from.decimals))).toString();
        const jup = await getJupiterQuote({
          inputMint,
          outputMint,
          amount: amountRaw,
          slippageBps: slippageBps ?? 50,
        });

        const fmtFromRaw = (raw: string) =>
          (Number(raw) / Math.pow(10, to.decimals)).toString();

        const next: SwapQuote = {
          ecosystem: 'solana',
          toAmountFormatted: fmtFromRaw(jup.outAmount),
          toAmountMinFormatted: fmtFromRaw(jup.otherAmountThreshold),
          routeName: 'Jupiter',
          priceImpactPct: parseFloat(jup.priceImpactPct) * 100,
          raw: jup,
        };
        setQuote(next);
        return next;
      } catch (e) {
        const err = e instanceof Error ? e : new Error('Quote failed');
        setError(err);
        throw err;
      } finally {
        setIsQuoting(false);
      }
    },
    [core, wallet]
  );

  const execute = useCallback<UseSwapReturn['execute']>(async () => {
    if (!quote) throw new Error('No quote — call getQuote first');
    setIsSwapping(true);
    setError(null);
    try {
      if (quote.ecosystem === 'evm') {
        const pk = core.getEvmPrivateKey();
        if (!pk) throw new Error('Wallet not unlocked');
        const chainId = wallet.activeChainId;
        if (!chainId) throw new Error('No active EVM chain');
        const chain = core.getEvmChain(chainId);
        const hash = await executeLiFiQuote({
          quote: quote.raw as LiFiQuote,
          privateKey: pk,
          rpcUrl: chain?.rpcUrls.default[0]?.url,
        });
        const explorer = chain?.blockExplorers?.default.url;
        const explorerUrl = explorer ? `${explorer}/tx/${hash}` : undefined;
        activity.record({
          ecosystem: 'evm',
          chain: String(chainId),
          kind: 'swap',
          title: `Swapped via ${quote.routeName}`,
          subtitle: `${quote.toAmountFormatted} received`,
          hash,
          explorerUrl,
          address: core.evmAddress ?? '',
          timestamp: Date.now(),
          status: 'confirmed',
        });
        return { hash, explorerUrl };
      }

      // Solana
      const slug = wallet.activeSolanaChainSlug;
      if (!slug) throw new Error('No active Solana chain');
      const chain = core.getSolanaChain(slug);
      if (!chain) throw new Error(`Chain ${slug} not registered`);
      const pk = core.getSolanaPrivateKey();
      if (!pk) throw new Error('Wallet not unlocked');

      const sig = await executeJupiterSwap({
        quote: quote.raw as JupiterQuote,
        privateKeyHex: pk,
        rpcUrl: chain.rpcUrl,
      });
      const explorerUrl =
        chain.cluster === 'mainnet-beta'
          ? `https://solscan.io/tx/${sig}`
          : `https://solscan.io/tx/${sig}?cluster=${chain.cluster}`;
      activity.record({
        ecosystem: 'solana',
        chain: chain.cluster,
        kind: 'swap',
        title: `Swapped via ${quote.routeName}`,
        subtitle: `${quote.toAmountFormatted} received`,
        hash: sig,
        explorerUrl,
        address: core.solanaAddress ?? '',
        timestamp: Date.now(),
        status: 'confirmed',
      });
      return { hash: sig, explorerUrl };
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Swap failed');
      setError(err);
      throw err;
    } finally {
      setIsSwapping(false);
    }
  }, [core, wallet, quote]);

  const reset = useCallback(() => {
    setQuote(null);
    setError(null);
  }, []);

  return { quote, isQuoting, isSwapping, error, getQuote, execute, reset };
}
