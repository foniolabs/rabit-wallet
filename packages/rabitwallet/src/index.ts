/**
 * rabitwallet — the one-package entry point for the Rabit embedded wallet SDK.
 *
 *   npm install rabitwallet
 *
 *   import { RabitProvider, WalletButton, useAuth, PRESET_EVM_CHAINS } from 'rabitwallet';
 *
 * This bundles @rabit/react + @rabit/evm + @rabit/solana under one name. For the
 * full type catalogue, import from 'rabitwallet/types'.
 */

// Full React surface: provider, components, hooks, theming.
export * from '@rabit/react';

// EVM: chain presets, wallet ops, smart-account resolver, viem re-exports.
export * from '@rabit/evm';

// Solana: chain presets, wallet ops, swap.
export * from '@rabit/solana';

// Commonly-referenced config/enum types (the rest live in 'rabitwallet/types').
// Curated to avoid name clashes with symbols re-exported above.
export type {
  RabitConfig,
  AppMetadata,
  ThemeConfig,
  ModalConfig,
  SessionConfig,
  SmartAccountResolver,
  SmartAccountType,
  AuthMethod,
  OAuthProvider,
  ChainEcosystem,
  AccountType,
  FiatCurrency,
  CryptoAsset,
  PaymentMethod,
  PayoutMethod,
} from '@rabit/types';
