import { useState } from 'react';
import { useWallet } from './useWallet';
import { useSmartAccount } from './useSmartAccount';
import { useSendTransaction } from 'wagmi';

interface TransactionOptions {
  useSmartAccount?: boolean;
  sponsored?: boolean;
}

export function useTransaction(options: TransactionOptions = {}) {
  const { useSmartAccount: useSmartWallet = false, sponsored = false } = options;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const { address } = useWallet();
  const { sendUserOperation } = useSmartAccount();
  const { sendTransactionAsync } = useSendTransaction();

  const sendTransaction = async (transaction: any) => {
    try {
      setIsLoading(true);
      setError(null);

      let hash: string;

      if (useSmartWallet) {
        hash = await sendUserOperation([transaction]);
      } else {
        const result = await sendTransactionAsync(transaction);
        hash = result;
      }

      return hash;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const batchTransactions = async (transactions: any[]) => {
    if (!useSmartWallet) {
      throw new Error('Batch transactions require smart account');
    }

    try {
      setIsLoading(true);
      setError(null);

      const hash = await sendUserOperation(transactions);
      return hash;
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sendTransaction,
    batchTransactions,
    isLoading,
    error,
    canBatch: useSmartWallet,
    canSponsor: useSmartWallet && sponsored,
  };
}
