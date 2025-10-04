import { useBalance as useWagmiBalance } from 'wagmi';
import { formatUnits } from 'viem';
import type { Address } from 'viem';

interface UseBalanceParams {
  address?: string;
  chainId?: number;
  token?: string;
}

interface UseBalanceReturn {
  data?: {
    decimals: number;
    formatted: string;
    symbol: string;
    value: bigint;
  };
  error: Error | null;
  isLoading: boolean;
  refetch: () => void;
}

export function useBalance({ address, chainId, token }: UseBalanceParams = {}): UseBalanceReturn {
  const result = useWagmiBalance({
    address: address as Address,
    chainId,
    token: token as Address,
  });

  return {
    ...result,
    data: result.data ? {
      ...result.data,
      formatted: formatUnits(result.data.value, result.data.decimals),
    } : undefined,
  };
}
