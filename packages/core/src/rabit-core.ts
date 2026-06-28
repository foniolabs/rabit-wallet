/**
 * RabitCore — main SDK entry point
 *
 * Orchestrates AuthEngine + WalletEngine to provide the full lifecycle:
 * 1. Configure SDK
 * 2. Authenticate (email/OAuth)
 * 3. Initialize or reconstruct wallet
 * 4. Interact (send tx, switch chains, on-ramp, etc.)
 * 5. Logout
 */

import type {
  RabitConfig,
  AuthState,
  AuthSession,
  WalletState,
  KeyShare,
  ChainId,
  EvmChain,
  SolanaChain,
} from '@rabit/types';
import {
  hasDeviceShare,
  exportEvmPrivateKey,
  exportSolanaSecretKeyBase58,
  exportSolanaSecretKeyArray,
} from '@rabit/keys';
import { AuthEngine, type AuthEngineConfig } from './auth-engine.js';
import { WalletEngine, type WalletEngineConfig } from './wallet-engine.js';

const DEFAULT_API_BASE_URL = 'https://api.rabit.com';
const SESSION_STORAGE_KEY = 'rabit:session';

export type RabitEventType =
  | 'ready'
  | 'auth:changed'
  | 'wallet:changed'
  | 'error';

export type RabitEventListener = (data: unknown) => void;

export class RabitCore {
  private authEngine: AuthEngine;
  private walletEngine: WalletEngine;
  private config: RabitConfig;
  private listeners = new Map<RabitEventType, Set<RabitEventListener>>();

  constructor(config: RabitConfig) {
    this.config = config;

    const authConfig: AuthEngineConfig = {
      apiBaseUrl: config.apiBaseUrl || DEFAULT_API_BASE_URL,
      apiKey: config.apiKey,
      projectId: config.projectId,
    };
    this.authEngine = new AuthEngine(authConfig);

    const walletConfig: WalletEngineConfig = {
      defaultEvmChainId: config.defaultEvmChainId,
      smartAccountType: config.smartAccountType,
      smartAccountResolver: config.smartAccountResolver,
      evmChains: config.evmChains,
      solanaChains: config.solanaChains,
      defaultSolanaCluster: config.defaultSolanaCluster,
    };
    this.walletEngine = new WalletEngine(this.authEngine, walletConfig);

    // Forward events
    this.authEngine.on('auth:state_changed', (state) => {
      this.emit('auth:changed', state);
      // Persist the JWT to localStorage on every auth change so a refresh
      // can restore the session without re-authenticating.
      this.persistSession(state.session ?? null);
    });

    this.walletEngine.on('wallet:state_changed', (state) => {
      this.emit('wallet:changed', state);
    });
  }

  // === Session persistence ===

  private getStorage(): Storage | null {
    try {
      return typeof window !== 'undefined' ? window.localStorage : null;
    } catch {
      return null;
    }
  }

  private persistSession(session: AuthSession | null): void {
    const storage = this.getStorage();
    if (!storage) return;
    try {
      if (session && session.expiresAt > Date.now()) {
        storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
      } else {
        storage.removeItem(SESSION_STORAGE_KEY);
      }
    } catch {/* quota / privacy mode — silently skip */}
  }

