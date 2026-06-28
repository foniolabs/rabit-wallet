/**
 * useWallet — hook for wallet state and operations
 */

import { useCallback } from 'react';
import type { WalletAccount, ChainId } from '@rabit/types';
import { useRabitContext } from '../provider.js';

export interface UseWalletReturn {
  /** All wallet accounts */
  accounts: WalletAccount[];
  /** Currently active account */
  activeAccount: WalletAccount | null;
  /** Active EVM chain ID */
  activeChainId: ChainId | null;
  /** Whether wallet is ready */
  isReady: boolean;
  /** Whether wallet is loading */
  isLoading: boolean;
  /** True when a PIN vault exists and the wallet is locked. */
  isLocked: boolean;
  /** True when the user has a PIN set on this device. */
  hasPin: boolean;
  /** True when this device is missing the device share — recovery required. */
  needsRecovery: boolean;

  /** EVM address (shortcut) */
  evmAddress: string | null;
  /** Solana address (shortcut) */
  solanaAddress: string | null;

  /** Switch active account */
  switchAccount: (address: string) => void;
  /** Switch EVM chain */
  switchChain: (chainId: ChainId) => void;

  /** Set or change the PIN. Wallet must be unlocked. */
  setPin: (pin: string) => Promise<void>;
  /** Remove the PIN protection. Wallet must be unlocked. */
  removePin: () => Promise<void>;
  /** Unlock the wallet. */
  unlock: (pin: string) => Promise<void>;
  /** Lock the wallet (clears keys from memory). */
  lock: () => void;
}

export function useWallet(): UseWalletReturn {
  const { core, wallet } = useRabitContext();

  const switchAccount = useCallback((address: string) => core.switchAccount(address), [core]);
  const switchChain = useCallback((chainId: ChainId) => core.switchChain(chainId), [core]);
  const setPin = useCallback((pin: string) => core.setPin(pin), [core]);
  const removePin = useCallback(() => core.removePin(), [core]);
  const unlock = useCallback((pin: string) => core.unlock(pin), [core]);
  const lock = useCallback(() => core.lock(), [core]);

  return {
    accounts: wallet.accounts,
    activeAccount: wallet.activeAccount,
    activeChainId: wallet.activeChainId,
    isReady: wallet.isReady,
    isLoading: wallet.isLoading,
    isLocked: wallet.isLocked,
    hasPin: wallet.hasPin,
    needsRecovery: wallet.needsRecovery,
    evmAddress: core.evmAddress,
    solanaAddress: core.solanaAddress,
    switchAccount,
    switchChain,
    setPin,
    removePin,
    unlock,
    lock,
  };
}
