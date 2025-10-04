import { useAuth } from './useAuth';
import { SocialProvider } from '../types';

export function useSocialAuth() {
  const { signIn, signOut, user, isAuthenticated, isLoading, error } = useAuth();

  const signInWithProvider = async (provider: SocialProvider) => {
    await signIn(provider);
  };

  return {
    signIn: signInWithProvider,
    signOut,
    user,
    isAuthenticated,
    isLoading,
    error,
    providers: ['google', 'twitter', 'discord', 'github', 'email'] as SocialProvider[],
  };
}
