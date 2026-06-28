/**
 * useSignMessage — sign off-chain messages.
 *
 *   • signMessage(string)         → personal_sign for EVM, ed25519 for Solana
 *   • signTypedData(typedData)    → EIP-712 (EVM only)
 *
 * The active account's ecosystem decides the routing. Dev-facing UI: pair
 * with <TransactionPreview /> to show the user the message they're signing
 * before it happens.
 */

import { useCallback, useState } from 'react';
import { signEvmMessage, signEvmTypedData } from '@rabit/evm';
import { signSolanaMessage } from '@rabit/solana';
import { useRabitContext } from '../provider.js';

export interface UseSignMessageReturn {
  /** Sign a UTF-8 string. Returns the signature in the ecosystem's natural format. */
  signMessage: (message: string) => Promise<{
    signature: string;
    address: string;
    ecosystem: 'evm' | 'solana';
  }>;
  /** Sign EIP-712 typed data (EVM only). */
  signTypedData: (typedData: any) => Promise<`0x${string}`>;
  isSigning: boolean;
  error: Error | null;
  reset: () => void;
}

export function useSignMessage(): UseSignMessageReturn {
  const { core, wallet } = useRabitContext();
  const [isSigning, setIsSigning] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const signMessage = useCallback(
    async (message: string) => {
      setIsSigning(true);
      setError(null);
      try {
        const ecosystem = wallet.activeAccount?.ecosystem;
        if (!ecosystem) throw new Error('No active account');

        if (ecosystem === 'evm') {
          const pk = core.getEvmPrivateKey();
          if (!pk) throw new Error('Wallet not unlocked');
          const signature = await signEvmMessage({ privateKey: pk, message });
          return {
            signature,
            address: core.evmAddress!,
            ecosystem: 'evm' as const,
          };
        }

        const pk = core.getSolanaPrivateKey();
        if (!pk) throw new Error('Wallet not unlocked');
        const result = signSolanaMessage({ privateKeyHex: pk, message });
        return {
          signature: result.signature,
          address: result.publicKey,
          ecosystem: 'solana' as const,
        };
      } catch (e) {
        const err = e instanceof Error ? e : new Error('Sign failed');
        setError(err);
        throw err;
      } finally {
        setIsSigning(false);
      }
    },
    [core, wallet]
  );

  const signTypedData = useCallback(
    async (typedData: any) => {
      setIsSigning(true);
      setError(null);
      try {
        if (wallet.activeAccount?.ecosystem !== 'evm') {
          throw new Error('signTypedData is EVM-only (use signMessage on Solana)');
        }
        const pk = core.getEvmPrivateKey();
        if (!pk) throw new Error('Wallet not unlocked');
        return await signEvmTypedData({ privateKey: pk, typedData });
      } catch (e) {
        const err = e instanceof Error ? e : new Error('Sign failed');
        setError(err);
        throw err;
      } finally {
        setIsSigning(false);
      }
    },
    [core, wallet]
  );

  const reset = useCallback(() => setError(null), []);

  return { signMessage, signTypedData, isSigning, error, reset };
}
