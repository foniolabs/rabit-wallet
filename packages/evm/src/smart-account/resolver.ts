/**
 * Bridge helper: produces a SmartAccountResolver compatible with @rabit/core,
 * so the WalletEngine can populate a smart-account address without depending
 * on this package directly.
 */

import type { ChainId } from '@rabit/types';
import { getChain } from '../chains.js';
import { createSmartAccount } from './smart-account.js';
import type { SmartAccountConfig, SmartAccountImpl } from './types.js';

export interface SmartAccountResolverOptions {
  type: SmartAccountImpl;
  bundlerUrl: string;
  paymasterUrl?: string;
  /** Fallback RPC URL if no per-chain transport is supplied */
  defaultRpcUrl?: string;
  /** Per-chainId RPC URL mapping */
  rpcUrls?: Record<ChainId, string>;
  index?: bigint;
}

/**
 * Build a resolver callable the shape `(args) => Promise<{address, isDeployed}>`.
 * Hand the returned function to `RabitConfig.smartAccountResolver`.
 */
export function createSmartAccountResolver(opts: SmartAccountResolverOptions) {
  return async ({ evmPrivateKey, chainId }: { evmPrivateKey: string; chainId: ChainId }) => {
    const chain = getChain(chainId);
    if (!chain) {
      throw new Error(`Unsupported chainId: ${chainId}`);
    }
    const rpcUrl =
      opts.rpcUrls?.[chainId] ??
      opts.defaultRpcUrl ??
      chain.rpcUrls.default.http[0];

    const config: SmartAccountConfig = {
      type: opts.type,
      ownerPrivateKey: evmPrivateKey,
      chain,
      rpcUrl,
      bundlerUrl: opts.bundlerUrl,
      paymasterUrl: opts.paymasterUrl,
      index: opts.index,
    };

    const sa = await createSmartAccount(config);
    const isDeployed = await sa.isDeployed();
    return { address: sa.address, isDeployed };
  };
}
