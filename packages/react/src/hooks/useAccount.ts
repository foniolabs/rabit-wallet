import { useAccount as useWagmiAccount } from 'wagmi';
import { useWallet } from './useWallet';
import { useSmartAccount } from './useSmartAccount';

export function useAccount() {
  const wagmiAccount = useWagmiAccount();
  const wallet = useWallet();
  const smartAccount = useSmartAccount();

  return {
    // EOA account info
    address: wagmiAccount.address,
    isConnected: wagmiAccount.isConnected,
    isConnecting: wallet.isConnecting,
    chainId: wagmiAccount.chainId,
    connector: wagmiAccount.connector,
    
    // Smart account info
    smartAccount: {
      address: smartAccount.address,
      isDeployed: smartAccount.isDeployed,
      isLoading: smartAccount.isLoading,
    },
    
    // Combined state
    error: wallet.error || smartAccount.error,
  };
}
