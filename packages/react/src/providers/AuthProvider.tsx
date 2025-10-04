import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AuthConfig, AuthState, SocialProvider } from '../types';

interface AuthContextType extends AuthState {
  signIn: (provider: SocialProvider) => Promise<void>;
  signOut: () => Promise<void>;
  signMessage: (message: string) => Promise<string>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  config?: AuthConfig;
  children: ReactNode;
}

export function AuthProvider({ config, children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  });

  const signIn = async (provider: SocialProvider) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      // TODO: Implement social auth logic here
      // This would integrate with your social auth providers
      console.log('Signing in with:', provider);
      setAuthState(prev => ({ ...prev, isLoading: false }));
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error as Error,
      }));
    }
  };

  const signOut = async () => {
    try {
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        error: error as Error,
      }));
    }
  };

  const signMessage = async (message: string) => {
    // TODO: Implement message signing
    console.log('Signing message:', message);
    return '';
  };

  const value: AuthContextType = {
    ...authState,
    signIn,
    signOut,
    signMessage,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
