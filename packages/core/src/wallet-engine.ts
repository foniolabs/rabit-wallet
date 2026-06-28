/**
 * WalletEngine — manages wallet state after authentication
 *
 * Responsibilities:
 * - Key reconstruction from shares (device + auth)
 * - Wallet generation for new users
 * - Account management (EOA ↔ Smart Account switching)
 * - Active chain management
 * - Holds derived keys in memory (never persisted)
 */

import type {
  KeyShare,
  DerivedKeyPair,
  WalletAccount,
  WalletState,
  ChainId,
  AccountType,
  SmartAccountType,
  ChainEcosystem,
  SmartAccountResolver,
  EvmChain,
  SolanaChain,
  SolanaCluster,
} from '@rabit/types';
import {
  generateWallet,
  reconstructWallet,
  deriveAdditionalEvmKey,
  deriveAdditionalSolanaKey,
  storeDeviceShareLocally,
  getLocalDeviceShare,
  removeDeviceShare,
  hexToBytes,
  storePinVault,
  unlockPinVault,
  hasPinVault,
  clearPinVault,
} from '@rabit/keys';
import { AuthEngine } from './auth-engine.js';

export type WalletEventType =
  | 'wallet:state_changed'
  | 'wallet:initialized'
  | 'wallet:account_switched'
  | 'wallet:chain_switched'
  | 'wallet:destroyed';

export type WalletEventListener = (state: WalletState) => void;

export interface WalletEngineConfig {
  /** Default EVM chain ID */
  defaultEvmChainId?: ChainId;
  /** Smart account type preference */
  smartAccountType?: SmartAccountType;
  /** Optional resolver used to populate the smart-account address */
  smartAccountResolver?: SmartAccountResolver;
  /** Initial list of EVM chains the developer enabled */
  evmChains?: EvmChain[];
  /** Initial list of Solana chains the developer enabled */
  solanaChains?: SolanaChain[];
  /** Default Solana cluster */
  defaultSolanaCluster?: SolanaCluster;
}

export class WalletEngine {
  private state: WalletState = {
    accounts: [],
    activeAccount: null,
    activeChainId: null,
    activeSolanaCluster: null,
    activeSolanaChainSlug: null,
    isReady: false,
    isLoading: false,
    isLocked: false,
    hasPin: false,
    needsRecovery: false,
    error: null,
  };

  private evmKeyPair: DerivedKeyPair | null = null;
  private solanaKeyPair: DerivedKeyPair | null = null;
  // Additional accounts beyond index 0, keyed by `${ecosystem}:${index}`.
  private extraKeyPairs: Map<string, DerivedKeyPair> = new Map();
  // Cached shares so derive-additional-account doesn't need to re-fetch.
  // Cleared on lock/destroy.
  private cachedDeviceShare: KeyShare | null = null;
  private cachedAuthShare: KeyShare | null = null;
  private listeners = new Map<WalletEventType, Set<WalletEventListener>>();
  private config: WalletEngineConfig;
  private authEngine: AuthEngine;
  private evmChains: Map<ChainId, EvmChain> = new Map();
  private solanaChains: Map<string, SolanaChain> = new Map();

  constructor(authEngine: AuthEngine, config: WalletEngineConfig = {}) {
    this.authEngine = authEngine;
    this.config = config;
    for (const chain of config.evmChains ?? []) {
      this.evmChains.set(chain.id, chain);
    }
    for (const chain of config.solanaChains ?? []) {
      this.solanaChains.set(chain.slug, chain);
    }
  }

  /** Return all EVM chains currently registered with the wallet. */
  getEvmChains(): EvmChain[] {
    return Array.from(this.evmChains.values());
  }

  /** Look up an EVM chain by id (or undefined if not registered). */
  getEvmChain(chainId: ChainId): EvmChain | undefined {
    return this.evmChains.get(chainId);
  }

  /** Register a new EVM chain at runtime (idempotent). */
  addEvmChain(chain: EvmChain): void {
    this.evmChains.set(chain.id, chain);
    // Re-emit so subscribers refresh their chain pickers.
    this.emit('wallet:state_changed', this.state);
  }

  /** Return all Solana chains currently registered with the wallet. */
  getSolanaChains(): SolanaChain[] {
    return Array.from(this.solanaChains.values());
  }

  /** Look up a Solana chain by slug (or undefined if not registered). */
  getSolanaChain(slug: string): SolanaChain | undefined {
    return this.solanaChains.get(slug);
  }

  /** Register a new Solana chain at runtime (idempotent). */
  addSolanaChain(chain: SolanaChain): void {
    this.solanaChains.set(chain.slug, chain);
    this.emit('wallet:state_changed', this.state);
  }

