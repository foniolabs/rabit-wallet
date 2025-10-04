export interface AuthConfig {
  providers?: SocialProvider[];
  redirectUrl?: string;
  apiKey?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
}

export interface User {
  id: string;
  email?: string;
  name?: string;
  avatar?: string;
  provider: SocialProvider;
  walletAddress?: string;
}

export type SocialProvider = 'google' | 'twitter' | 'discord' | 'github' | 'email';
