/**
 * Constants and configurations for wallet connectors
 */

/**
 * Default chain configurations
 */
export const DEFAULT_CHAINS = {
  ETHEREUM_MAINNET: 1,
  ETHEREUM_GOERLI: 5,
  ETHEREUM_SEPOLIA: 11155111,
  POLYGON_MAINNET: 137,
  POLYGON_MUMBAI: 80001,
  ARBITRUM_ONE: 42161,
  OPTIMISM: 10,
  BASE: 8453
} as const

/**
 * Wallet download URLs
 */
export const WALLET_DOWNLOAD_URLS = {
  metamask: 'https://metamask.io/download',
  coinbase: 'https://wallet.coinbase.com',
  walletconnect: 'https://walletconnect.com/explorer',
  trust: 'https://trustwallet.com',
  rainbow: 'https://rainbow.me'
} as const

/**
 * Deep link schemes for mobile wallets
 */
export const WALLET_DEEP_LINKS = {
  metamask: 'metamask://',
  coinbase: 'cbwallet://',
  trust: 'trust://',
  rainbow: 'rainbow://',
  argent: 'argent://'
} as const

/**
 * Default RPC URLs (fallbacks)
 */
export const DEFAULT_RPC_URLS = {
  [DEFAULT_CHAINS.ETHEREUM_MAINNET]: 'https://eth.llamarpc.com',
  [DEFAULT_CHAINS.POLYGON_MAINNET]: 'https://polygon.llamarpc.com',
  [DEFAULT_CHAINS.ARBITRUM_ONE]: 'https://arbitrum.llamarpc.com',
  [DEFAULT_CHAINS.OPTIMISM]: 'https://optimism.llamarpc.com',
  [DEFAULT_CHAINS.BASE]: 'https://base.llamarpc.com'
} as const

/**
 * Error codes specific to wallet connections
 */
export const WALLET_ERROR_CODES = {
  USER_REJECTED: 4001,
  UNAUTHORIZED: 4100,
  UNSUPPORTED_METHOD: 4200,
  DISCONNECTED: 4900,
  CHAIN_DISCONNECTED: 4901,
  CHAIN_NOT_ADDED: 4902
} as const

/**
 * Connector timeouts (in milliseconds)
 */
export const CONNECTOR_TIMEOUTS = {
  CONNECTION: 30000,
  RPC_REQUEST: 10000,
  WALLET_DETECTION: 1000
} as const