  private loadPersistedSession(): AuthSession | null {
    const storage = this.getStorage();
    if (!storage) return null;
    try {
      const raw = storage.getItem(SESSION_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as AuthSession;
      if (!parsed.token || !parsed.expiresAt) return null;
      // Soft expiry guard — drop ones already past expiry instead of
      // letting the auth-engine try to refresh a long-dead token.
      if (parsed.expiresAt < Date.now() - 7 * 24 * 60 * 60 * 1000) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  /**
   * Read any persisted session from localStorage and try to restore it.
   * Returns true if successfully restored, false otherwise.
   *
   * Call this once on app boot from your provider.
   */
  async tryRestoreSession(): Promise<boolean> {
    const session = this.loadPersistedSession();
    if (!session) return false;
    return this.tryAutoLogin(session);
  }

  // === Public API ===

  get auth(): AuthState {
    return this.authEngine.getState();
  }

  get wallet(): WalletState {
    return this.walletEngine.getState();
  }

  get isReady(): boolean {
    return this.authEngine.isAuthenticated() && this.walletEngine.getState().isReady;
  }

  get evmAddress(): string | null {
    return this.walletEngine.getEvmAddress();
  }

  get solanaAddress(): string | null {
    return this.walletEngine.getSolanaAddress();
  }

  // --- Auth Methods ---

  async sendOTP(email: string): Promise<void> {
    return this.authEngine.sendOTP(email);
  }

  async verifyOTP(
    email: string,
    code: string,
    options?: { displayName?: string }
  ): Promise<{
    isNewUser: boolean;
    recoveryShare?: KeyShare;
  }> {
    const result = await this.authEngine.verifyOTP(email, code, options);
    return this.afterAuthentication(result);
  }

  /**
   * Update the authenticated user's profile fields.
   */
  updateProfile(patch: { displayName?: string; profileImage?: string }): Promise<unknown> {
    return this.authEngine.updateProfile(patch);
  }

  async authenticateOAuth(provider: 'google' | 'apple' | 'twitter', idToken: string): Promise<{
    isNewUser: boolean;
    recoveryShare?: KeyShare;
  }> {
    const result = await this.authEngine.authenticateOAuth(provider, idToken);
    return this.afterAuthentication(result);
  }

  /**
   * Decides which wallet path to take after the auth call returns.
   *
   * - `isNewUser=true`            → first signup, generate a fresh wallet.
   * - `authShare=null`            → user exists but the previous signup never finished
   *                                 storing the auth share; treat as fresh too.
   * - otherwise                   → reconstruct from device + auth shares.
   */
  private async afterAuthentication(result: {
    isNewUser: boolean;
    authShare: KeyShare | null;
  }): Promise<{ isNewUser: boolean; recoveryShare?: KeyShare }> {
    const needsFreshWallet = result.isNewUser || !result.authShare;

    if (needsFreshWallet) {
      const { recoveryShare } = await this.walletEngine.initializeNewWallet();
      this.emit('ready', null);
      return { isNewUser: result.isNewUser, recoveryShare };
    }

    await this.walletEngine.reconstructExistingWallet();
    this.emit('ready', null);
    return { isNewUser: false };
  }

  async recoverWallet(recoveryShare: KeyShare): Promise<void> {
    if (!this.authEngine.isAuthenticated()) {
      throw new Error('Must be authenticated before recovering wallet');
    }
    await this.walletEngine.recoverWithRecoveryShare(recoveryShare);
    this.emit('ready', null);
  }

  // --- Wallet Methods ---

  switchAccount(address: string): void {
    this.walletEngine.switchAccount(address);
  }

  switchChain(chainId: ChainId): void {
    this.walletEngine.switchChain(chainId);
  }

  /** All EVM chains currently registered with the SDK. */
  getEvmChains(): EvmChain[] {
    return this.walletEngine.getEvmChains();
  }

  /** Look up a single EVM chain by id. */
  getEvmChain(chainId: ChainId): EvmChain | undefined {
    return this.walletEngine.getEvmChain(chainId);
  }

  /** Register a new EVM chain at runtime. */
  addEvmChain(chain: EvmChain): void {
    this.walletEngine.addEvmChain(chain);
  }

  /** All Solana chains currently registered with the SDK. */
  getSolanaChains(): SolanaChain[] {
    return this.walletEngine.getSolanaChains();
  }

  /** Look up a single Solana chain by slug. */
  getSolanaChain(slug: string): SolanaChain | undefined {
    return this.walletEngine.getSolanaChain(slug);
  }

  /** Register a new Solana chain at runtime. */
  addSolanaChain(chain: SolanaChain): void {
    this.walletEngine.addSolanaChain(chain);
  }

  /** Switch the active Solana chain. */
  switchSolanaChain(slugOrChain: string | SolanaChain): void {
    this.walletEngine.switchSolanaChain(slugOrChain);
  }

  // === PIN / lock-state management ===

  /** Set a PIN on this device's vault (4+ digits). Wallet must be unlocked. */
  setPin(pin: string): Promise<void> {
    return this.walletEngine.setPin(pin);
  }

  /** Remove the local PIN. Wallet must be unlocked. */
  removePin(): Promise<void> {
    return this.walletEngine.removePin();
  }

  /** Unlock the wallet using the PIN. */
  unlock(pin: string): Promise<void> {
    return this.walletEngine.unlock(pin);
  }

  /** Lock the wallet — clears keys from memory but keeps the vault. */
  lock(): void {
    this.walletEngine.lock();
  }

  /** Derive a new EVM account from the existing seed and make it active. */
  addEvmAccount() {
    return this.walletEngine.addEvmAccount();
  }

  /** Derive a new Solana account from the existing seed and make it active. */
  addSolanaAccount() {
    return this.walletEngine.addSolanaAccount();
  }

  /** Private key for the currently-active account (primary or derived). */
  getActivePrivateKey(): string | null {
    return this.walletEngine.getActivePrivateKey();
  }

  getEvmPrivateKey(): string | null {
    return this.walletEngine.getEvmPrivateKey();
  }

  getSolanaPrivateKey(): string | null {
    return this.walletEngine.getSolanaPrivateKey();
  }

  /**
   * Export the EVM EOA private key as a `0x`-prefixed hex string.
   * Format is compatible with MetaMask, Rabby, Frame, etc.
   * Returns null if the wallet isn't unlocked.
   */
  exportEvmPrivateKey(): string | null {
    const pk = this.walletEngine.getEvmPrivateKey();
    return pk ? exportEvmPrivateKey(pk) : null;
  }

  /**
   * Export the Solana secret key in base58 form.
   * Format is compatible with Phantom, Solflare, Backpack.
   * Returns null if the wallet isn't unlocked.
   */
  exportSolanaPrivateKey(): string | null {
    const pk = this.walletEngine.getSolanaPrivateKey();
    return pk ? exportSolanaSecretKeyBase58(pk) : null;
  }

  /**
   * Export the Solana secret key as a `[u8; 64]` JSON byte array.
   * Compatible with the Solana CLI keypair file format.
   * Returns null if the wallet isn't unlocked.
   */
  exportSolanaPrivateKeyArray(): number[] | null {
    const pk = this.walletEngine.getSolanaPrivateKey();
    return pk ? exportSolanaSecretKeyArray(pk) : null;
  }

  // --- Lifecycle ---

  async tryAutoLogin(storedSession: { token: string; refreshToken: string; expiresAt: number; user: unknown }): Promise<boolean> {
    try {
      const restored = await this.authEngine.restoreSession(storedSession as any);
      if (!restored) return false;

      const hasShare = await hasDeviceShare();
      if (!hasShare) return false;

      await this.walletEngine.reconstructExistingWallet();
      this.emit('ready', null);
      return true;
    } catch {
      return false;
    }
  }

  async logout(): Promise<void> {
    await this.walletEngine.destroy();
    await this.authEngine.logout();
  }

  /**
   * Reset the wallet: wipes the server-side auth share AND all local state
   * (device share, PIN vault, session). The next sign-in for the same user
   * starts fresh as if they're a new signup.
   *
   * Use this only when the user has confirmed they understand they're
   * abandoning any on-chain assets in the previous wallet.
   */
  async resetWallet(): Promise<void> {
    // Best-effort delete of the server share. Local cleanup must run even if
    // the server call fails (e.g. session already expired).
    try {
      await this.authEngine.deleteAuthShare();
    } catch (err) {
      console.warn('[Rabit] deleteAuthShare failed during reset; continuing local cleanup', err);
    }
    await this.walletEngine.destroy();
    await this.authEngine.logout();
  }

  async destroy(): Promise<void> {
    await this.walletEngine.destroy();
    this.listeners.clear();
  }

  // --- Events ---

  on(event: RabitEventType, listener: RabitEventListener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
    return () => this.off(event, listener);
  }

  off(event: RabitEventType, listener: RabitEventListener): void {
    this.listeners.get(event)?.delete(listener);
  }

  private emit(event: RabitEventType, data: unknown): void {
    this.listeners.get(event)?.forEach(fn => fn(data));
  }
}

/**
 * Create a Rabit SDK instance
 */
export function createRabit(config: RabitConfig): RabitCore {
  return new RabitCore(config);
}
