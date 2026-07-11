/**
 * rabitwallet-native — the embedded Rabit wallet for React Native & Expo.
 *
 * ⚠️ Scaffold. The core, hooks, storage, provider, and starter components are
 * wired; finish + test in a real RN environment before publishing. See README.
 */

// Provider + context
export { RabitProvider, useRabitContext } from './provider'
export type { RabitProviderProps } from './provider'

// Hooks (auth + wallet shipped; port the rest from @rabit/react/src/hooks)
export { useAuth, useWallet } from './hooks'

// Components
export { WalletButton } from './components/WalletButton'
export { AuthModal } from './components/AuthModal'
export type { AuthModalProps } from './components/AuthModal'

// Storage
export { createMmkvStorage } from './storage'

// Chain presets (same as web)
export {
  PRESET_EVM_CHAINS,
  PRESET_MAINNETS,
  PRESET_TESTNETS,
  ETHEREUM_MAINNET,
  ETHEREUM_SEPOLIA,
  BASE_MAINNET,
  BASE_SEPOLIA,
} from '@rabit/evm'
export { PRESET_SOLANA_CHAINS, SOLANA_MAINNET, SOLANA_DEVNET } from '@rabit/solana'

// Types
export type { RabitConfig, WalletAccount, AuthUser } from '@rabit/types'
