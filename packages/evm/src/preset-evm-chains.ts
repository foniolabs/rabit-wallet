/**
 * Preset EvmChain entries (the SDK's own chain shape, not viem's).
 *
 * Five most popular EVM L1/L2s, each as a mainnet + testnet pair.
 * Re-export through @rabit/evm so `RabitConfig.evmChains` can be populated
 * without the developer hand-rolling the entries.
 */

import type { EvmChain } from '@rabit/types';

const ETH_NATIVE = { name: 'Ether', symbol: 'ETH', decimals: 18 };
const MATIC_NATIVE = { name: 'POL', symbol: 'POL', decimals: 18 };
const BNB_NATIVE = { name: 'BNB', symbol: 'BNB', decimals: 18 };

export const ETHEREUM_MAINNET: EvmChain = {
  ecosystem: 'evm',
  id: 1,
  name: 'Ethereum',
  slug: 'ethereum',
  nativeCurrency: ETH_NATIVE,
  // publicnode is keyless and reliable; cloudflare-eth deprecated free access.
  rpcUrls: { default: [{ url: 'https://ethereum-rpc.publicnode.com' }] },
  blockExplorers: { default: { name: 'Etherscan', url: 'https://etherscan.io' } },
  testnet: false,
  smartAccountSupport: true,
};

export const ETHEREUM_SEPOLIA: EvmChain = {
  ecosystem: 'evm',
  id: 11155111,
  name: 'Sepolia',
  slug: 'sepolia',
  nativeCurrency: { ...ETH_NATIVE, name: 'Sepolia Ether' },
  rpcUrls: { default: [{ url: 'https://sepolia.drpc.org' }] },
  blockExplorers: { default: { name: 'Etherscan', url: 'https://sepolia.etherscan.io' } },
  testnet: true,
  smartAccountSupport: true,
};

export const POLYGON_MAINNET: EvmChain = {
  ecosystem: 'evm',
  id: 137,
  name: 'Polygon',
  slug: 'polygon',
  nativeCurrency: MATIC_NATIVE,
  rpcUrls: { default: [{ url: 'https://polygon-rpc.com' }] },
  blockExplorers: { default: { name: 'Polygonscan', url: 'https://polygonscan.com' } },
  testnet: false,
  smartAccountSupport: true,
};

export const POLYGON_AMOY: EvmChain = {
  ecosystem: 'evm',
  id: 80002,
  name: 'Polygon Amoy',
  slug: 'polygon-amoy',
  nativeCurrency: MATIC_NATIVE,
  rpcUrls: { default: [{ url: 'https://rpc-amoy.polygon.technology' }] },
  blockExplorers: { default: { name: 'Polygonscan', url: 'https://amoy.polygonscan.com' } },
  testnet: true,
  smartAccountSupport: true,
};

export const ARBITRUM_MAINNET: EvmChain = {
  ecosystem: 'evm',
  id: 42161,
  name: 'Arbitrum One',
  slug: 'arbitrum',
  nativeCurrency: ETH_NATIVE,
  rpcUrls: { default: [{ url: 'https://arb1.arbitrum.io/rpc' }] },
  blockExplorers: { default: { name: 'Arbiscan', url: 'https://arbiscan.io' } },
  testnet: false,
  smartAccountSupport: true,
};

export const ARBITRUM_SEPOLIA: EvmChain = {
  ecosystem: 'evm',
  id: 421614,
  name: 'Arbitrum Sepolia',
  slug: 'arbitrum-sepolia',
  nativeCurrency: ETH_NATIVE,
  rpcUrls: { default: [{ url: 'https://sepolia-rollup.arbitrum.io/rpc' }] },
  blockExplorers: { default: { name: 'Arbiscan', url: 'https://sepolia.arbiscan.io' } },
  testnet: true,
  smartAccountSupport: true,
};

