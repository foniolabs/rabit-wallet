export const RABIT_STORAGE_KEYS = {
  RECENT_CONNECTOR: 'rabit.recentConnector',
  THEME_MODE: 'rabit.themeMode',
  USER_PREFERENCES: 'rabit.userPreferences',
  AUTH_TOKEN: 'rabit.authToken',
  SMART_ACCOUNT_ADDRESS: 'rabit.smartAccountAddress',
} as const;

export const SUPPORTED_CHAINS = {
  ETHEREUM: 1,
  GOERLI: 5,
  SEPOLIA: 11155111,
  POLYGON: 137,
  POLYGON_MUMBAI: 80001,
  ARBITRUM: 42161,
  OPTIMISM: 10,
  BASE: 8453,
  BSC: 56,
  AVALANCHE: 43114,
} as const;

export const EXPLORER_URLS: Record<number, string> = {
  [SUPPORTED_CHAINS.ETHEREUM]: 'https://etherscan.io',
  [SUPPORTED_CHAINS.GOERLI]: 'https://goerli.etherscan.io',
  [SUPPORTED_CHAINS.SEPOLIA]: 'https://sepolia.etherscan.io',
  [SUPPORTED_CHAINS.POLYGON]: 'https://polygonscan.com',
  [SUPPORTED_CHAINS.POLYGON_MUMBAI]: 'https://mumbai.polygonscan.com',
  [SUPPORTED_CHAINS.ARBITRUM]: 'https://arbiscan.io',
  [SUPPORTED_CHAINS.OPTIMISM]: 'https://optimistic.etherscan.io',
  [SUPPORTED_CHAINS.BASE]: 'https://basescan.org',
  [SUPPORTED_CHAINS.BSC]: 'https://bscscan.com',
  [SUPPORTED_CHAINS.AVALANCHE]: 'https://snowtrace.io',
};

export const POPULAR_CONNECTORS = [
  'metamask',
  'walletconnect',
  'coinbase',
  'rainbow',
  'injected',
] as const;

export const SOCIAL_PROVIDERS = [
  'google',
  'twitter',
  'discord',
  'github',
  'email',
] as const;

export const CHAIN_NAMES: Record<number, string> = {
  [SUPPORTED_CHAINS.ETHEREUM]: 'Ethereum',
  [SUPPORTED_CHAINS.GOERLI]: 'Goerli',
  [SUPPORTED_CHAINS.SEPOLIA]: 'Sepolia',
  [SUPPORTED_CHAINS.POLYGON]: 'Polygon',
  [SUPPORTED_CHAINS.POLYGON_MUMBAI]: 'Mumbai',
  [SUPPORTED_CHAINS.ARBITRUM]: 'Arbitrum',
  [SUPPORTED_CHAINS.OPTIMISM]: 'Optimism',
  [SUPPORTED_CHAINS.BASE]: 'Base',
  [SUPPORTED_CHAINS.BSC]: 'BNB Chain',
  [SUPPORTED_CHAINS.AVALANCHE]: 'Avalanche',
};

export const ANIMATION_DURATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const;

export const BREAKPOINTS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;
