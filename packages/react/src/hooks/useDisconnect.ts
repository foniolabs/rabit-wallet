import { useWallet } from './useWallet';

export function useDisconnect() {
  const { disconnect, isConnected } = useWallet();

  return {
    disconnect,
    isConnected,
  };
}