export const OPTIMISM_MAINNET: EvmChain = {
  ecosystem: 'evm',
  id: 10,
  name: 'OP Mainnet',
  slug: 'optimism',
  nativeCurrency: ETH_NATIVE,
  rpcUrls: { default: [{ url: 'https://mainnet.optimism.io' }] },
  blockExplorers: { default: { name: 'Etherscan', url: 'https://optimistic.etherscan.io' } },
  testnet: false,
  smartAccountSupport: true,
};

export const OPTIMISM_SEPOLIA: EvmChain = {
  ecosystem: 'evm',
  id: 11155420,
  name: 'OP Sepolia',
  slug: 'optimism-sepolia',
  nativeCurrency: ETH_NATIVE,
  rpcUrls: { default: [{ url: 'https://sepolia.optimism.io' }] },
  blockExplorers: { default: { name: 'Etherscan', url: 'https://sepolia-optimism.etherscan.io' } },
  testnet: true,
  smartAccountSupport: true,
};

export const BASE_MAINNET: EvmChain = {
  ecosystem: 'evm',
  id: 8453,
  name: 'Base',
  slug: 'base',
  nativeCurrency: ETH_NATIVE,
  rpcUrls: { default: [{ url: 'https://mainnet.base.org' }] },
  blockExplorers: { default: { name: 'Basescan', url: 'https://basescan.org' } },
  testnet: false,
  smartAccountSupport: true,
};

export const BASE_SEPOLIA: EvmChain = {
  ecosystem: 'evm',
  id: 84532,
  name: 'Base Sepolia',
  slug: 'base-sepolia',
  nativeCurrency: ETH_NATIVE,
  rpcUrls: { default: [{ url: 'https://sepolia.base.org' }] },
  blockExplorers: { default: { name: 'Basescan', url: 'https://sepolia.basescan.org' } },
  testnet: true,
  smartAccountSupport: true,
};

/** All preset mainnets (5 chains). */
export const PRESET_MAINNETS: EvmChain[] = [
  ETHEREUM_MAINNET,
  POLYGON_MAINNET,
  ARBITRUM_MAINNET,
  OPTIMISM_MAINNET,
  BASE_MAINNET,
];

/** All preset testnets (5 chains). */
export const PRESET_TESTNETS: EvmChain[] = [
  ETHEREUM_SEPOLIA,
  POLYGON_AMOY,
  ARBITRUM_SEPOLIA,
  OPTIMISM_SEPOLIA,
  BASE_SEPOLIA,
];

/** All preset chains (mainnets + testnets). */
export const PRESET_EVM_CHAINS: EvmChain[] = [...PRESET_MAINNETS, ...PRESET_TESTNETS];

/** Look up a preset chain by its chain id, or undefined. */
export function findPresetEvmChain(chainId: number): EvmChain | undefined {
  return PRESET_EVM_CHAINS.find((c) => c.id === chainId);
}

/**
 * Helper to build an EvmChain from minimal info — used when a developer
 * wants to add a chain that isn't in the preset list.
 */
export function defineEvmChain(input: {
  id: number;
  name: string;
  rpcUrl: string;
  symbol?: string;
  decimals?: number;
  blockExplorerUrl?: string;
  testnet?: boolean;
  slug?: string;
  smartAccountSupport?: boolean;
}): EvmChain {
  return {
    ecosystem: 'evm',
    id: input.id,
    name: input.name,
    slug: input.slug ?? input.name.toLowerCase().replace(/\s+/g, '-'),
    nativeCurrency: {
      name: input.symbol ?? 'ETH',
      symbol: input.symbol ?? 'ETH',
      decimals: input.decimals ?? 18,
    },
    rpcUrls: { default: [{ url: input.rpcUrl }] },
    blockExplorers: input.blockExplorerUrl
      ? { default: { name: 'Explorer', url: input.blockExplorerUrl } }
      : undefined,
    testnet: input.testnet ?? false,
    smartAccountSupport: input.smartAccountSupport ?? false,
  };
}
