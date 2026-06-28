/**
 * @rabit/react — React SDK for Rabit embedded wallet
 *
 * Usage:
 *   import { RabitProvider, WalletButton, useAuth, useWallet } from '@rabit/react';
 *
 *   function App() {
 *     return (
 *       <RabitProvider config={config}>
 *         <WalletButton />
 *       </RabitProvider>
 *     );
 *   }
 */

// Provider
export { RabitProvider, useRabitContext } from './provider.js';
export type { RabitProviderProps } from './provider.js';

// Components
export { AuthModal } from './components/AuthModal.js';
export type { AuthModalProps } from './components/AuthModal.js';
export { WalletButton } from './components/WalletButton.js';
export type { WalletButtonProps } from './components/WalletButton.js';
export { RabitDashboard } from './components/RabitDashboard.js';
export type { RabitDashboardProps } from './components/RabitDashboard.js';
export { NetworkSwitcher } from './components/NetworkSwitcher.js';
export type { NetworkSwitcherProps } from './components/NetworkSwitcher.js';
export { PrivateKeyExport } from './components/PrivateKeyExport.js';
export type { PrivateKeyExportProps } from './components/PrivateKeyExport.js';
export { TokenList } from './components/TokenList.js';
export type { TokenListProps } from './components/TokenList.js';
export { SendModal } from './components/SendModal.js';
export type { SendModalProps } from './components/SendModal.js';
export { TransactionPreview } from './components/TransactionPreview.js';
export type { TransactionPreviewProps, PreviewParam } from './components/TransactionPreview.js';
export { PinSetup } from './components/PinSetup.js';
export type { PinSetupProps } from './components/PinSetup.js';
export { PinUnlock } from './components/PinUnlock.js';
export type { PinUnlockProps } from './components/PinUnlock.js';
export { RecoveryUnlock } from './components/RecoveryUnlock.js';
export type { RecoveryUnlockProps } from './components/RecoveryUnlock.js';
export { PinPad } from './components/PinPad.js';
export type { PinPadProps } from './components/PinPad.js';

// Theming
export { useTheme, buildTheme } from './theme.js';
export type { ResolvedTheme } from './theme.js';

// Hooks
export { useAuth } from './hooks/useAuth.js';
export type { UseAuthReturn } from './hooks/useAuth.js';
export { useWallet } from './hooks/useWallet.js';
export type { UseWalletReturn } from './hooks/useWallet.js';
export { useOnRamp } from './hooks/useOnRamp.js';
export type { UseOnRampReturn } from './hooks/useOnRamp.js';
export { useChains } from './hooks/useChains.js';
export type { UseChainsReturn } from './hooks/useChains.js';
export { useSolanaChains } from './hooks/useSolanaChains.js';
export type { UseSolanaChainsReturn } from './hooks/useSolanaChains.js';
export { useBalances } from './hooks/useBalances.js';
export type { UseBalancesReturn, UseBalancesOptions, UnifiedBalance } from './hooks/useBalances.js';
export { useSendToken } from './hooks/useSendToken.js';
export type { UseSendTokenReturn, SendArgs } from './hooks/useSendToken.js';
export { useContractRead } from './hooks/useContractRead.js';
export type { UseContractReadArgs, UseContractReadReturn } from './hooks/useContractRead.js';
export { useContractWrite } from './hooks/useContractWrite.js';
export type {
  UseContractWriteReturn,
  ContractWriteArgs,
} from './hooks/useContractWrite.js';
export { useSolanaMemo } from './hooks/useSolanaMemo.js';
export type { UseSolanaMemoReturn } from './hooks/useSolanaMemo.js';
export { useCustomTokens } from './hooks/useCustomTokens.js';
export type { UseCustomTokensReturn } from './hooks/useCustomTokens.js';
export { useAddressBook } from './hooks/useAddressBook.js';
export type { UseAddressBookReturn, AddressBookEntry } from './hooks/useAddressBook.js';
export { useNetworkStatus } from './hooks/useNetworkStatus.js';
export type { NetworkStatus, UseNetworkStatusOptions } from './hooks/useNetworkStatus.js';
export { useEvmFeeEstimate, useSolanaFeeEstimate } from './hooks/useFeeEstimate.js';
export type { UseFeeEstimateReturn, EvmEstimateArgs } from './hooks/useFeeEstimate.js';
export type { FeeEstimate } from './components/TransactionPreview.js';
export { useSignMessage } from './hooks/useSignMessage.js';
export type { UseSignMessageReturn } from './hooks/useSignMessage.js';
export { evaluateSafety, APPROVAL_MAX_UINT256 } from './lib/safety.js';
export type { SafetyContext } from './lib/safety.js';
export { usePortfolioTotal } from './hooks/usePortfolioTotal.js';
export type { PortfolioTotalResult } from './hooks/usePortfolioTotal.js';
export { PortfolioTotal } from './components/PortfolioTotal.js';
export type { PortfolioTotalProps } from './components/PortfolioTotal.js';
export { useSwap } from './hooks/useSwap.js';
export type { UseSwapReturn, SwapQuote, SwapTokenSpec } from './hooks/useSwap.js';
export { SwapPanel } from './components/SwapPanel.js';
export { useActivity } from './hooks/useActivity.js';
export type { UseActivityReturn, ActivityEntry, ActivityKind } from './hooks/useActivity.js';
export { ActivityFeed } from './components/ActivityFeed.js';
export type { ActivityFeedProps } from './components/ActivityFeed.js';
