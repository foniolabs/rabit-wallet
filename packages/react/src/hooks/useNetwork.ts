import { useChainId, useChains, useSwitchChain } from 'wagmi';
import type { Chain } from 'viem';

interface UseNetworkReturn {
  chain: Chain | undefined;
  chains: readonly Chain[];
  switchChain: ((parameters: { chainId: number }) => void) | undefined;
  isLoading: boolean;
  error: Error | null;
}

export function useNetwork(): UseNetworkReturn {
  const chainId = useChainId();
  const chains = useChains();
  const { switchChain, isPending, error } = useSwitchChain();

  const currentChain = chains.find(chain => chain.id === chainId);

  return {
    chain: currentChain,
    chains,
    switchChain,
    isLoading: isPending,
    error,
  };
}
