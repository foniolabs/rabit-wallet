import { useAuthContext } from '../providers/AuthProvider';

export function useAuth() {
  const context = useAuthContext();
  
  return {
    user: context.user,
    isAuthenticated: context.isAuthenticated,
    isLoading: context.isLoading,
    error: context.error,
    signIn: context.signIn,
    signOut: context.signOut,
    signMessage: context.signMessage,
  };
}
