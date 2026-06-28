/**
 * useContractWrite — write to an EVM contract function with the SDK's
 * in-memory key. Pairs with `<TransactionPreview />` for the friendly
 * confirmation UX.
 */

import { useCallback, useState } from 'react';
import { writeEvmContract, type Abi } from '@rabit/evm';
import type { ChainId } from '@rabit/types';
import { useRabitContext } from '../provider.js';
import { useActivity } from './useActivity.js';

export interface ContractWriteArgs {
  /** Defaults to the active EVM chain. */
  chainId?: ChainId;
  address: `0x${string}`;
  abi: Abi;
  functionName: string;
  args?: readonly unknown[];
  /** Optional native value to attach (e.g. for payable functions). */
  value?: bigint;
}

export interface UseContractWriteReturn {
  write: (args: ContractWriteArgs) => Promise<{ hash: `0x${string}`; explorerUrl?: string }>;
  isWriting: boolean;
  error: Error | null;
  hash: `0x${string}` | null;
  reset: () => void;
}

export function useContractWrite(): UseContractWriteReturn {
  const { core, wallet } = useRabitContext();
  const activity = useActivity();
  const [isWriting, setIsWriting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hash, setHash] = useState<`0x${string}` | null>(null);

  const write = useCallback(
    async (args: ContractWriteArgs) => {
      setIsWriting(true);
      setError(null);
      setHash(null);
      try {
        const chainId = args.chainId ?? wallet.activeChainId;
        if (!chainId) throw new Error('No active EVM chain');
        const chain = core.getEvmChain(chainId);
        if (!chain) throw new Error(`Chain ${chainId} not registered`);
        const pk = core.getEvmPrivateKey();
        if (!pk) throw new Error('Wallet not unlocked');

        const txHash = await writeEvmContract({
          chainId,
          privateKey: pk,
          address: args.address,
          abi: args.abi,
          functionName: args.functionName,
          args: args.args,
          value: args.value,
          rpcUrl: chain.rpcUrls.default[0].url,
        });
        setHash(txHash);
        const explorer = chain.blockExplorers?.default.url;
        const explorerUrl = explorer ? `${explorer}/tx/${txHash}` : undefined;
        activity.record({
          ecosystem: 'evm',
          chain: String(chainId),
          kind: args.functionName === 'approve' ? 'approve' : 'contract_call',
          title: `${args.functionName}() on ${args.address.slice(0, 8)}…`,
          subtitle: undefined,
          hash: txHash,
          explorerUrl,
          address: core.evmAddress ?? '',
          timestamp: Date.now(),
          status: 'confirmed',
        });
        return { hash: txHash, explorerUrl };
      } catch (e) {
        const err = e instanceof Error ? e : new Error('Write failed');
        setError(err);
        throw err;
      } finally {
        setIsWriting(false);
      }
    },
    [core, wallet]
  );

  const reset = useCallback(() => {
    setError(null);
    setHash(null);
  }, []);

  return { write, isWriting, error, hash, reset };
}
