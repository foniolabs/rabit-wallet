/**
 * Save this as tests/__mocks__/integration/connectors.test.ts
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createConnectors } from '../../../src/index.js'
import { MetaMaskConnector } from '../../../src/implementations/metamask.js'
import { CoinbaseWalletConnector } from '../../../src/implementations/coinbase.js'
import { WalletConnectConnector } from '../../../src/implementations/walletconnect.js'
import { InjectedConnector } from '../../../src/implementations/injected.js'
import { SafeConnector } from '../../../src/implementations/safe.js'

describe('Connectors Integration', () => {
  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks()
    
    // Safely redefine window.ethereum - delete first to avoid conflicts
    delete (window as any).ethereum
    
    // Create fresh mock for each test
    const mockEthereum = {
      isMetaMask: true,
      request: vi.fn().mockResolvedValue(['0x1234567890123456789012345678901234567890']),
      on: vi.fn(),
      removeListener: vi.fn()
    }
    
    Object.defineProperty(window, 'ethereum', {
      value: mockEthereum,
      writable: true,
      configurable: true
    })
    
    // Mock Function constructor for dynamic imports - reset each time
    global.Function = vi.fn().mockImplementation((code: string) => {
      if (code.includes('@walletconnect/ethereum-provider')) {
        return () => Promise.resolve({
          EthereumProvider: {
            init: vi.fn().mockResolvedValue({
              enable: vi.fn(),
              disconnect: vi.fn(),
              accounts: ['0x1234567890123456789012345678901234567890'],
              chainId: '0x1',
              request: vi.fn(),
              on: vi.fn(),
              removeListener: vi.fn()
            })
          }
        })
      }
      if (code.includes('@safe-global/safe-apps-sdk')) {
        return () => Promise.resolve({
          default: vi.fn(() => ({
            safe: {
              getInfo: vi.fn().mockResolvedValue({
                safeAddress: '0x9876543210987654321098765432109876543210',
                chainId: 1
              })
            },
            txs: {
              signTypedMessage: vi.fn().mockResolvedValue({ signature: '0xsafesignature' }),
              send: vi.fn().mockResolvedValue({ safeTxHash: '0xsafetxhash' })
            }
          }))
        })
      }
      if (code.includes('@coinbase/wallet-sdk')) {
        return () => Promise.resolve({
          CoinbaseWalletSDK: vi.fn().mockImplementation(() => ({
            makeWeb3Provider: vi.fn().mockReturnValue({
              request: vi.fn(),
              on: vi.fn(),
              removeListener: vi.fn()
            })
          }))
        })
      }
      // Return original for any other code
      return Function(code)
    }) as any
  })

  afterEach(() => {
    vi.restoreAllMocks()
    // Clean up window properties
    delete (window as any).ethereum
  })

  describe('createConnectors', () => {
    it('should create default connectors without config', () => {
      const connectors = createConnectors()
      
      expect(connectors).toHaveLength(4)
      expect(connectors[0]).toBeInstanceOf(MetaMaskConnector)
      expect(connectors[1]).toBeInstanceOf(CoinbaseWalletConnector)
      expect(connectors[2]).toBeInstanceOf(InjectedConnector)
      expect(connectors[3]).toBeInstanceOf(SafeConnector)
    })

    it('should create connectors with WalletConnect when config provided', () => {
      const config = {
        walletConnect: {
          projectId: 'test-project-id',
          metadata: {
            name: 'Test App',
            description: 'Test Description',
            url: 'https://test.com',
            icons: ['https://test.com/icon.png']
          }
        }
      }
      
      const connectors = createConnectors(config)
      
      expect(connectors).toHaveLength(5)
      expect(connectors[4]).toBeInstanceOf(WalletConnectConnector)
    })

    it('should create connectors with Coinbase config', () => {
      const config = {
        coinbase: {
          appName: 'Test App',
          darkMode: true
        }
      }
      
      const connectors = createConnectors(config)
      
      expect(connectors).toHaveLength(4)
      expect(connectors[1]).toBeInstanceOf(CoinbaseWalletConnector)
    })
  })

  describe('Connector Interoperability', () => {
    let connectors: ReturnType<typeof createConnectors>

    beforeEach(() => {
      connectors = createConnectors({
        walletConnect: {
          projectId: 'test-project-id',
          metadata: {
            name: 'Test App',
            description: 'Test Description',
            url: 'https://test.com',
            icons: ['https://test.com/icon.png']
          }
        }
      })
    })

    it('should have unique IDs across all connectors', () => {
      const ids = connectors.map(c => c.id)
      const uniqueIds = new Set(ids)
      
      expect(uniqueIds.size).toBe(ids.length)
    })

    it('should all implement the same base interface', () => {
      connectors.forEach(connector => {
        expect(typeof connector.connect).toBe('function')
        expect(typeof connector.disconnect).toBe('function')
        expect(typeof connector.getProvider).toBe('function')
        expect(typeof connector.isAvailable).toBe('function')
        expect(typeof connector.getAccounts).toBe('function')
        expect(typeof connector.getChainId).toBe('function')
        expect(connector.metadata).toBeDefined()
        expect(connector.features).toBeDefined()
      })
    })

    it('should handle multiple simultaneous availability checks', async () => {
      const availabilityPromises = connectors.map(c => c.isAvailable())
      const results = await Promise.all(availabilityPromises)
      
      expect(results).toHaveLength(connectors.length)
      results.forEach(result => {
        expect(typeof result.isAvailable).toBe('boolean')
        expect(typeof result.isInstalled).toBe('boolean')
        expect(typeof result.isReady).toBe('boolean')
        expect(Array.isArray(result.platforms)).toBe(true)
      })
    })
  })

  describe('Real-world Usage Scenarios', () => {
    let connectors: ReturnType<typeof createConnectors>

    beforeEach(() => {
      connectors = createConnectors({
        walletConnect: {
          projectId: 'test-project-id',
          metadata: {
            name: 'Test App',
            description: 'Test Description',
            url: 'https://test.com',
            icons: ['https://test.com/icon.png']
          }
        }
      })
    })

    it('should detect available wallets correctly', async () => {
      // MetaMask should be available (mocked)
      const metamask = connectors.find(c => c.id === 'metamask')
      const availability = await metamask!.isAvailable()
      
      expect(availability.isAvailable).toBe(true)
      expect(availability.isInstalled).toBe(true)
    })

    it('should handle wallet switching scenario', async () => {
      const metamask = connectors.find(c => c.id === 'metamask')!
      
      // Connect to MetaMask
      const mockEthereum = (window as any).ethereum
      mockEthereum.request.mockImplementation((args: any) => {
        switch (args.method) {
          case 'eth_requestAccounts':
            return Promise.resolve(['0x1234567890123456789012345678901234567890'])
          case 'eth_chainId':
            return Promise.resolve('0x1')
          default:
            return Promise.resolve(null)
        }
      })
      
      const result = await metamask.connect()
      expect(result.accounts).toEqual(['0x1234567890123456789012345678901234567890'])
      expect(result.chainId).toBe(1)
      
      // Disconnect
      await metamask.disconnect()
      expect(metamask.status).toBe('disconnected')
    })

    it('should handle wallet not available scenario', async () => {
      // Remove MetaMask - delete first to allow redefinition
      delete (window as any).ethereum
      Object.defineProperty(window, 'ethereum', {
        value: undefined,
        writable: true,
        configurable: true
      })
      
      const metamask = connectors.find(c => c.id === 'metamask')!
      const availability = await metamask.isAvailable()
      
      expect(availability.isAvailable).toBe(false)
      expect(availability.isInstalled).toBe(false)
      
      await expect(metamask.connect()).rejects.toThrow()
    })

    it('should handle multiple wallet types correctly', async () => {
      // Test that each connector has appropriate features
      const metamask = connectors.find(c => c.id === 'metamask')!
      const walletconnect = connectors.find(c => c.id === 'walletconnect')!
      const safe = connectors.find(c => c.id === 'safe')!
      
      // MetaMask features
      expect(metamask.features.switchChain).toBe(true)
      expect(metamask.features.addChain).toBe(true)
      expect(metamask.features.personalSign).toBe(true)
      
      // WalletConnect features
      expect(walletconnect.features.sessions).toBe(true)
      expect(walletconnect.features.addChain).toBe(false)
      
      // Safe features
      expect(safe.features.isSmartWallet).toBe(true)
      expect(safe.features.accountAbstraction).toBe(true)
      expect(safe.features.personalSign).toBe(false)
      expect(safe.features.switchChain).toBe(false)
    })

    it('should handle chain switching across different connectors', async () => {
      const metamask = connectors.find(c => c.id === 'metamask')!
      const safe = connectors.find(c => c.id === 'safe')!
      
      // MetaMask should support chain switching
      expect(metamask.features.switchChain).toBe(true)
      
      // Safe should not support chain switching
      expect(safe.features.switchChain).toBe(false)
    })
  })

  describe('Error Handling Integration', () => {
    let connectors: ReturnType<typeof createConnectors>

    beforeEach(() => {
      connectors = createConnectors({
        walletConnect: {
          projectId: 'test-project-id',
          metadata: {
            name: 'Test App',
            description: 'Test Description',
            url: 'https://test.com',
            icons: ['https://test.com/icon.png']
          }
        }
      })
    })

    it('should handle connection rejections consistently', async () => {
      const metamask = connectors.find(c => c.id === 'metamask')!
      
      // Mock user rejection
      const mockEthereum = (window as any).ethereum
      mockEthereum.request.mockRejectedValue(new Error('User rejected the request'))
      
      await expect(metamask.connect()).rejects.toThrow()
      expect(metamask.status).toBe('error')
    })

    it('should handle provider unavailable scenarios', async () => {
      // Test MetaMask when unavailable
      delete (window as any).ethereum
      Object.defineProperty(window, 'ethereum', {
        value: undefined,
        writable: true,
        configurable: true
      })
      
      const metamask = connectors.find(c => c.id === 'metamask')!
      await expect(metamask.getProvider()).rejects.toThrow()
      
      // Test Safe when not in iframe
      const safe = connectors.find(c => c.id === 'safe')!
      Object.defineProperty(window, 'self', {
        value: window,
        writable: true,
        configurable: true
      })
      Object.defineProperty(window, 'top', {
        value: window,
        writable: true,
        configurable: true
      })
      
      await expect(safe.getProvider()).rejects.toThrow()
    })

    it('should handle network errors gracefully', async () => {
      const walletconnect = connectors.find(c => c.id === 'walletconnect')!
      
      // Mock network failure for WalletConnect
      global.Function = vi.fn().mockImplementation(() => {
        return () => Promise.reject(new Error('Network error'))
      }) as any
      
      await expect(walletconnect.getProvider()).rejects.toThrow()
    })
  })

  describe('Event System Integration', () => {
    let metamask: MetaMaskConnector

    beforeEach(() => {
      const connectors = createConnectors()
      metamask = connectors.find(c => c.id === 'metamask') as MetaMaskConnector
    })

    it('should properly handle event lifecycle', async () => {
      const events: string[] = []
      
      // Set up event listeners
      metamask.on('statusChanged', (status) => events.push(`status:${status}`))
      metamask.on('connect', () => events.push('connect'))
      metamask.on('disconnect', () => events.push('disconnect'))
      metamask.on('accountsChanged', () => events.push('accountsChanged'))
      metamask.on('chainChanged', () => events.push('chainChanged'))
      
      // Mock successful connection
      const mockEthereum = (window as any).ethereum
      mockEthereum.request.mockImplementation((args: any) => {
        switch (args.method) {
          case 'eth_requestAccounts':
            return Promise.resolve(['0x1234567890123456789012345678901234567890'])
          case 'eth_chainId':
            return Promise.resolve('0x1')
          default:
            return Promise.resolve(null)
        }
      })
      
      // Connect and disconnect
      await metamask.connect()
      await metamask.disconnect()
      
      expect(events).toContain('status:connecting')
      expect(events).toContain('status:connected')
      expect(events).toContain('connect')
      expect(events).toContain('status:disconnected')
      expect(events).toContain('disconnect')
    })

    it('should handle event listener cleanup', () => {
      const listener = vi.fn()
      
      metamask.on('connect', listener)
      metamask.off('connect', listener)
      metamask.removeAllListeners('connect')
      
      // Should not throw errors
      expect(listener).not.toHaveBeenCalled()
    })
  })

  describe('Performance and Memory', () => {
    it('should not create duplicate providers', async () => {
      const connector = new MetaMaskConnector()
      
      const provider1 = await connector.getProvider()
      const provider2 = await connector.getProvider()
      
      expect(provider1).toBe(provider2)
    })

    it('should handle rapid connect/disconnect cycles', async () => {
      const connector = new MetaMaskConnector()
      
      const mockEthereum = (window as any).ethereum
      mockEthereum.request.mockImplementation((args: any) => {
        switch (args.method) {
          case 'eth_requestAccounts':
            return Promise.resolve(['0x1234567890123456789012345678901234567890'])
          case 'eth_chainId':
            return Promise.resolve('0x1')
          default:
            return Promise.resolve(null)
        }
      })
      
      // Rapid connect/disconnect cycles
      for (let i = 0; i < 5; i++) {
        await connector.connect()
        expect(connector.status).toBe('connected')
        
        await connector.disconnect()
        expect(connector.status).toBe('disconnected')
      }
    })

    it('should handle concurrent connection attempts', async () => {
      const connector = new MetaMaskConnector()
      
      const mockEthereum = (window as any).ethereum
      mockEthereum.request.mockImplementation((args: any) => {
        switch (args.method) {
          case 'eth_requestAccounts':
            return new Promise(resolve => 
              setTimeout(() => resolve(['0x1234567890123456789012345678901234567890']), 50)
            )
          case 'eth_chainId':
            return Promise.resolve('0x1')
          default:
            return Promise.resolve(null)
        }
      })
      
      // Start multiple concurrent connections
      const connections = [
        connector.connect(),
        connector.connect(),
        connector.connect()
      ]
      
      const results = await Promise.all(connections)
      
      // All should resolve successfully
      results.forEach(result => {
        expect(result.accounts).toEqual(['0x1234567890123456789012345678901234567890'])
      })
      
      expect(connector.status).toBe('connected')
    })
  })

  describe('Type Safety Integration', () => {
    it('should maintain type safety across all connectors', () => {
      const connectors = createConnectors()
      
      connectors.forEach(connector => {
        // Test that all required properties exist with correct types
        expect(typeof connector.id).toBe('string')
        expect(typeof connector.type).toBe('string')
        expect(typeof connector.status).toBe('string')
        expect(typeof connector.metadata).toBe('object')
        expect(typeof connector.features).toBe('object')
        expect(Array.isArray(connector.connectionMethods)).toBe(true)
        
        // Test methods exist
        expect(typeof connector.connect).toBe('function')
        expect(typeof connector.disconnect).toBe('function')
        expect(typeof connector.getProvider).toBe('function')
        expect(typeof connector.isAvailable).toBe('function')
        expect(typeof connector.getAccounts).toBe('function')
        expect(typeof connector.getChainId).toBe('function')
      })
    })

    it('should handle Address type correctly', async () => {
      const connector = new MetaMaskConnector()
      
      const mockEthereum = (window as any).ethereum
      mockEthereum.request.mockImplementation((args: any) => {
        switch (args.method) {
          case 'eth_requestAccounts':
            return Promise.resolve(['0x1234567890123456789012345678901234567890'])
          case 'eth_chainId':
            return Promise.resolve('0x1')
          default:
            return Promise.resolve(null)
        }
      })
      
      const result = await connector.connect()
      
      // Ensure addresses are properly typed
      expect(result.accounts[0]).toMatch(/^0x[a-fA-F0-9]{40}$/)
      expect(typeof result.chainId).toBe('number')
    })
  })

  describe('Real Production Scenarios', () => {
    it('should handle dApp with multiple wallets installed', async () => {
      // Mock multiple wallets installed - delete first to avoid conflicts
      delete (window as any).ethereum
      
      const mockEthereum = {
        isMetaMask: false,
        providers: [
          { isMetaMask: true, request: vi.fn() },
          { isCoinbaseWallet: true, request: vi.fn() },
          { isBraveWallet: true, request: vi.fn() }
        ],
        request: vi.fn()
      }
      
      Object.defineProperty(window, 'ethereum', {
        value: mockEthereum,
        writable: true,
        configurable: true
      })
      
      const connectors = createConnectors()
      const metamask = connectors.find(c => c.id === 'metamask')!
      const coinbase = connectors.find(c => c.id === 'coinbase')!
      const injected = connectors.find(c => c.id === 'injected')!
      
      // Each should find its own provider
      const metamaskProvider = await metamask.getProvider()
      const coinbaseProvider = await coinbase.getProvider()
      const injectedProvider = await injected.getProvider()
      
      expect((metamaskProvider as any).isMetaMask).toBe(true)
      expect((coinbaseProvider as any).isCoinbaseWallet).toBe(true)
      expect((injectedProvider as any).isBraveWallet).toBe(true)
    })

    it('should handle mobile vs desktop detection', async () => {
      const connectors = createConnectors()
      
      // Test desktop
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        writable: true,
        configurable: true
      })
      
      let availability = await connectors[0].isAvailable()
      expect(availability.platforms[0].isMobile).toBe(false)
      expect(availability.platforms[0].isIOS).toBe(false)
      expect(availability.platforms[0].isAndroid).toBe(false)
      
      // Test mobile iOS
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
        writable: true,
        configurable: true
      })
      
      availability = await connectors[0].isAvailable()
      expect(availability.platforms[0].isMobile).toBe(true)
      expect(availability.platforms[0].isIOS).toBe(true)
      expect(availability.platforms[0].isAndroid).toBe(false)
      
      // Test mobile Android
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36',
        writable: true,
        configurable: true
      })
      
      availability = await connectors[0].isAvailable()
      expect(availability.platforms[0].isMobile).toBe(true)
      expect(availability.platforms[0].isIOS).toBe(false)
      expect(availability.platforms[0].isAndroid).toBe(true)
    })

    it('should gracefully handle unsupported methods', async () => {
      const connector = new MetaMaskConnector()
      
      // First connect the connector
      const mockEthereum = (window as any).ethereum
      mockEthereum.request.mockImplementation((args: any) => {
        if (args.method === 'wallet_addEthereumChain') {
          throw new Error('Method not supported')
        }
        switch (args.method) {
          case 'eth_requestAccounts':
            return Promise.resolve(['0x1234567890123456789012345678901234567890'])
          case 'eth_chainId':
            return Promise.resolve('0x1')
          default:
            return Promise.resolve(null)
        }
      })
      
      // Connect first, then test the unsupported method
      await connector.connect()
      
      await expect(connector.addChain({
        id: 56,
        name: 'BSC',
        nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
        rpcUrls: { default: [{ url: 'https://bsc-dataseed.binance.org' }] }
      } as any)).rejects.toThrow('Method not supported')
    })

    it('should handle Safe App detection correctly', async () => {
      const connectors = createConnectors()
      const safe = connectors.find(c => c.id === 'safe')!
      
      // Mock Safe App context (iframe)
      Object.defineProperty(window, 'self', {
        value: {},
        writable: true,
        configurable: true
      })
      Object.defineProperty(window, 'top', {
        value: window,
        writable: true,
        configurable: true
      })
      
      const availability = await safe.isAvailable()
      expect(availability.isAvailable).toBe(true)
      
      // Mock non-Safe context
      Object.defineProperty(window, 'self', {
        value: window,
        writable: true,
        configurable: true
      })
      
      const availability2 = await safe.isAvailable()
      expect(availability2.isAvailable).toBe(false)
    })

    it('should handle WalletConnect session management', async () => {
      const config = {
        walletConnect: {
          projectId: 'test-project-id',
          metadata: {
            name: 'Test App',
            description: 'Test Description',
            url: 'https://test.com',
            icons: ['https://test.com/icon.png']
          }
        }
      }
      
      const connectors = createConnectors(config)
      const walletConnect = connectors.find(c => c.id === 'walletconnect') as WalletConnectConnector
      
      expect(walletConnect.isSessionActive()).toBe(false)
      expect(walletConnect.getSupportedChains()).toEqual([1])
      
      // Update config
      walletConnect.updateConfig({ chains: [1, 137, 56] })
      expect(walletConnect.getSupportedChains()).toEqual([1, 137, 56])
    })
  })

  describe('Cross-Connector Compatibility', () => {
    it('should handle switching between different connector types', async () => {
      const connectors = createConnectors({
        walletConnect: {
          projectId: 'test-project-id',
          metadata: {
            name: 'Test App',
            description: 'Test Description',
            url: 'https://test.com',
            icons: ['https://test.com/icon.png']
          }
        }
      })
      
      const metamask = connectors.find(c => c.id === 'metamask')!
      const walletConnect = connectors.find(c => c.id === 'walletconnect')!
      
      // Mock MetaMask connection
      const mockEthereum = (window as any).ethereum
      mockEthereum.request.mockImplementation((args: any) => {
        switch (args.method) {
          case 'eth_requestAccounts':
            return Promise.resolve(['0x1234567890123456789012345678901234567890'])
          case 'eth_chainId':
            return Promise.resolve('0x1')
          default:
            return Promise.resolve(null)
        }
      })
      
      // Connect to MetaMask
      await metamask.connect()
      expect(metamask.status).toBe('connected')
      
      // Disconnect MetaMask
      await metamask.disconnect()
      expect(metamask.status).toBe('disconnected')
      
      // Connect to WalletConnect
      await walletConnect.connect()
      expect(walletConnect.status).toBe('connected')
      
      await walletConnect.disconnect()
      expect(walletConnect.status).toBe('disconnected')
    })

    it('should maintain separate state for each connector', async () => {
      const connectors = createConnectors()
      const metamask = connectors.find(c => c.id === 'metamask')!
      const injected = connectors.find(c => c.id === 'injected')!
      
      // Each connector should have independent state
      expect(metamask.status).toBe('disconnected')
      expect(injected.status).toBe('disconnected')
      
      // Connecting one shouldn't affect the other
      const mockEthereum = (window as any).ethereum
      mockEthereum.request.mockImplementation((args: any) => {
        switch (args.method) {
          case 'eth_requestAccounts':
            return Promise.resolve(['0x1234567890123456789012345678901234567890'])
          case 'eth_chainId':
            return Promise.resolve('0x1')
          default:
            return Promise.resolve(null)
        }
      })
      
      await metamask.connect()
      expect(metamask.status).toBe('connected')
      expect(injected.status).toBe('disconnected') 
    })
  })
})