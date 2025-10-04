/**
 * @rabit/connectors - Wallet connectors for Rabit
 * The wallet connector that actually works
 */

// Version export
export const version = '0.0.0'

// Base classes
export { BaseWalletConnector } from './base/index.js'
export type { EIP1193Provider, EIP1193RequestArguments } from './base/eip1193-provider.js'

// Connector implementations
export { MetaMaskConnector } from './implementations/metamask.js'
export { CoinbaseWalletConnector } from './implementations/coinbase.js'
export type { CoinbaseWalletConfig } from './implementations/coinbase.js'
export { WalletConnectConnector } from './implementations/walletconnect.js'
export type { WalletConnectConfig } from './implementations/walletconnect.js'
export { InjectedConnector } from './implementations/injected.js'
export type { InjectedConnectorConfig } from './implementations/injected.js'
export { SafeConnector } from './implementations/safe.js'
export { MockConnector } from './implementations/mock.js'
export type { MockConnectorConfig } from './implementations/mock.js'

// Utilities
export {
  detectMetaMask,
  detectCoinbaseWallet,
  detectInjectedWallet,
  detectAllWallets,
  isMobile,
  isIOS,
  isAndroid
} from './utils/detection.js'

export {
  DEFAULT_CHAINS,
  WALLET_DOWNLOAD_URLS,
  WALLET_DEEP_LINKS,
  DEFAULT_RPC_URLS,
  WALLET_ERROR_CODES,
  CONNECTOR_TIMEOUTS
} from './utils/constants.js'

export {
  ConnectorError,
  WalletConnectionError,
  WalletNotSupportedError,
  ChainSwitchError,
  SignatureError
} from './utils/errors.js'

// Re-export types from @rabit/types for convenience
export type {
  WalletConnector,
  WalletType,
  ConnectionMethod,
  ConnectOptions,
  ConnectResult,
  WalletAvailability,
  WalletFeatures,
  TransactionRequest,
  Chain,
  Address,
  ChainId,
  Hash,
  Hex
} from '@rabit/types'

// Import connector classes for createConnectors function
import { MetaMaskConnector } from './implementations/metamask.js'
import { CoinbaseWalletConnector } from './implementations/coinbase.js'
import { InjectedConnector } from './implementations/injected.js'
import { SafeConnector } from './implementations/safe.js'
import { WalletConnectConnector } from './implementations/walletconnect.js'
import type { WalletConnectConfig } from './implementations/walletconnect.js'
import type { CoinbaseWalletConfig } from './implementations/coinbase.js'

/**
 * Create a connector factory for easy setup
 */
export function createConnectors(config?: {
  walletConnect?: WalletConnectConfig
  coinbase?: CoinbaseWalletConfig
}): (MetaMaskConnector | CoinbaseWalletConnector | InjectedConnector | SafeConnector | WalletConnectConnector)[] {
  const connectors: (MetaMaskConnector | CoinbaseWalletConnector | InjectedConnector | SafeConnector | WalletConnectConnector)[] = [
    new MetaMaskConnector(),
    new CoinbaseWalletConnector(config?.coinbase),
    new InjectedConnector(),
    new SafeConnector()
  ]

  if (config?.walletConnect) {
    connectors.push(new WalletConnectConnector(config.walletConnect))
  }

  return connectors
}