/**
 * useAuth — hook for authentication operations
 */

import { useState, useCallback } from 'react';
import type { AuthState, AuthUser, KeyShare, OAuthProvider } from '@rabit/types';
import { useRabitContext } from '../provider.js';

export interface UseAuthReturn {
  /** Current auth status */
  status: AuthState['status'];
  /** Authenticated user */
  user: AuthUser | null;
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** Whether auth is in progress */
  isLoading: boolean;
  /** Auth error */
  error: Error | null;

  /** Send OTP to email */
  sendOTP: (email: string) => Promise<void>;
  /** Verify OTP and initialize wallet. Pass `displayName` for new users. */
  verifyOTP: (
    email: string,
    code: string,
    options?: { displayName?: string }
  ) => Promise<{
    isNewUser: boolean;
    recoveryShare?: KeyShare;
  }>;
  /** Authenticate with OAuth */
  loginWithOAuth: (provider: OAuthProvider, idToken: string) => Promise<{
    isNewUser: boolean;
    recoveryShare?: KeyShare;
  }>;
  /** Logout */
  logout: () => Promise<void>;
  /** Update the authenticated user's profile (displayName, profileImage). */
  updateProfile: (patch: { displayName?: string; profileImage?: string }) => Promise<unknown>;
}

export function useAuth(): UseAuthReturn {
  const { core, auth } = useRabitContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const sendOTP = useCallback(async (email: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await core.sendOTP(email);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to send OTP'));
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [core]);

  const verifyOTP = useCallback(
    async (email: string, code: string, options?: { displayName?: string }) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await core.verifyOTP(email, code, options);
        return result;
      } catch (e) {
        setError(e instanceof Error ? e : new Error('OTP verification failed'));
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    [core]
  );

  const updateProfile = useCallback(
    async (patch: { displayName?: string; profileImage?: string }) => {
      setError(null);
      try {
        return await core.updateProfile(patch);
      } catch (e) {
        setError(e instanceof Error ? e : new Error('Failed to update profile'));
        throw e;
      }
    },
    [core]
  );

  const loginWithOAuth = useCallback(async (provider: OAuthProvider, idToken: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await core.authenticateOAuth(provider, idToken);
      return result;
    } catch (e) {
      setError(e instanceof Error ? e : new Error('OAuth failed'));
      throw e;
    } finally {
      setIsLoading(false);
    }
  }, [core]);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await core.logout();
    } finally {
      setIsLoading(false);
    }
  }, [core]);

  return {
    status: auth.status,
    user: auth.user,
    isAuthenticated: auth.status === 'authenticated',
    isLoading: isLoading || auth.status === 'authenticating',
    error: error || auth.error,
    sendOTP,
    verifyOTP,
    loginWithOAuth,
    logout,
    updateProfile,
  };
}
