/**
 * src/utils/constants.ts
 * Smart Account Constants
 */
import { Address } from '@rabit/types'

// Entry Point Addresses
export const ENTRY_POINT_V06_ADDRESS = '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789' as Address
export const ENTRY_POINT_V07_ADDRESS = '0x0000000071727De22E5E9d8BAf0edAc6f37da032' as Address

// Default Entry Point (most commonly used)
export const DEFAULT_ENTRY_POINT_ADDRESS = ENTRY_POINT_V06_ADDRESS

// Smart Account Factory Addresses
export const SAFE_FACTORY_ADDRESS = '0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2' as Address
export const KERNEL_FACTORY_ADDRESS = '0x5de4839a76cf55d0c90e2061ef4386d962E15ae3' as Address
export const LIGHT_ACCOUNT_FACTORY_ADDRESS = '0x00004EC70002a32400f8ae005A26081065620D20' as Address
export const BICONOMY_FACTORY_ADDRESS = '0x000000a56Aaca3e9a4C479ea6b6CD0DbcB6634F5' as Address
export const SIMPLE_ACCOUNT_FACTORY_ADDRESS = '0x9406Cc6185a346906296840746125a0E44976454' as Address

// Smart Account Implementation Addresses
export const SAFE_IMPLEMENTATION_ADDRESS = '0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552' as Address
export const KERNEL_IMPLEMENTATION_ADDRESS = '0x0DA6a956B9488eD4dd761E59f52FDc6c8068E6B5' as Address
export const LIGHT_ACCOUNT_IMPLEMENTATION_ADDRESS = '0xae8c656ad28F2B59a196AB61815C16A0AE1c3cba' as Address

// Validator Addresses
export const KERNEL_ECDSA_VALIDATOR_ADDRESS = '0xd9AB5096a832b9ce79914329DAEE236f8Eea0390' as Address
export const KERNEL_WEBAUTHN_VALIDATOR_ADDRESS = '0x8104e3Ad430EA6d354d013A6789fDFc71E671c43' as Address
export const KERNEL_MULTISIG_VALIDATOR_ADDRESS = '0x8104e3Ad430EA6d354d013A6789fDFc71E671c43' as Address

// Gas Limits
export const DEFAULT_VERIFICATION_GAS_LIMIT = 100000n
export const DEFAULT_CALL_GAS_LIMIT = 50000n
export const DEFAULT_PRE_VERIFICATION_GAS = 21000n
export const MAX_VERIFICATION_GAS_LIMIT = 10000000n
export const MAX_CALL_GAS_LIMIT = 10000000n

// Gas Prices (in wei)
export const DEFAULT_MAX_FEE_PER_GAS = 20000000000n // 20 gwei
export const DEFAULT_MAX_PRIORITY_FEE_PER_GAS = 2000000000n // 2 gwei

// Chain IDs
export const MAINNET_CHAIN_ID = 1
export const GOERLI_CHAIN_ID = 5
export const SEPOLIA_CHAIN_ID = 11155111
export const POLYGON_CHAIN_ID = 137
export const MUMBAI_CHAIN_ID = 80001
export const OPTIMISM_CHAIN_ID = 10
export const OPTIMISM_GOERLI_CHAIN_ID = 420
export const ARBITRUM_CHAIN_ID = 42161
export const ARBITRUM_GOERLI_CHAIN_ID = 421613
export const BASE_CHAIN_ID = 8453
export const BASE_GOERLI_CHAIN_ID = 84531
export const BSC_CHAIN_ID = 56
export const AVALANCHE_CHAIN_ID = 43114

// Supported Chains
export const SUPPORTED_CHAINS = [
  MAINNET_CHAIN_ID,
  GOERLI_CHAIN_ID,
  SEPOLIA_CHAIN_ID,
  POLYGON_CHAIN_ID,
  MUMBAI_CHAIN_ID,
  OPTIMISM_CHAIN_ID,
  OPTIMISM_GOERLI_CHAIN_ID,
  ARBITRUM_CHAIN_ID,
  ARBITRUM_GOERLI_CHAIN_ID,
  BASE_CHAIN_ID,
  BASE_GOERLI_CHAIN_ID,
  BSC_CHAIN_ID,
  AVALANCHE_CHAIN_ID
] as const

