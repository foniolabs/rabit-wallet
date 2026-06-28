/**
 * Authentication types for Rabit embedded wallet
 */

/**
 * Supported authentication methods
 */
export type AuthMethod = 'email' | 'google' | 'apple' | 'twitter';

/**
 * OAuth provider identifiers
 */
export type OAuthProvider = 'google' | 'apple' | 'twitter';

/**
 * Authentication state
 */
export type AuthStatus =
  | 'unauthenticated'
  | 'authenticating'
  | 'authenticated'
  | 'error';

/**
 * Email OTP request
 */
export interface OTPRequest {
  email: string;
  type: 'signup' | 'login';
}

/**
 * Email OTP verification
 */
export interface OTPVerification {
  email: string;
  code: string;
  type: 'signup' | 'login';
}

/**
 * OAuth login request
 */
export interface OAuthRequest {
  provider: OAuthProvider;
  redirectUri?: string;
  state?: string;
}

/**
 * OAuth callback data
 */
export interface OAuthCallback {
  provider: OAuthProvider;
  code: string;
  state?: string;
}

/**
 * Authenticated user
 */
export interface AuthUser {
  /** Unique user ID */
  id: string;
  /** Email address */
  email: string;
  /** Auth method used */
  authMethod: AuthMethod;
  /** Display name (from OAuth) */
  displayName?: string;
  /** Profile image URL (from OAuth) */
  profileImage?: string;
  /** When user was created */
  createdAt: number;
  /** Last login timestamp */
  lastLoginAt: number;
}

/**
 * Auth session stored client-side
 */
export interface AuthSession {
  /** Session token (JWT) */
  token: string;
  /** Refresh token */
  refreshToken: string;
  /** Token expiry timestamp (ms) */
  expiresAt: number;
  /** Associated user */
  user: AuthUser;
}

/**
 * Full auth state
 */
export interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  session: AuthSession | null;
  error: Error | null;
}
