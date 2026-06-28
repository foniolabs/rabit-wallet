/**
 * AuthEngine — handles authentication lifecycle
 *
 * Flow:
 * 1. User enters email → sendOTP()
 * 2. User enters code → verifyOTP() → receives auth session + auth share
 * 3. On login: device share (local) + auth share (from server) → reconstruct wallet
 * 4. On signup: generate new wallet → store shares → return session
 */

import type {
  AuthState,
  AuthUser,
  AuthSession,
  AuthMethod,
  OAuthProvider,
  RabitConfig,
  KeyShare,
} from '@rabit/types';

export interface AuthEngineConfig {
  apiBaseUrl: string;
  apiKey: string;
  projectId: string;
}

export type AuthEventType =
  | 'auth:state_changed'
  | 'auth:otp_sent'
  | 'auth:authenticated'
  | 'auth:logged_out'
  | 'auth:error';

export type AuthEventListener = (state: AuthState) => void;

export class AuthEngine {
  private state: AuthState = {
    status: 'unauthenticated',
    user: null,
    session: null,
    error: null,
  };

  private listeners = new Map<AuthEventType, Set<AuthEventListener>>();
  private config: AuthEngineConfig;

  // Dedupe in-flight verify/oauth calls. React StrictMode double-mounts
  // effects in dev, which previously fired two parallel auth calls that
  // raced each other through wallet generation.
  private pendingVerify: Promise<{
    session: AuthSession;
    authShare: KeyShare | null;
    isNewUser: boolean;
  }> | null = null;
  private pendingOAuth: Promise<{
    session: AuthSession;
    authShare: KeyShare | null;
    isNewUser: boolean;
  }> | null = null;

  constructor(config: AuthEngineConfig) {
    this.config = config;
  }

  /** Get current auth state */
  getState(): AuthState {
    return { ...this.state };
  }

  /** Check if user is authenticated */
  isAuthenticated(): boolean {
    return this.state.status === 'authenticated' && this.state.session !== null;
  }

  /** Get current session */
  getSession(): AuthSession | null {
    return this.state.session;
  }

  /** Get current user */
  getUser(): AuthUser | null {
    return this.state.user;
  }

  /**
   * Send OTP to email address
   */
  async sendOTP(email: string): Promise<void> {
    // Note: don't flip status to 'authenticating' here — the user isn't
    // authenticating yet, just requesting a code. Leaking 'authenticating'
    // across the send→verify boundary kept `useAuth().isLoading` stuck on,
    // which disables the OTP form's submit button.
    this.updateState({ error: null });

    try {
      const response = await this.apiRequest('/auth/otp/send', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        const reason = body.reason ? ` (${body.reason})` : '';
        throw new Error((body.message || 'Failed to send OTP') + reason);
      }

      this.emit('auth:otp_sent', this.state);
    } catch (error) {
      this.updateState({
        status: 'error',
        error: error instanceof Error ? error : new Error('Failed to send OTP'),
      });
      this.emit('auth:error', this.state);
      throw error;
    }
  }

  /**
   * Verify OTP code
   * Returns the auth share from the server on success
   */
  async verifyOTP(
    email: string,
    code: string,
    options?: { displayName?: string }
  ): Promise<{
    session: AuthSession;
    authShare: KeyShare | null;
    isNewUser: boolean;
  }> {
    if (this.pendingVerify) return this.pendingVerify;
    this.pendingVerify = this._verifyOTP(email, code, options).finally(() => {
      this.pendingVerify = null;
    });
    return this.pendingVerify;
  }