  /**
   * Switch to a registered Solana chain. The chain must already be registered.
   * Pass either a slug ("solana", "solana-devnet", ...) or a SolanaChain object.
   *
   * If the active account is currently EVM, this also flips the active
   * account to the Solana EOA — otherwise the user changes the network
   * picker and the rest of the UI (token list, send modal) stays stuck on
   * EVM since it keys off `activeAccount.ecosystem`.
   */
  switchSolanaChain(slugOrChain: string | SolanaChain): void {
    const slug = typeof slugOrChain === 'string' ? slugOrChain : slugOrChain.slug;
    const chain = this.solanaChains.get(slug);
    if (!chain) {
      throw new Error(
        `Solana chain "${slug}" is not registered. Call addSolanaChain() first or pass it via RabitConfig.solanaChains.`
      );
    }
    const updates: Partial<WalletState> = {
      activeSolanaCluster: chain.cluster,
      activeSolanaChainSlug: chain.slug,
    };
    if (this.state.activeAccount?.ecosystem !== 'solana') {
      const solanaAccount = this.state.accounts.find((a) => a.ecosystem === 'solana');
      if (solanaAccount) updates.activeAccount = solanaAccount;
    }
    this.updateState(updates);
    this.emit('wallet:chain_switched', this.state);
  }

  /** Get current wallet state */
  getState(): WalletState {
    return { ...this.state };
  }

  /** Get the EVM private key (in memory only) */
  getEvmPrivateKey(): string | null {
    return this.evmKeyPair?.privateKey || null;
  }

  /** Get the Solana private key (in memory only) */
  getSolanaPrivateKey(): string | null {
    return this.solanaKeyPair?.privateKey || null;
  }

  /** Get EVM address */
  getEvmAddress(): string | null {
    return this.evmKeyPair?.address || null;
  }

  /** Get Solana address */
  getSolanaAddress(): string | null {
    return this.solanaKeyPair?.address || null;
  }

