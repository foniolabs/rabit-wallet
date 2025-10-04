/**
 * Save this as tests/__mocks__/unit/walletconnect.test.ts
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { WalletConnectConnector } from '../../../src/implementations/walletconnect.js'

describe('WalletConnectConnector', () => {
  let connector: WalletConnectConnector
  let mockProvider: any
  let config: any

  beforeEach(() => {
    vi.clearAllMocks()
    
    config = {
      projectId: 'test-project-id',
      chains: [1, 137],
      metadata: {
        name: 'Test App',
        description: 'Test Description',
        url: 'https://test.com',
        icons: ['https://test.com/icon.png']
      }
    }
    
    // Mock WalletConnect provider
    mockProvider = {
      enable: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      request: vi.fn(),
      on: vi.fn(),
      removeListener: vi.fn(),
      accounts: ['0x1234567890123456789012345678901234567890'],
      chainId: '0x1',
      session: {
        peer: {
          metadata: {
            name: 'Test Wallet',
            description: 'Test mobile wallet'
          }
        }
      }
    }
    
    // Mock the dynamic import
    const mockEthereumProvider = {
      init: vi.fn().mockResolvedValue(mockProvider)
    }
    
    // Mock Function constructor for dynamic import
    const originalFunction = global.Function
    global.Function = vi.fn().mockImplementation((code: string) => {
      if (code.includes('@walletconnect/ethereum-provider')) {
        return () => Promise.resolve({ EthereumProvider: mockEthereumProvider })
      }
      return originalFunction(code)
    }) as any
    
    connector = new WalletConnectConnector(config)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Constructor', () => {
    it('should initialize with correct metadata', () => {
      expect(connector.id).toBe('walletconnect')
      expect(connector.type).toBe('walletconnect')
      expect(connector.metadata.name).toBe('WalletConnect')
      expect(connector.metadata.description).toBe('Connect with 500+ wallets')
    })

    it('should have correct connection methods', () => {
      expect(connector.connectionMethods).toEqual(['qr', 'mobile', 'deeplink'])
    })

    it('should have correct features', () => {
      expect(connector.features.signMessage).toBe(true)
      expect(connector.features.signTypedData).toBe(true)
      expect(connector.features.switchChain).toBe(true)
      expect(connector.features.sessions).toBe(true)
      expect(connector.features.addChain).toBe(false)
    })
  })

  describe('isAvailable', () => {
    it('should always return true (protocol available)', async () => {
      const availability = await connector.isAvailable()
      
      expect(availability.isAvailable).toBe(true)
      expect(availability.isInstalled).toBe(true)
      expect(availability.isReady).toBe(true)
      expect(availability.downloadUrl).toBe('https://walletconnect.com/explorer')
    })

    it('should detect platform correctly', async () => {
      const availability = await connector.isAvailable()
      const platform = availability.platforms[0]
      
      expect(platform.isBrowser).toBe(true)
      expect(platform.hasWalletExtension).toBe(false) // WalletConnect is protocol, not extension
    })
  })

  describe('getProvider', () => {
    it('should initialize and return WalletConnect provider', async () => {
      const provider = await connector.getProvider()
      
      expect(provider).toBe(mockProvider)
    })

    it('should return cached provider on subsequent calls', async () => {
      const provider1 = await connector.getProvider()
      const provider2 = await connector.getProvider()
      
      expect(provider1).toBe(provider2)
      expect(provider1).toBe(mockProvider)
    })

    it('should throw error when WalletConnect module is not available', async () => {
      // Mock failed import
      global.Function = vi.fn().mockImplementation(() => {
        return () => Promise.reject(new Error('Module not found'))
      }) as any
      
      const newConnector = new WalletConnectConnector(config)
      
      await expect(newConnector.getProvider()).rejects.toThrow('walletconnect')
    })
  })

  describe('connect', () => {
    beforeEach(() => {
      mockProvider.request.mockImplementation((args: any) => {
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
      expect(result.method).toBe('qr')
      expect(result.data.peerMeta).toBe(mockProvider.session.peer.metadata)
      expect(mockProvider.enable).toHaveBeenCalled()
    })

    it('should emit connect event', async () => {
      const connectSpy = vi.fn()
      connector.on('connect', connectSpy)
      
      await connector.connect()
      
      expect(connectSpy).toHaveBeenCalledWith({
        accounts: ['0x1234567890123456789012345678901234567890'],
        chainId: 1,
        method: 'qr',
        data: {
          provider: mockProvider,
          peerMeta: mockProvider.session.peer.metadata
        }
      })
    })

    it('should handle connection failure', async () => {
      mockProvider.enable.mockRejectedValue(new Error('Connection failed'))
      
      await expect(connector.connect()).rejects.toThrow('WalletConnect connection failed')
      expect(connector.status).toBe('error')
    })

    it('should use custom connection method', async () => {
      const result = await connector.connect({ method: 'mobile' })
      
      expect(result.method).toBe('mobile')
    })
  })

  describe('disconnect', () => {
    it('should disconnect successfully', async () => {
      // First connect
      await connector.connect()
      
      const disconnectSpy = vi.fn()
      connector.on('disconnect', disconnectSpy)
      
      await connector.disconnect()
      
      expect(mockProvider.disconnect).toHaveBeenCalled()
      expect(connector.status).toBe('disconnected')
      expect(disconnectSpy).toHaveBeenCalled()
    })

    it('should handle disconnect failure', async () => {
      await connector.connect()
      mockProvider.disconnect.mockRejectedValue(new Error('Disconnect failed'))
      
      await expect(connector.disconnect()).rejects.toThrow('Disconnect failed')
      expect(connector.status).toBe('error')
    })
  })

  describe('getAccounts', () => {
    it('should return accounts from provider', async () => {
      await connector.connect()
      
      const accounts = await connector.getAccounts()
      
      expect(accounts).toEqual(['0x1234567890123456789012345678901234567890'])
    })

    it('should return empty array when no provider', async () => {
      const accounts = await connector.getAccounts()
      
      expect(accounts).toEqual([])
    })

    it('should handle accounts without 0x prefix', async () => {
      await connector.connect()
      mockProvider.accounts = ['1234567890123456789012345678901234567890'] // Without 0x
      
      const accounts = await connector.getAccounts()
      
      expect(accounts).toEqual(['0x1234567890123456789012345678901234567890'])
    })
  })

  describe('switchChain', () => {
    it('should switch chain successfully', async () => {
      await connector.connect()
      
      const chainChangedSpy = vi.fn()
      connector.on('chainChanged', chainChangedSpy)
      
      await connector.switchChain(137)
      
      expect(mockProvider.request).toHaveBeenCalledWith({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x89' }] // 137 in hex
      })
      expect(chainChangedSpy).toHaveBeenCalledWith(137)
    })

    it('should throw error when not connected', async () => {
      await expect(connector.switchChain(137)).rejects.toThrow('Not connected to wallet')
    })

    it('should handle chain not supported error', async () => {
      await connector.connect()
      mockProvider.request.mockRejectedValue({ code: 4902 })
      
      await expect(connector.switchChain(999)).rejects.toThrow('not added to wallet')
    })
  })

  describe('addChain', () => {
    it('should throw error as WalletConnect does not support adding chains', async () => {
      await expect(connector.addChain()).rejects.toThrow('does not support adding chains')
    })
  })

  describe('WalletConnect specific methods', () => {
    describe('getConnectionUri', () => {
      it('should get connection URI', async () => {
        const mockUri = 'wc:test-uri'
        
        // Mock provider once method
        mockProvider.once = vi.fn().mockImplementation((event, callback) => {
          if (event === 'display_uri') {
            setTimeout(() => callback(mockUri), 10)
          }
        })
        
        const uri = await connector.getConnectionUri()
        
        expect(uri).toBe(mockUri)
        expect(mockProvider.once).toHaveBeenCalledWith('display_uri', expect.any(Function))
      })

      it('should apply URI converter', async () => {
        const mockUri = 'wc:test-uri'
        const converter = (uri: string) => `converted:${uri}`
        
        mockProvider.once = vi.fn().mockImplementation((event, callback) => {
          if (event === 'display_uri') {
            setTimeout(() => callback(mockUri), 10)
          }
        })
        
        const uri = await connector.getConnectionUri(converter)
        
        expect(uri).toBe('converted:wc:test-uri')
      })

      it('should timeout if no URI received', async () => {
        mockProvider.once = vi.fn() // Don't call callback
        
        await expect(connector.getConnectionUri()).rejects.toThrow('timeout')
      }, 11000) // Longer timeout for this test
    })

    describe('getSession', () => {
      it('should return session when connected', async () => {
        await connector.connect()
        
        const session = connector.getSession()
        
        expect(session).toBe(mockProvider.session)
      })
    })

    describe('getPeerMetadata', () => {
      it('should return peer metadata when connected', async () => {
        await connector.connect()
        
        const metadata = connector.getPeerMetadata()
        
        expect(metadata).toBe(mockProvider.session.peer.metadata)
      })
    })

    describe('isSessionActive', () => {
      it('should return true when session is active', async () => {
        await connector.connect()
        
        const isActive = connector.isSessionActive()
        
        expect(isActive).toBe(true)
      })

      it('should return false when no session', () => {
        const isActive = connector.isSessionActive()
        
        expect(isActive).toBe(false)
      })
    })

    describe('getSupportedChains', () => {
      it('should return configured chains', () => {
        const chains = connector.getSupportedChains()
        
        expect(chains).toEqual([1, 137])
      })
    })

    describe('updateConfig', () => {
      it('should update configuration', () => {
        const newConfig = { chains: [1, 137, 56] }
        
        connector.updateConfig(newConfig)
        
        const chains = connector.getSupportedChains()
        expect(chains).toEqual([1, 137, 56])
      })
    })
  })
})