  private async _verifyOTP(
    email: string,
    code: string,
    options?: { displayName?: string }
  ): Promise<{
    session: AuthSession;
    authShare: KeyShare | null; // null on first signup (wallet not yet created)
    isNewUser: boolean;
  }> {
    try {
      const response = await this.apiRequest('/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({ email, code, displayName: options?.displayName }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Invalid OTP');
      }

      const data = await response.json();

      const session: AuthSession = {
        token: data.token,
        refreshToken: data.refreshToken,
        expiresAt: data.expiresAt,
        user: data.user,
      };

      this.updateState({
        status: 'authenticated',
        user: data.user,
        session,
        error: null,
      });

      this.emit('auth:authenticated', this.state);

      return {
        session,
        authShare: data.authShare || null,
        isNewUser: data.isNewUser,
      };
    } catch (error) {
      this.updateState({
        status: 'error',
        error: error instanceof Error ? error : new Error('OTP verification failed'),
      });
      this.emit('auth:error', this.state);
      throw error;
    }
  }

  /**
   * Authenticate via OAuth provider
   */
  async authenticateOAuth(
    provider: OAuthProvider,
    idToken: string
  ): Promise<{
    session: AuthSession;
    authShare: KeyShare | null;
    isNewUser: boolean;
  }> {
    if (this.pendingOAuth) return this.pendingOAuth;
    this.pendingOAuth = this._authenticateOAuth(provider, idToken).finally(() => {
      this.pendingOAuth = null;
    });
    return this.pendingOAuth;
  }

  private async _authenticateOAuth(
    provider: OAuthProvider,
    idToken: string
  ): Promise<{
    session: AuthSession;
    authShare: KeyShare | null;
    isNewUser: boolean;
  }> {
    this.updateState({ status: 'authenticating', error: null });

    try {
      const response = await this.apiRequest('/auth/oauth', {
        method: 'POST',
        body: JSON.stringify({ provider, idToken }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'OAuth failed');
      }

      const data = await response.json();

      const session: AuthSession = {
        token: data.token,
        refreshToken: data.refreshToken,
        expiresAt: data.expiresAt,
        user: data.user,
      };

      this.updateState({
        status: 'authenticated',
        user: data.user,
        session,
        error: null,
      });

      this.emit('auth:authenticated', this.state);

      return {
        session,
        authShare: data.authShare || null,
        isNewUser: data.isNewUser,
      };
    } catch (error) {
      this.updateState({
        status: 'error',
        error: error instanceof Error ? error : new Error('OAuth failed'),
      });
      this.emit('auth:error', this.state);
      throw error;
    }
  }

  /**
   * Store the auth share on the server (called after wallet generation)
   */
  async storeAuthShare(share: KeyShare): Promise<void> {
    const session = this.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await this.apiRequest('/auth/share', {
      method: 'POST',
      body: JSON.stringify({ share }),
      headers: {
        Authorization: `Bearer ${session.token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to store auth share');
    }
  }

  /**
   * Retrieve the auth share from the server
   */
  async getAuthShare(): Promise<KeyShare> {
    const session = this.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await this.apiRequest('/auth/share', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${session.token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to retrieve auth share');
    }

    const data = await response.json();
    return data.share;
  }

  /**
   * Delete the auth share on the server. Used by the "reset wallet" flow when
   * a user has lost both their device share and recovery share.
   */
  async deleteAuthShare(): Promise<void> {
    const session = this.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await this.apiRequest('/auth/share', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session.token}` },
    });

    // 404 is fine — share already gone.
    if (!response.ok && response.status !== 404) {
      throw new Error('Failed to delete auth share');
    }
  }

  /**
   * Update the authenticated user's profile (displayName, profileImage).
   */
  async updateProfile(patch: { displayName?: string; profileImage?: string }): Promise<AuthUser> {
    const session = this.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await this.apiRequest('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(patch),
      headers: { Authorization: `Bearer ${session.token}` },
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.message || 'Failed to update profile');
    }

    const data = await response.json();
    const newUser = data.user as AuthUser;
    this.updateState({
      user: newUser,
      session: { ...session, user: newUser },
    });
    return newUser;
  }

  /**
   * Refresh the session token
   */
  async refreshSession(): Promise<AuthSession> {
    const session = this.getSession();
    if (!session) throw new Error('No session to refresh');

    const response = await this.apiRequest('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: session.refreshToken }),
    });

    if (!response.ok) {
      this.updateState({ status: 'unauthenticated', session: null, user: null });
      throw new Error('Session expired');
    }

    const data = await response.json();

    const newSession: AuthSession = {
      token: data.token,
      refreshToken: data.refreshToken,
      expiresAt: data.expiresAt,
      user: session.user,
    };

    this.updateState({ session: newSession });
    return newSession;
  }

  /**
   * Log out — clears session state
   */
  async logout(): Promise<void> {
    const session = this.getSession();
    if (session) {
      // Best-effort server logout
      try {
        await this.apiRequest('/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.token}` },
        });
      } catch {
        // Ignore errors on logout
      }
    }

    this.updateState({
      status: 'unauthenticated',
      user: null,
      session: null,
      error: null,
    });

    this.emit('auth:logged_out', this.state);
  }

  /**
   * Restore session from stored tokens
   */
  async restoreSession(session: AuthSession): Promise<boolean> {
    if (Date.now() > session.expiresAt) {
      // Try to refresh
      try {
        this.state.session = session;
        await this.refreshSession();
        return true;
      } catch {
        return false;
      }
    }

    this.updateState({
      status: 'authenticated',
      user: session.user,
      session,
      error: null,
    });

    return true;
  }

  // --- Event system ---

  on(event: AuthEventType, listener: AuthEventListener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
    return () => this.off(event, listener);
  }

  off(event: AuthEventType, listener: AuthEventListener): void {
    this.listeners.get(event)?.delete(listener);
  }

  private emit(event: AuthEventType, state: AuthState): void {
    this.listeners.get(event)?.forEach(fn => fn(state));
  }

  // --- Internal helpers ---

  private updateState(partial: Partial<AuthState>): void {
    this.state = { ...this.state, ...partial };
    this.emit('auth:state_changed', this.state);
  }

  private async apiRequest(
    path: string,
    init: RequestInit & { headers?: Record<string, string> } = {}
  ): Promise<Response> {
    const url = `${this.config.apiBaseUrl}${path}`;
    return fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.config.apiKey,
        'X-Project-ID': this.config.projectId,
        ...init.headers,
      },
    });
  }
}
