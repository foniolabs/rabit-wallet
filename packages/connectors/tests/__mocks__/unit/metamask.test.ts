/**
 * Save this as tests/__mocks__/unit/metamask.test.ts
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MetaMaskConnector } from '../../../src/implementations/metamask.js'

describe('MetaMaskConnector', () => {
  let connector: MetaMaskConnector
  let mockEthereum: any

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks()
    
    // Create a fresh MetaMask connector
    connector = new MetaMaskConnector()
    
    // Mock window.ethereum with MetaMask properties
    mockEthereum = {
      isMetaMask: true,
      request: vi.fn(),
      on: vi.fn(),
      removeListener: vi.fn(),
      _metamask: {
        isUnlocked: vi.fn().mockResolvedValue(true)
      }
    }
    
    // Delete existing ethereum property and set up fresh mock
    delete (window as any).ethereum
    Object.defineProperty(window, 'ethereum', {
      value: mockEthereum,
      writable: true,
      configurable: true
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    // Clean up window properties
    delete (window as any).ethereum
  })

  describe('Constructor', () => {
    it('should initialize with correct metadata', () => {
      expect(connector.id).toBe('metamask')
      expect(connector.type).toBe('injected')
      expect(connector.metadata.name).toBe('MetaMask')
      expect(connector.metadata.icon).toContain('metamask-fox.svg')
    })

    it('should have correct connection methods', () => {
      expect(connector.connectionMethods).toEqual(['extension', 'mobile'])
    })

    it('should have correct features', () => {
      expect(connector.features.signMessage).toBe(true)
      expect(connector.features.signTypedData).toBe(true)
      expect(connector.features.addChain).toBe(true)
      expect(connector.features.switchChain).toBe(true)
      expect(connector.features.watchAsset).toBe(true)
    })
  })

  describe('isAvailable', () => {
    it('should return true when MetaMask is installed', async () => {
      const availability = await connector.isAvailable()
      
      expect(availability.isAvailable).toBe(true)
      expect(availability.isInstalled).toBe(true)
      expect(availability.isReady).toBe(true)
      expect(availability.downloadUrl).toBe('https://metamask.io/download/')
    })

    it('should return false when MetaMask is not installed', async () => {
      // Remove MetaMask
      mockEthereum.isMetaMask = false
      
      const availability = await connector.isAvailable()
      
      expect(availability.isAvailable).toBe(false)
      expect(availability.isInstalled).toBe(false)
    })

    it('should detect platform correctly', async () => {
      const availability = await connector.isAvailable()
      const platform = availability.platforms[0]
      
      expect(platform.isBrowser).toBe(true)
      expect(platform.hasWalletExtension).toBe(true)
    })
  })

  describe('getProvider', () => {
    it('should return MetaMask provider when available', async () => {
      const provider = await connector.getProvider()
      
      expect(provider).toBe(mockEthereum)
      expect(provider.isMetaMask).toBe(true)
    })

    it('should find MetaMask in providers array', async () => {
      const metamaskProvider = { isMetaMask: true, request: vi.fn() }
      const otherProvider = { isCoinbaseWallet: true, request: vi.fn() }
      
      mockEthereum.providers = [otherProvider, metamaskProvider]
      mockEthereum.isMetaMask = false // Make sure it doesn't match directly
      
      const provider = await connector.getProvider()
      
      expect(provider).toBe(metamaskProvider)
    })

    it('should throw error when MetaMask is not available', async () => {
      // Remove MetaMask
      delete (window as any).ethereum
      Object.defineProperty(window, 'ethereum', {
        value: undefined,
        writable: true,
        configurable: true
      })
      
      await expect(connector.getProvider()).rejects.toThrow('metamask')
    })

    it('should throw error in server environment', async () => {
      // Mock server environment
      const originalWindow = global.window
      delete (global as any).window
      
      await expect(connector.getProvider()).rejects.toThrow('metamask')
      
      // Restore window
      global.window = originalWindow
    })
  })

  describe('connect', () => {
    beforeEach(() => {
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
    })

    it('should connect successfully', async () => {
      const result = await connector.connect()
      
      expect(result.accounts).toEqual(['0x1234567890123456789012345678901234567890'])
      expect(result.chainId).toBe(1)
      expect(result.method).toBe('extension')
      expect(mockEthereum.request).toHaveBeenCalledWith({ method: 'eth_requestAccounts' })
      expect(mockEthereum.request).toHaveBeenCalledWith({ method: 'eth_chainId' })
    })

    it('should emit connect event', async () => {
      const connectSpy = vi.fn()
      connector.on('connect', connectSpy)
      
      await connector.connect()
      
      expect(connectSpy).toHaveBeenCalledWith({
        accounts: ['0x1234567890123456789012345678901234567890'],
        chainId: 1,
        method: 'extension',
        data: { provider: mockEthereum }
      })
    })

    it('should handle connection failure', async () => {
      mockEthereum.request.mockRejectedValue(new Error('User rejected'))
      
      await expect(connector.connect()).rejects.toThrow('User rejected')
      expect(connector.status).toBe('error')
    })

    it('should handle empty accounts array', async () => {
      mockEthereum.request.mockImplementation((args: any) => {
        if (args.method === 'eth_requestAccounts') {
          return Promise.resolve([])
        }
        return Promise.resolve('0x1')
      })
      
      await expect(connector.connect()).rejects.toThrow('No accounts returned')
    })
  })

  describe('disconnect', () => {
    it('should disconnect successfully', async () => {
      // First connect properly
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
      
      await connector.connect()
      expect(connector.status).toBe('connected')
      
      const disconnectSpy = vi.fn()
      connector.on('disconnect', disconnectSpy)
      
      await connector.disconnect()
      
      expect(connector.status).toBe('disconnected')
      expect(disconnectSpy).toHaveBeenCalled()
    })
  })

  describe('MetaMask specific methods', () => {
    describe('isUnlocked', () => {
      it('should return true when MetaMask is unlocked', async () => {
        const isUnlocked = await connector.isUnlocked()
        
        expect(isUnlocked).toBe(true)
        expect(mockEthereum._metamask.isUnlocked).toHaveBeenCalled()
      })

      it('should fallback to account check when _metamask is not available', async () => {
        delete mockEthereum._metamask
        mockEthereum.request.mockResolvedValue(['0x1234567890123456789012345678901234567890'])
        
        const isUnlocked = await connector.isUnlocked()
        
        expect(isUnlocked).toBe(true)
        expect(mockEthereum.request).toHaveBeenCalledWith({ method: 'eth_accounts' })
      })

      it('should return false on error', async () => {
        mockEthereum._metamask.isUnlocked.mockRejectedValue(new Error('Locked'))
        
        const isUnlocked = await connector.isUnlocked()
        
        expect(isUnlocked).toBe(false)
      })
    })

    describe('generateMobileDeepLink', () => {
      it('should generate correct deep link for Android', () => {
        // Mock Android user agent
        Object.defineProperty(navigator, 'userAgent', {
          value: 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36',
          writable: true,
          configurable: true
        })
        
        const uri = 'wc:test-uri'
        const deepLink = connector.generateMobileDeepLink(uri)
        
        expect(deepLink).toBe(`metamask://wc?uri=${encodeURIComponent(uri)}`)
      })

      it('should generate correct deep link for iOS', () => {
        // Mock iOS user agent
        Object.defineProperty(navigator, 'userAgent', {
          value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
          writable: true,
          configurable: true
        })
        
        const uri = 'wc:test-uri'
        const deepLink = connector.generateMobileDeepLink(uri)
        
        expect(deepLink).toBe(`metamask://wc?uri=${encodeURIComponent(uri)}`)
      })

      it('should generate web link for desktop', () => {
        const uri = 'wc:test-uri'
        const deepLink = connector.generateMobileDeepLink(uri)
        
        expect(deepLink).toBe(`https://metamask.app.link/wc?uri=${encodeURIComponent(uri)}`)
      })
    })

    describe('requestInstallation', () => {
      it('should open installation URL', async () => {
        const mockOpen = vi.fn()
        Object.defineProperty(window, 'open', {
          value: mockOpen,
          writable: true,
          configurable: true
        })
        
        await connector.requestInstallation()
        
        expect(mockOpen).toHaveBeenCalledWith('https://metamask.io/download/', '_blank')
      })
    })

describe('openMobileApp', () => {
  it('should open deep link', async () => {
    const originalLocation = window.location
    
    delete (window as any).location
    window.location = {
      ...originalLocation,
      href: 'http://localhost:3000'
    } as any
    
    const deepLink = 'metamask://wc?uri=test'
    await connector.openMobileApp(deepLink)
    
    expect(window.location.href).toBe(deepLink)
    
    // Cleanup - also needs type assertion
    ;(window as any).location = originalLocation
  })
})


  })
})