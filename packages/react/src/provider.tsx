/**
 * RabitProvider — main React context provider for the Rabit SDK
 *
 * Wraps the app and provides auth, wallet, and on-ramp state to all children
 * via React context. Initializes RabitCore under the hood.
 */

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { RabitConfig, AuthState, WalletState } from '@rabit/types';
import { RabitCore, createRabit } from '@rabit/core';

interface RabitContextValue {
  /** Core SDK instance */
  core: RabitCore;
  /** SDK configuration (so hooks can read apiBaseUrl / apiKey / projectId) */
  config: RabitConfig;
  /** Current auth state */
  auth: AuthState;
  /** Current wallet state */
  wallet: WalletState;
}

const RabitContext = createContext<RabitContextValue | null>(null);

export interface RabitProviderProps {
  config: RabitConfig;
  children: React.ReactNode;
}

export function RabitProvider({ config, children }: RabitProviderProps) {
  const coreRef = useRef<RabitCore | null>(null);

  // Initialize core once
  if (!coreRef.current) {
    coreRef.current = createRabit(config);
  }

  const core = coreRef.current;

  const [auth, setAuth] = useState<AuthState>(core.auth);
  const [wallet, setWallet] = useState<WalletState>(core.wallet);

  useEffect(() => {
    const unsubAuth = core.on('auth:changed', (state) => {
      setAuth(state as AuthState);
    });

    const unsubWallet = core.on('wallet:changed', (state) => {
      setWallet(state as WalletState);
    });

    // Try to restore any persisted session once on mount. If the user has
    // a fresh JWT in localStorage and a device share or PIN vault locally,
    // they'll be back to ready (or locked) without needing to re-sign-in.
    void core.tryRestoreSession().catch(() => {/* already handled */});

    return () => {
      unsubAuth();
      unsubWallet();
    };
  }, [core]);

  const value = useMemo<RabitContextValue>(
    () => ({ core, config, auth, wallet }),
    [core, config, auth, wallet]
  );

  return (
    <RabitContext.Provider value={value}>
      {children}
    </RabitContext.Provider>
  );
}

/**
 * Hook to access the Rabit context (internal)
 */
export function useRabitContext(): RabitContextValue {
  const context = useContext(RabitContext);
  if (!context) {
    throw new Error('useRabitContext must be used within a <RabitProvider>');
  }
  return context;
}