  /**
   * Initialize wallet for a new user (signup flow)
   * - Generates fresh wallet
   * - Splits into shares
   * - Stores device share locally, auth share on server
   * - Returns recovery share for user backup
   */
  async initializeNewWallet(): Promise<{ recoveryShare: KeyShare }> {
    this.updateState({ isLoading: true, error: null });

    let stage = 'init';
    try {
      stage = 'generate';
      const result = await generateWallet();

      stage = 'store_device_share';
      const deviceShare = result.shares.find(s => s.type === 'device')!;
      await storeDeviceShareLocally(deviceShare);

      stage = 'store_auth_share';
      const authShare = result.shares.find(s => s.type === 'auth')!;
      await this.authEngine.storeAuthShare(authShare);

      stage = 'derive';
      this.evmKeyPair = result.evmKeyPair;
      this.solanaKeyPair = result.solanaKeyPair;
      this.cachedDeviceShare = deviceShare;
      this.cachedAuthShare = authShare;

      stage = 'build_accounts';
      const accounts = await this.buildAccounts();

      this.updateState({
        accounts,
        activeAccount: accounts[0] || null,
        activeChainId: this.config.defaultEvmChainId || 1,
        activeSolanaCluster: this.resolveDefaultSolanaCluster(),
        activeSolanaChainSlug: this.resolveDefaultSolanaChainSlug(),
        isReady: true,
        isLoading: false,
        isLocked: false,
        hasPin: false,
        needsRecovery: false,
        error: null,
      });

      this.emit('wallet:initialized', this.state);

      const recoveryShare = result.shares.find(s => s.type === 'recovery')!;
      return { recoveryShare };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[WalletEngine] initializeNewWallet failed at stage "${stage}":`, error);
      this.updateState({ isLoading: false, error: { message, stage } });
      throw error;
    }
  }

  /**
   * Reconstruct wallet for existing user (login flow)
   * Uses device share (local) + auth share (from server)
   */
  async reconstructExistingWallet(): Promise<void> {
    this.updateState({ isLoading: true, error: null });

    let stage = 'init';
    try {
      // If a PIN vault exists, don't auto-reconstruct — surface the lock so
      // the UI can prompt for the PIN.
      stage = 'check_pin_vault';
      if (await hasPinVault()) {
        this.updateState({
          isLoading: false,
          isLocked: true,
          hasPin: true,
        });
        return;
      }

      stage = 'load_device_share';
      const deviceShare = await getLocalDeviceShare();
      if (!deviceShare) {
        // No device share + no PIN vault = user is on a new device (or local
        // storage was wiped). Surface this as a recoverable state so the UI
        // can prompt for the recovery share rather than show an error.
        this.updateState({
          isLoading: false,
          needsRecovery: true,
        });
        return;
      }

      stage = 'fetch_auth_share';
      const authShare = await this.authEngine.getAuthShare();

      stage = 'reconstruct';
      const result = await reconstructWallet(deviceShare, authShare);

      this.evmKeyPair = result.evmKeyPair;
      this.solanaKeyPair = result.solanaKeyPair;
      this.cachedDeviceShare = deviceShare;
      this.cachedAuthShare = authShare;

      stage = 'build_accounts';
      const accounts = await this.buildAccounts();

      this.updateState({
        accounts,
        activeAccount: accounts[0] || null,
        activeChainId: this.config.defaultEvmChainId || 1,
        activeSolanaCluster: this.resolveDefaultSolanaCluster(),
        activeSolanaChainSlug: this.resolveDefaultSolanaChainSlug(),
        isReady: true,
        isLoading: false,
        error: null,
      });

      this.emit('wallet:initialized', this.state);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[WalletEngine] reconstructExistingWallet failed at stage "${stage}":`, error);
      this.updateState({ isLoading: false, error: { message, stage } });
      throw error;
    }
  }

  /**
   * Recover wallet using recovery share + auth share
   * (when device share is lost — e.g., new device)
   */
  async recoverWithRecoveryShare(recoveryShare: KeyShare): Promise<void> {
    this.updateState({ isLoading: true });

    try {
      // 1. Get auth share from server (user is already authenticated)
      const authShare = await this.authEngine.getAuthShare();

      // 2. Reconstruct with recovery + auth shares
      const result = await reconstructWallet(recoveryShare, authShare);

      this.evmKeyPair = result.evmKeyPair;
      this.solanaKeyPair = result.solanaKeyPair;

      // 3. Generate new device share and store it
      // We reconstruct the seed from the shares, re-split, and store new device share
      // For now, we store the recovery share as the new device share
      await storeDeviceShareLocally({
        ...recoveryShare,
        type: 'device',
      });

      // 4. Build accounts
      const accounts = await this.buildAccounts();

      this.updateState({
        accounts,
        activeAccount: accounts[0] || null,
        activeChainId: this.config.defaultEvmChainId || 1,
        isReady: true,
        isLoading: false,
        needsRecovery: false,
      });

      this.emit('wallet:initialized', this.state);
    } catch (error) {
      this.updateState({ isLoading: false });
      throw error;
    }
  }

  // === PIN / lock-state management ===

  /**
   * Set a PIN on the local vault. Requires the wallet to be unlocked first
   * (so we have the device share to encrypt). Idempotent: replaces an
   * existing PIN with the new one.
   */
  async setPin(pin: string): Promise<void> {
    if (!pin || pin.length < 4) {
      throw new Error('PIN must be at least 4 digits');
    }

    const deviceShare = await getLocalDeviceShare();
    if (!deviceShare) {
      throw new Error('Cannot set PIN: device share not in storage. Unlock the wallet first.');
    }

    const shareBytes = hexToBytes(deviceShare.data);
    await storePinVault(deviceShare.index, shareBytes, pin);
    // Once the vault exists, drop the plaintext device-share so it can't be
    // recovered without the PIN.
    await removeDeviceShare();
    this.updateState({ hasPin: true });
  }

  /**
   * Remove the PIN protection. Re-stores the share unencrypted (well — still
   * encrypted with the random device key) so the wallet can be auto-unlocked.
   * Requires the wallet to be currently unlocked.
   */
  async removePin(): Promise<void> {
    if (!this.evmKeyPair || this.state.isLocked) {
      throw new Error('Wallet must be unlocked before removing the PIN');
    }
    // Need the in-memory share. The simplest way: ask user to re-derive via the
    // recovery flow. For now, we just clear the vault — the user can re-set the
    // PIN when they want one again.
    await clearPinVault();
    this.updateState({ hasPin: false });
  }

  /**
   * Unlock the wallet using the PIN. Reads the encrypted device share from
   * the vault, fetches the auth share, reconstructs the keys in memory.
   */
  async unlock(pin: string): Promise<void> {
    this.updateState({ isLoading: true, error: null });
    let stage = 'init';
    try {
      stage = 'unlock_vault';
      const { index, dataHex } = await unlockPinVault(pin);

      stage = 'fetch_auth_share';
      const authShare = await this.authEngine.getAuthShare();

      stage = 'reconstruct';
      const deviceShare: KeyShare = { index, type: 'device', data: dataHex, createdAt: 0 };
      const result = await reconstructWallet(deviceShare, authShare);

      this.evmKeyPair = result.evmKeyPair;
      this.solanaKeyPair = result.solanaKeyPair;
      this.cachedDeviceShare = deviceShare;
      this.cachedAuthShare = authShare;

      stage = 'build_accounts';
      const accounts = await this.buildAccounts();

      this.updateState({
        accounts,
        activeAccount: accounts[0] || null,
        activeChainId: this.config.defaultEvmChainId || 1,
        activeSolanaCluster: this.resolveDefaultSolanaCluster(),
        activeSolanaChainSlug: this.resolveDefaultSolanaChainSlug(),
        isReady: true,
        isLoading: false,
        isLocked: false,
        hasPin: true,
        error: null,
      });

      this.emit('wallet:initialized', this.state);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[WalletEngine] unlock failed at stage "${stage}":`, error);
      this.updateState({ isLoading: false, error: { message, stage } });
      throw error;
    }
  }

  /**
   * Lock the wallet — clears keys from memory but keeps the PIN vault on disk.
   */
  lock(): void {
    if (!this.state.hasPin) {
      throw new Error('Cannot lock: no PIN is set');
    }
    this.evmKeyPair = null;
    this.solanaKeyPair = null;
    this.extraKeyPairs.clear();
    this.cachedDeviceShare = null;
    this.cachedAuthShare = null;
    this.updateState({
      accounts: [],
      activeAccount: null,
      activeChainId: null,
      activeSolanaCluster: null,
      activeSolanaChainSlug: null,
      isReady: false,
      isLocked: true,
    });
  }

  /**
   * Derive an additional EVM account from the existing seed. Returns the new
   * WalletAccount; it's also added to `state.accounts` and made active.
   */
  async addEvmAccount(): Promise<WalletAccount> {
    if (!this.cachedDeviceShare || !this.cachedAuthShare) {
      throw new Error('Wallet must be unlocked before adding accounts');
    }
    // The next index is one greater than the highest existing EVM EOA.
    const existingIndices = this.state.accounts
      .filter((a) => a.ecosystem === 'evm' && a.type === 'eoa')
      .map((a) => Number(a.label?.match(/Account (\d+)/)?.[1] ?? 0));
    const nextIndex = Math.max(...existingIndices, 0) + 1;

    const keyPair = await deriveAdditionalEvmKey(
      this.cachedDeviceShare,
      this.cachedAuthShare,
      nextIndex
    );
    this.extraKeyPairs.set(`evm:${nextIndex}`, keyPair);

    const account: WalletAccount = {
      address: keyPair.address,
      ecosystem: 'evm',
      type: 'eoa',
      chainId: this.config.defaultEvmChainId || 1,
      label: `EVM Account ${nextIndex + 1}`,
    };
    this.updateState({
      accounts: [...this.state.accounts, account],
      activeAccount: account,
    });
    return account;
  }

  /**
   * Derive an additional Solana account from the existing seed.
   */
  async addSolanaAccount(): Promise<WalletAccount> {
    if (!this.cachedDeviceShare || !this.cachedAuthShare) {
      throw new Error('Wallet must be unlocked before adding accounts');
    }
    const existingIndices = this.state.accounts
      .filter((a) => a.ecosystem === 'solana' && a.type === 'eoa')
      .map((a) => Number(a.label?.match(/Account (\d+)/)?.[1] ?? 0));
    const nextIndex = Math.max(...existingIndices, 0) + 1;

    const keyPair = await deriveAdditionalSolanaKey(
      this.cachedDeviceShare,
      this.cachedAuthShare,
      nextIndex
    );
    this.extraKeyPairs.set(`solana:${nextIndex}`, keyPair);

    const account: WalletAccount = {
      address: keyPair.address,
      ecosystem: 'solana',
      type: 'eoa',
      label: `Solana Account ${nextIndex + 1}`,
    };
    this.updateState({
      accounts: [...this.state.accounts, account],
      activeAccount: account,
    });
    return account;
  }

  /**
   * Get the private key for the active account — primary or extra.
   */
  getActivePrivateKey(): string | null {
    const active = this.state.activeAccount;
    if (!active) return null;
    if (active.ecosystem === 'evm' && active.address === this.evmKeyPair?.address) {
      return this.evmKeyPair.privateKey;
    }
    if (active.ecosystem === 'solana' && active.address === this.solanaKeyPair?.address) {
      return this.solanaKeyPair.privateKey;
    }
    for (const kp of this.extraKeyPairs.values()) {
      if (kp.address === active.address) return kp.privateKey;
    }
    return null;
  }

  /**
   * Switch active account (e.g., EOA ↔ Smart Account, or EVM ↔ Solana)
   */
  switchAccount(address: string): void {
    const account = this.state.accounts.find(a => a.address === address);
    if (!account) throw new Error(`Account ${address} not found`);

    this.updateState({ activeAccount: account });
    this.emit('wallet:account_switched', this.state);
  }

  /**
   * Switch active EVM chain. The chain must already be registered (either via
   * `RabitConfig.evmChains` or `addEvmChain()`).
   *
   * If the active account is currently Solana, this also flips the active
   * account to an EVM account — see the matching note on switchSolanaChain.
   */
  switchChain(chainId: ChainId): void {
    if (!this.evmChains.has(chainId)) {
      throw new Error(
        `Chain ${chainId} is not registered. Call addEvmChain() first or pass it via RabitConfig.evmChains.`
      );
    }
    const updates: Partial<WalletState> = { activeChainId: chainId };
    if (this.state.activeAccount?.ecosystem !== 'evm') {
      const evmAccount = this.state.accounts.find((a) => a.ecosystem === 'evm');
      if (evmAccount) updates.activeAccount = evmAccount;
    }
    this.updateState(updates);
    this.emit('wallet:chain_switched', this.state);
  }

  /**
   * Destroy wallet — clear keys from memory and remove local data
   */
  async destroy(): Promise<void> {
    // Clear private keys + cached shares from memory
    this.evmKeyPair = null;
    this.solanaKeyPair = null;
    this.extraKeyPairs.clear();
    this.cachedDeviceShare = null;
    this.cachedAuthShare = null;

    // Remove all stored shares (plaintext + PIN vault)
    await removeDeviceShare();
    await clearPinVault();

    this.updateState({
      accounts: [],
      activeAccount: null,
      activeChainId: null,
      activeSolanaCluster: null,
      activeSolanaChainSlug: null,
      isReady: false,
      isLoading: false,
      isLocked: false,
      hasPin: false,
      needsRecovery: false,
    });

    this.emit('wallet:destroyed', this.state);
  }

  // --- Event system ---

  on(event: WalletEventType, listener: WalletEventListener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
    return () => this.off(event, listener);
  }

  off(event: WalletEventType, listener: WalletEventListener): void {
    this.listeners.get(event)?.delete(listener);
  }

  private emit(event: WalletEventType, state: WalletState): void {
    this.listeners.get(event)?.forEach(fn => fn(state));
  }

  // --- Internal ---

  private resolveDefaultSolanaCluster(): SolanaCluster | null {
    if (this.config.defaultSolanaCluster) return this.config.defaultSolanaCluster;
    const first = this.getSolanaChains()[0];
    return first?.cluster ?? null;
  }

  private resolveDefaultSolanaChainSlug(): string | null {
    const cluster = this.resolveDefaultSolanaCluster();
    if (!cluster) return null;
    const match = this.getSolanaChains().find((c) => c.cluster === cluster);
    return match?.slug ?? null;
  }

  private updateState(partial: Partial<WalletState>): void {
    this.state = { ...this.state, ...partial };
    this.emit('wallet:state_changed', this.state);
  }

  private async buildAccounts(): Promise<WalletAccount[]> {
    const accounts: WalletAccount[] = [];
    const chainId = this.config.defaultEvmChainId || 1;

    if (this.evmKeyPair) {
      // EVM EOA
      accounts.push({
        address: this.evmKeyPair.address,
        ecosystem: 'evm',
        type: 'eoa',
        chainId,
        label: 'EVM Account',
      });

      // Smart Account — resolve the counterfactual address via the injected resolver
      if (this.config.smartAccountType) {
        let smartAddress = '';
        let deployed = false;

        if (this.config.smartAccountResolver) {
          try {
            const resolved = await this.config.smartAccountResolver({
              evmPrivateKey: this.evmKeyPair.privateKey,
              chainId,
            });
            smartAddress = resolved.address;
            deployed = resolved.isDeployed;
          } catch (err) {
            // Non-fatal: surface as undeployed smart account with blank address
            console.warn('Smart account resolver failed', err);
          }
        }

        accounts.push({
          address: smartAddress,
          ecosystem: 'evm',
          type: 'smart_account',
          smartAccountType: this.config.smartAccountType,
          chainId,
          isDeployed: deployed,
          label: `Smart Account (${this.config.smartAccountType})`,
        });
      }
    }

    if (this.solanaKeyPair) {
      accounts.push({
        address: this.solanaKeyPair.address,
        ecosystem: 'solana',
        type: 'eoa',
        label: 'Solana Account',
      });
    }

    return accounts;
  }
}
