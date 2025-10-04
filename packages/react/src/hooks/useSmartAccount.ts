import { useSmartAccountContext } from '../providers/SmartAccountProvider';

export function useSmartAccount() {
  const context = useSmartAccountContext();
  
  return {
    address: context.address,
    isDeployed: context.isDeployed,
    isLoading: context.isLoading,
    error: context.error,
    createSmartAccount: context.createSmartAccount,
    sendUserOperation: context.sendUserOperation,
    batchTransactions: context.batchTransactions,
  };
}