// Chain Configurations
export const CHAIN_CONFIGS = {
  [MAINNET_CHAIN_ID]: {
    name: 'Ethereum Mainnet',
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: 'https://cloudflare-eth.com',
    blockExplorer: 'https://etherscan.io',
    entryPoint: ENTRY_POINT_V06_ADDRESS
  },
  [POLYGON_CHAIN_ID]: {
    name: 'Polygon',
    symbol: 'MATIC',
    decimals: 18,
    rpcUrl: 'https://polygon-rpc.com',
    blockExplorer: 'https://polygonscan.com',
    entryPoint: ENTRY_POINT_V06_ADDRESS
  },
  [OPTIMISM_CHAIN_ID]: {
    name: 'Optimism',
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: 'https://mainnet.optimism.io',
    blockExplorer: 'https://optimistic.etherscan.io',
    entryPoint: ENTRY_POINT_V06_ADDRESS
  },
  [ARBITRUM_CHAIN_ID]: {
    name: 'Arbitrum One',
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    blockExplorer: 'https://arbiscan.io',
    entryPoint: ENTRY_POINT_V06_ADDRESS
  },
  [BASE_CHAIN_ID]: {
    name: 'Base',
    symbol: 'ETH',
    decimals: 18,
    rpcUrl: 'https://mainnet.base.org',
    blockExplorer: 'https://basescan.org',
    entryPoint: ENTRY_POINT_V06_ADDRESS
  }
} as const

// Error Codes
export const ERROR_CODES = {
  // UserOperation errors
  INVALID_USER_OPERATION: 'INVALID_USER_OPERATION',
  INSUFFICIENT_GAS: 'INSUFFICIENT_GAS',
  INVALID_SIGNATURE: 'INVALID_SIGNATURE',
  INVALID_PAYMASTER: 'INVALID_PAYMASTER',
  
  // Account errors
  ACCOUNT_NOT_DEPLOYED: 'ACCOUNT_NOT_DEPLOYED',
  INVALID_ACCOUNT_TYPE: 'INVALID_ACCOUNT_TYPE',
  SIGNER_NOT_CONFIGURED: 'SIGNER_NOT_CONFIGURED',
  
  // Provider errors
  PROVIDER_ERROR: 'PROVIDER_ERROR',
  BUNDLER_ERROR: 'BUNDLER_ERROR',
  PAYMASTER_ERROR: 'PAYMASTER_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  
  // Validation errors
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  INVALID_ADDRESS: 'INVALID_ADDRESS',
  INVALID_CHAIN_ID: 'INVALID_CHAIN_ID'
} as const

// Function Selectors
export const FUNCTION_SELECTORS = {
  // ERC-20
  TRANSFER: '0xa9059cbb',
  TRANSFER_FROM: '0x23b872dd',
  APPROVE: '0x095ea7b3',
  BALANCE_OF: '0x70a08231',
  
  // Account functions
  EXECUTE: '0xb61d27f6',
  EXECUTE_BATCH: '0x18dfb3c7',
  VALIDATE_USER_OP: '0x3a871cdd',
  
  // Kernel functions
  EXECUTE_USER_OP: '0x1fad948c',
  EXECUTE_DELEGATECALL: '0x47e1da2a',
  
  // Safe functions
  EXEC_TRANSACTION: '0x6a761202',
  EXEC_TRANSACTION_FROM_MODULE: '0x468721a7'
} as const

// Event Signatures
export const EVENT_SIGNATURES = {
  USER_OPERATION_EVENT: '0x49628fd1471006c1482da88028e9ce4dbb080b815c9b0344d39e5a8e6ec1419f',
  ACCOUNT_DEPLOYED: '0x2ac69ee804d9a7a0984249f508dfab7cb2534b465b6ce1580f99a38ba9c5e631',
  SESSION_KEY_ADDED: '0x8b87f5b5c0d8e0d1a8b6e3c4e8a4e5e7a1a3a6e9e1e8e6e4e2e0e8e6e4e2e0',
  SPENDING_LIMIT_UPDATED: '0x9d8b1e3e6e8e6e4e2e0e8e6e4e2e0e8e6e4e2e0e8e6e4e2e0e8e6e4e2e0'
} as const

// Time Constants (in seconds)
export const TIME_CONSTANTS = {
  MINUTE: 60,
  HOUR: 60 * 60,
  DAY: 24 * 60 * 60,
  WEEK: 7 * 24 * 60 * 60,
  MONTH: 30 * 24 * 60 * 60,
  YEAR: 365 * 24 * 60 * 60
} as const

// Storage Keys
export const STORAGE_KEYS = {
  EMBEDDED_WALLET: 'rabit_embedded_wallet',
  SESSION_KEYS: 'rabit_session_keys',
  SPENDING_LIMITS: 'rabit_spending_limits',
  ACCOUNT_CONFIG: 'rabit_account_config',
  USER_PREFERENCES: 'rabit_user_preferences'
} as const

// API Endpoints
export const API_ENDPOINTS = {
  PIMLICO: {
    MAINNET: 'https://api.pimlico.io/v1/ethereum/rpc',
    TESTNET: 'https://api.pimlico.io/v1/goerli/rpc'
  },
  ALCHEMY: {
    MAINNET: 'https://eth-mainnet.g.alchemy.com/v2',
    TESTNET: 'https://eth-goerli.g.alchemy.com/v2'
  },
  ZERODEV: {
    MAINNET: 'https://rpc.zerodev.app/api/v2',
    TESTNET: 'https://rpc.zerodev.app/api/v2'
  }
} as const