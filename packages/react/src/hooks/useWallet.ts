import { useWalletContext } from '../providers/WalletProvider';
import { useAccount as useWagmiAccount } from 'wagmi';

export function useWallet() {
  const context = useWalletContext();
  const { connector } = useWagmiAccount();
  
  return {
    ...context,
    connector,
  };
}
