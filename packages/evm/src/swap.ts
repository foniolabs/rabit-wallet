/**
 * EVM swap helpers — LiFi DEX aggregator.
 *
 * LiFi's API is fully public (no key required). Quote + execute follows a
 * two-step pattern: fetch a route, then send the embedded transaction with
 * the user's wallet.
 *
 *   docs: https://docs.li.fi/api-reference
 */

import {
  createWalletClient,
  http,
  parseUnits,
  formatUnits,
  type Address,
  type Hash,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import type { ChainId } from '@rabit/types';
import { getChain } from './chains.js';

const LIFI_BASE = 'https://li.quest/v1';

export interface LiFiQuoteRequest {
  fromChainId: ChainId;
  toChainId: ChainId;
  /** Token contract address. Use the zero address for the native coin. */
  fromTokenAddress: Address;
  toTokenAddress: Address;
  /** Smallest-unit amount, as a string (e.g. parseUnits('1', 6).toString()). */
  fromAmount: string;
  fromAddress: Address;
  /** Optional slippage as a fraction (0.005 = 0.5%). Default 0.005. */
  slippage?: number;
}

export interface LiFiQuote {
  /** Estimated output amount in smallest unit. */
  toAmount: string;
  /** Min output after slippage, smallest unit. */
  toAmountMin: string;
  /** Aggregator name, e.g. "lifi", "1inch". */
  toolName: string;
  /** Estimated gas cost in USD. */
  gasCostUSD?: string;
  /** Per-leg fee summary in USD. */
  feeCostUSD?: string;
  /** The full route — pass back to executeLiFiQuote without modification. */
  raw: any;
}

/** Address that LiFi uses for the native coin. */
export const LIFI_NATIVE_ADDRESS = '0x0000000000000000000000000000000000000000' as const;

export async function getLiFiQuote(req: LiFiQuoteRequest): Promise<LiFiQuote> {
  const params = new URLSearchParams({
    fromChain: String(req.fromChainId),
    toChain: String(req.toChainId),
    fromToken: req.fromTokenAddress,
    toToken: req.toTokenAddress,
    fromAmount: req.fromAmount,
    fromAddress: req.fromAddress,
    slippage: String(req.slippage ?? 0.005),
  });

  const res = await fetch(`${LIFI_BASE}/quote?${params}`);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`LiFi quote failed (${res.status}): ${text || res.statusText}`);
  }
  const json = await res.json();

  // gasCostUSD/feeCostUSD live under estimate
  const est = json.estimate;
  return {
    toAmount: est.toAmount,
    toAmountMin: est.toAmountMin,
    toolName: json.tool,
    gasCostUSD: est.gasCosts?.[0]?.amountUSD,
    feeCostUSD: est.feeCosts?.[0]?.amountUSD,
    raw: json,
  };
}

/**
 * Execute a previously-fetched LiFi quote. Sends the transaction the route
 * embeds (could be a swap call, a bridge call, etc.) and returns the tx hash.
 */
export async function executeLiFiQuote(args: {
  quote: LiFiQuote;
  privateKey: string;
  rpcUrl?: string;
}): Promise<Hash> {
  const txReq = args.quote.raw.transactionRequest;
  if (!txReq) {
    throw new Error('LiFi quote is missing a transactionRequest');
  }

  const chainId = Number(txReq.chainId);
  const chain = getChain(chainId);
  if (!chain) throw new Error(`Unsupported chainId ${chainId}`);

  const account = privateKeyToAccount(
    (args.privateKey.startsWith('0x') ? args.privateKey : `0x${args.privateKey}`) as `0x${string}`
  );
  const rpcUrl = args.rpcUrl ?? chain.rpcUrls.default.http[0];
  const wallet = createWalletClient({ account, chain, transport: http(rpcUrl) });

  return wallet.sendTransaction({
    account,
    chain,
    to: txReq.to as `0x${string}`,
    value: txReq.value ? BigInt(txReq.value) : 0n,
    data: txReq.data as `0x${string}`,
    gas: txReq.gasLimit ? BigInt(txReq.gasLimit) : undefined,
    gasPrice: txReq.gasPrice ? BigInt(txReq.gasPrice) : undefined,
  } as any);
}

/** Helper for callers — read-only formatting. */
export function formatLiFiAmount(raw: string, decimals: number): string {
  return formatUnits(BigInt(raw), decimals);
}

export { parseUnits as parseSwapUnits };
