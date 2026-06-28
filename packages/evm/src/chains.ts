/**
 * Common EVM chain definitions
 */

import { type Chain } from 'viem';
import {
  mainnet,
  polygon,
  arbitrum,
  optimism,
  base,
  bsc,
  avalanche,
  sepolia,
  goerli,
  polygonMumbai,
  arbitrumSepolia,
  baseSepolia,
  optimismSepolia,
} from 'viem/chains';

/**
 * All supported mainnets
 */
export const MAINNET_CHAINS: Record<number, Chain> = {
  [mainnet.id]: mainnet,
  [polygon.id]: polygon,
  [arbitrum.id]: arbitrum,
  [optimism.id]: optimism,
  [base.id]: base,
  [bsc.id]: bsc,
  [avalanche.id]: avalanche,
};

/**
 * All supported testnets
 */
export const TESTNET_CHAINS: Record<number, Chain> = {
  [sepolia.id]: sepolia,
  [goerli.id]: goerli,
  [polygonMumbai.id]: polygonMumbai,
  [arbitrumSepolia.id]: arbitrumSepolia,
  [baseSepolia.id]: baseSepolia,
  [optimismSepolia.id]: optimismSepolia,
};

/**
 * All supported chains
 */
export const ALL_CHAINS: Record<number, Chain> = {
  ...MAINNET_CHAINS,
  ...TESTNET_CHAINS,
};

/**
 * Get a chain by ID
 */
export function getChain(chainId: number): Chain | undefined {
  return ALL_CHAINS[chainId];
}
