// tests/__mocks__/wallet-connector.ts
import type { 
  WalletConnector, 
  ConnectResult, 
  WalletType, 
  ConnectionMethod,
  RabitId,
  Address,
  ChainId,
  WalletFeatures,
  WalletAvailability,
  Metadata,
  ConnectionStatus,
  Platform
} from '@rabit/types'
import { vi } from 'vitest'

export const createMockConnector = (type: WalletType = 'metamask'): WalletConnector => ({
  // Required properties from your WalletConnector interface
  id: `mock-${type}` as RabitId,
  type,
  
  // Metadata property (required)
  metadata: {
    name: `Mock ${type}`,
    description: `Mock ${type} wallet for testing`,
    icon: 'https://example.com/mock-icon.svg',
    urls: {
      website: 'https://example.com',
      documentation: 'https://docs.example.com'
    }
  } as Metadata,
  
  // Connection methods supported by this mock connector
  connectionMethods: ['extension', 'mobile'] as ConnectionMethod[],
  
  // Mock features 
  features: {
    signMessage: true,
    signTypedData: true,
    personalSign: true,
    switchChain: true,
    addChain: true,
    watchAsset: false,
    batchTransactions: false,
    sessions: false,
    isSmartWallet: false,
    accountAbstraction: false,
    gaslessTransactions: false
  } as WalletFeatures,
  
  // Current connection status
  status: 'disconnected' as ConnectionStatus,
  
  // Core wallet methods
  isAvailable: vi.fn().mockResolvedValue({
    isAvailable: true,
    isInstalled: true,
    isReady: true,
    downloadUrl: 'https://example.com/download',
    deepLinkScheme: 'mock-wallet://',
    platforms: [
      {
        isBrowser: true,
        isMobile: false,
        isIOS: false,
        isAndroid: false,
        hasWalletExtension: true
      }
    ] as Platform[]
  } as WalletAvailability),
  
  connect: vi.fn().mockResolvedValue({
    accounts: ['0x1234567890123456789012345678901234567890'] as Address[],
    chainId: 1 as ChainId,
    method: 'extension' as ConnectionMethod, // Valid ConnectionMethod from your enum
    data: {}
  } satisfies ConnectResult),
  
  disconnect: vi.fn().mockResolvedValue(undefined),
  getAccounts: vi.fn().mockResolvedValue(['0x1234567890123456789012345678901234567890'] as Address[]),
  getChainId: vi.fn().mockResolvedValue(1 as ChainId),
  switchChain: vi.fn().mockResolvedValue(undefined),
  addChain: vi.fn().mockResolvedValue(undefined),
  sendTransaction: vi.fn().mockResolvedValue('0xhash123' as `0x${string}`),
  signMessage: vi.fn().mockResolvedValue('0xsignature123' as `0x${string}`),
  signTypedData: vi.fn().mockResolvedValue('0xsignature456' as `0x${string}`),
  getProvider: vi.fn().mockResolvedValue({}),
  
  // EventEmitter methods (from extends EventEmitter<WalletConnectorEvents>)
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  removeAllListeners: vi.fn()
})

// Create connector with specific connection method
export const createMockConnectorWithMethod = (
  type: WalletType = 'metamask',
  method: ConnectionMethod = 'extension'
): WalletConnector => {
  const connector = createMockConnector(type)
  
  // Override connect to use specific method
  connector.connect = vi.fn().mockResolvedValue({
    accounts: ['0x1234567890123456789012345678901234567890'] as Address[],
    chainId: 1 as ChainId,
    method,
    data: {}
  } satisfies ConnectResult)
  
  return connector
}

// Specific wallet type mocks
export const createMetaMaskMock = () => createMockConnectorWithMethod('metamask', 'extension')
export const createCoinbaseMock = () => createMockConnectorWithMethod('coinbase', 'mobile') 
export const createWalletConnectMock = () => createMockConnectorWithMethod('walletconnect', 'qr')

// Mock for testing different connection methods
export const createMockConnectorForAllMethods = (type: WalletType = 'metamask'): WalletConnector => {
  // Create a new connector with all methods instead of modifying existing one
  return {
    ...createMockConnector(type),
    // Override the readonly property during creation
    connectionMethods: ['extension', 'mobile', 'qr', 'deeplink', 'embedded', 'popup', 'redirect'] as ConnectionMethod[]
  }
}

// Mock that simulates unavailable wallet
export const createUnavailableMockConnector = (type: WalletType = 'metamask'): WalletConnector => {
  const connector = createMockConnector(type)
  
  connector.isAvailable = vi.fn().mockResolvedValue({
    isAvailable: false,
    isInstalled: false,
    isReady: false,
    downloadUrl: 'https://example.com/download',
    platforms: []
  } as WalletAvailability)
  
  return connector
}

// Mock that simulates connection errors
export const createErrorMockConnector = (type: WalletType = 'metamask'): WalletConnector => {
  const connector = createMockConnector(type)
  
  connector.connect = vi.fn().mockRejectedValue(new Error('Connection failed'))
  
  return connector
}