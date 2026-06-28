/**
 * Preset SolanaChain entries for the three official clusters.
 *
 * Re-export through @rabit/solana so `RabitConfig.solanaChains` can be
 * populated without the developer hand-rolling the entries.
 */

import type { SolanaChain } from '@rabit/types';

const SOL_NATIVE = { name: 'Solana', symbol: 'SOL', decimals: 9 };

export const SOLANA_MAINNET: SolanaChain = {
  ecosystem: 'solana',
  cluster: 'mainnet-beta',
  name: 'Solana',
  slug: 'solana',
  nativeCurrency: SOL_NATIVE,
  rpcUrl: 'https://solana-rpc.publicnode.com',
  blockExplorer: { name: 'Solscan', url: 'https://solscan.io' },
};

export const SOLANA_DEVNET: SolanaChain = {
  ecosystem: 'solana',
  cluster: 'devnet',
  name: 'Solana Devnet',
  slug: 'solana-devnet',
  nativeCurrency: SOL_NATIVE,
  rpcUrl: 'https://api.devnet.solana.com',
  blockExplorer: { name: 'Solscan', url: 'https://solscan.io?cluster=devnet' },
};

export const SOLANA_TESTNET: SolanaChain = {
  ecosystem: 'solana',
  cluster: 'testnet',
  name: 'Solana Testnet',
  slug: 'solana-testnet',
  nativeCurrency: SOL_NATIVE,
  rpcUrl: 'https://api.testnet.solana.com',
  blockExplorer: { name: 'Solscan', url: 'https://solscan.io?cluster=testnet' },
};

export const PRESET_SOLANA_MAINNETS: SolanaChain[] = [SOLANA_MAINNET];
export const PRESET_SOLANA_TESTNETS: SolanaChain[] = [SOLANA_DEVNET, SOLANA_TESTNET];
export const PRESET_SOLANA_CHAINS: SolanaChain[] = [
  ...PRESET_SOLANA_MAINNETS,
  ...PRESET_SOLANA_TESTNETS,
];

/** Look up a preset Solana chain by its slug. */
export function findPresetSolanaChain(slug: string): SolanaChain | undefined {
  return PRESET_SOLANA_CHAINS.find((c) => c.slug === slug);
}

/**
 * Helper to build a SolanaChain from minimal info — useful when adding a
 * custom RPC (e.g. Helius / QuickNode) for an existing cluster.
 */
export function defineSolanaChain(input: {
  cluster: SolanaChain['cluster'];
  name: string;
  rpcUrl: string;
  slug?: string;
  wsUrl?: string;
  blockExplorerUrl?: string;
}): SolanaChain {
  return {
    ecosystem: 'solana',
    cluster: input.cluster,
    name: input.name,
    slug: input.slug ?? input.name.toLowerCase().replace(/\s+/g, '-'),
    nativeCurrency: SOL_NATIVE,
    rpcUrl: input.rpcUrl,
    wsUrl: input.wsUrl,
    blockExplorer: input.blockExplorerUrl
      ? { name: 'Explorer', url: input.blockExplorerUrl }
      : undefined,
  };
}
