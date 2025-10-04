// Main exports
export { RabitProvider } from './providers/RabitProvider';
export { WalletProvider } from './providers/WalletProvider';
export { SmartAccountProvider } from './providers/SmartAccountProvider';
export { AuthProvider } from './providers/AuthProvider';
export { ThemeProvider } from './providers/ThemeProvider';
export { ModalProvider } from './providers/ModalProvider';

// Components
export { ConnectButton } from './components/ConnectButton';
export { WalletSelector } from './components/WalletSelector';
export { AccountModal } from './components/AccountModal';
export { NetworkSwitcher } from './components/NetworkSwitcher';
export { SocialAuth } from './components/SocialAuth';
export { TransactionModal } from './components/TransactionModal';
export { WalletButton } from './components/WalletButton';

// Hooks
export { useWallet } from './hooks/useWallet';
export { useAccount } from './hooks/useAccount';
export { useConnect } from './hooks/useConnect';
export { useDisconnect } from './hooks/useDisconnect';
export { useBalance } from './hooks/useBalance';
export { useNetwork } from './hooks/useNetwork';
export { useSmartAccount } from './hooks/useSmartAccount';
export { useAuth } from './hooks/useAuth';
export { useSocialAuth } from './hooks/useSocialAuth';
export { useTransaction } from './hooks/useTransaction';

// Themes
export { lightTheme, darkTheme, createTheme } from './themes';
export { blueTheme, greenTheme, purpleTheme, roundedTheme, compactTheme } from './themes/variants';

// Types
export type { 
  Theme, 
  ThemeMode,
  RabitConfig, 
  WalletConfig, 
  AuthConfig,
  SmartAccountConfig,
  WalletState,
  SmartAccountState,
  AuthState,
  User,
  SocialProvider,
  ConnectorInfo
} from './types';

// Utils
export {
  formatAddress,
  formatBalance,
  formatCurrency,
  formatTimeAgo,
  isValidAddress,
  isValidTxHash,
  isValidChainId,
  isValidUrl,
  isValidEmail,
  isValidNumber,
  isPositiveNumber,
  copyToClipboard,
  getExplorerUrl,
  debounce,
  sleep,
  generateId,
  isBrowser,
  isMobile,
  getStorageItem,
  setStorageItem,
  removeStorageItem,
  getStorageObject,
  setStorageObject,
} from './utils';

// Constants
export {
  RABIT_STORAGE_KEYS,
  SUPPORTED_CHAINS,
  EXPLORER_URLS,
  CHAIN_NAMES,
  POPULAR_CONNECTORS,
  SOCIAL_PROVIDERS,
  ANIMATION_DURATIONS,
  BREAKPOINTS,
} from './utils/constants';

// CSS - Import this in your app
import './styles/globals.css';
