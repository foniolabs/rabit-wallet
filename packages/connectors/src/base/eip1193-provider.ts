/**
 * EIP-1193 Ethereum Provider Interface
 * Standard interface for Ethereum wallet providers
 */

export interface EIP1193Provider {
  /**
   * Request method for RPC calls
   */
  request(args: EIP1193RequestArguments): Promise<unknown>
  
  /**
   * Event listeners
   */
  on?(eventName: string, listener: (...args: any[]) => void): void
  removeListener?(eventName: string, listener: (...args: any[]) => void): void
  
  /**
   * Provider identification
   */
  isMetaMask?: boolean
  isCoinbaseWallet?: boolean
  isRabby?: boolean
  isTrust?: boolean
  isBraveWallet?: boolean
  
  /**
   * Provider chain ID (optional)
   */
  chainId?: string
  
  /**
   * Network version (legacy)
   */
  networkVersion?: string
  
  /**
   * Selected address (legacy)
   */
  selectedAddress?: string | null
  
  /**
   * Multiple providers (Coinbase specific)
   */
  providers?: EIP1193Provider[]
}

export interface EIP1193RequestArguments {
  readonly method: string
  readonly params?: readonly unknown[] | object
}

export interface EIP1193ProviderRpcError extends Error {
  code: number
  data?: unknown
}

export interface EIP1193ConnectInfo {
  chainId: string
}

export interface EIP1193ProviderMessage {
  readonly type: string
  readonly data: unknown
}

/**
 * Standard RPC methods
 */
export const EIP1193_METHODS = {
  // Account methods
  REQUEST_ACCOUNTS: 'eth_requestAccounts',
  ACCOUNTS: 'eth_accounts',
  
  // Chain methods
  CHAIN_ID: 'eth_chainId',
  
  // Transaction methods
  SEND_TRANSACTION: 'eth_sendTransaction',
  SIGN_TRANSACTION: 'eth_signTransaction',
  
  // Signing methods
  SIGN: 'eth_sign',
  PERSONAL_SIGN: 'personal_sign',
  SIGN_TYPED_DATA: 'eth_signTypedData_v4',
  
  // Network methods
  ADD_ETHEREUM_CHAIN: 'wallet_addEthereumChain',
  SWITCH_ETHEREUM_CHAIN: 'wallet_switchEthereumChain',
  
  // Permission methods
  REQUEST_PERMISSIONS: 'wallet_requestPermissions',
  GET_PERMISSIONS: 'wallet_getPermissions',
  
  // Asset methods
  WATCH_ASSET: 'wallet_watchAsset'
} as const

/**
 * Standard events
 */
export const EIP1193_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ACCOUNTS_CHANGED: 'accountsChanged',
  CHAIN_CHANGED: 'chainChanged',
  MESSAGE: 'message'
} as const