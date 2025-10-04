// tests/__mocks__/config.ts
import type { RabitConfig, Chain, ChainId, RpcEndpoint } from '@rabit/types'
import { createMockConnector, createMetaMaskMock, createCoinbaseMock, createWalletConnectMock } from './wallet-connector'

export const createMockConfig = (): RabitConfig => ({
  app: {
    name: 'Test App',
    url: 'https://test.com',
    description: 'Test Description',
    icons: ['https://test.com/icon.png']
  },
  
  chains: [
    {
      id: 1 as ChainId,
      name: 'Ethereum',
      slug: 'ethereum',
      nativeCurrency: { 
        name: 'Ether', 
        symbol: 'ETH', 
        decimals: 18 
      },
      // Correct RpcEndpoint format based on your types
      rpcUrls: { 
        default: [
          {
            url: 'https://eth.llamarpc.com',
            weight: 1
          }
        ] as RpcEndpoint[]
      },
      blockExplorers: { 
        default: { 
          name: 'Etherscan', 
          url: 'https://etherscan.io' 
        } 
      },
      testnet: false,
      type: 'mainnet',
      layer: 'L1'
    } satisfies Chain,
    {
      id: 137 as ChainId,
      name: 'Polygon',
      slug: 'polygon',
      nativeCurrency: { 
        name: 'MATIC', 
        symbol: 'MATIC', 
        decimals: 18 
      },
      rpcUrls: { 
        default: [
          {
            url: 'https://polygon.llamarpc.com',
            weight: 1
          }
        ] as RpcEndpoint[]
      },
      blockExplorers: { 
        default: { 
          name: 'PolygonScan', 
          url: 'https://polygonscan.com' 
        } 
      },
      testnet: false,
      type: 'mainnet',
      layer: 'L2',
      parentChainId: 1 as ChainId
    } satisfies Chain
  ],
  
  connectors: [
    createMetaMaskMock(),
    createCoinbaseMock(),
    createWalletConnectMock()
  ],
  
  defaultChain: 1 as ChainId
})

// Config with smart accounts (using correct SmartAccountStandard)
export const createMockConfigWithSmartAccounts = (): RabitConfig => ({
  ...createMockConfig(),
  smartAccount: {
    // Use lowercase 'erc4337' as per your SmartAccountStandard type
    standard: 'erc4337',
    factoryAddress: '0x1234567890123456789012345678901234567890' as `0x${string}`,
    implementationAddress: '0x2234567890123456789012345678901234567890' as `0x${string}`,
    entryPointAddress: '0x3234567890123456789012345678901234567890' as `0x${string}`,
    bundler: {
      url: 'https://bundler.example.com',
      apiKey: 'test-api-key'
    },
    gasSponsorship: {
      enabled: true,
      paymasterAddress: '0x4234567890123456789012345678901234567890' as `0x${string}`,
      paymasterUrl: 'https://paymaster.example.com',
      policy: {
        maxGasLimit: 1000000n,
        maxGasPrice: 100000000000n,
        allowedOperations: ['transfer', 'approve'],
        rateLimit: {
          perMinute: 10,
          perHour: 100,
          perDay: 1000
        }
      }
    }
  }
})

// Config with analytics (using correct property name)
export const createMockConfigWithAnalytics = (): RabitConfig => ({
  ...createMockConfig(),
  analytics: {
    enabled: true,
    // Use 'provider' not 'providers' as per your AnalyticsConfig type
    provider: 'mixpanel',
    config: {
      token: 'test-token'
    },
    events: ['connect', 'disconnect', 'transaction'],
    identifyUsers: true,
    onEvent: (event) => {
      console.log('Analytics event:', event)
    }
  }
})

// Minimal config for basic testing
export const createMinimalMockConfig = (): RabitConfig => ({
  app: {
    name: 'Minimal Test App',
    url: 'https://minimal-test.com',
    icons: []
  },
  
  chains: [
    {
      id: 1 as ChainId,
      name: 'Ethereum',
      slug: 'ethereum',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: { 
        default: [
          { url: 'https://eth.llamarpc.com' }
        ] as RpcEndpoint[]
      },
      testnet: false
    } satisfies Chain
  ],
  
  connectors: [
    createMockConnector('metamask')
  ],
  
  defaultChain: 1 as ChainId
})

// Config with multiple chains and transports
export const createMultiChainMockConfig = (): RabitConfig => ({
  ...createMockConfig(),
  multiChain: {
    chains: createMockConfig().chains,
    defaultChainId: 1 as ChainId,
    autoSwitch: true,
    autoAddChains: false
  },
  transports: {
    1: {
      type: 'http',
      url: 'https://eth.llamarpc.com',
      fallbackUrls: ['https://eth.publicnode.com'],
      timeout: 5000,
      retries: 3
    },
    137: {
      type: 'http', 
      url: 'https://polygon.llamarpc.com',
      timeout: 5000,
      retries: 3
    }
  }
})

// Config with UI customization
export const createMockConfigWithUI = (): RabitConfig => ({
  ...createMockConfig(),
  ui: {
    theme: {
      mode: 'dark',
      accentColor: '#0070f3',
      borderRadius: 'medium',
      colors: {
        primary: '#0070f3',
        secondary: '#666666',
        background: '#000000',
        surface: '#111111',
        text: '#ffffff',
        textSecondary: '#888888'
      }
    },
    modal: {
      closeOnBackdropClick: true,
      showCloseButton: true,
      size: 'default',
      zIndex: 1000
    },
    walletList: {
      showRecent: true,
      maxWallets: 8,
      groupByType: false,
      showAllWallets: true,
      order: ['metamask', 'coinbase', 'walletconnect']
    },
    locale: 'en'
  }
})