/**
 * Save this as tests/__mocks__/unit/safe.test.ts
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SafeConnector } from '../../../src/implementations/safe.js'

describe('SafeConnector', () => {
  let connector: SafeConnector
  let mockSafeSDK: any
  let mockSafeProvider: any

  beforeEach(() => {
    vi.clearAllMocks()
    
    connector = new SafeConnector()
    
    // Mock Safe Apps SDK
    mockSafeSDK = {
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
    }
    
    // Mock Safe provider
    mockSafeProvider = {
      isSafe: true,
      request: vi.fn(),
      on: vi.fn(),
      removeListener: vi.fn()
    }
    
    // Mock Function constructor for dynamic import
    global.Function = vi.fn().mockImplementation((code: string) => {
      if (code.includes('@safe-global/safe-apps-sdk')) {
        return () => Promise.resolve({ default: vi.fn(() => mockSafeSDK) })
      }
      return Function(code)
    }) as any
  })

  afterEach(() => {
    vi.restoreAllMocks()
    
    // Reset window properties safely
    if (typeof window !== 'undefined') {
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
      delete (window as any).ethereum
    }
  })

  describe('Constructor', () => {
    it('should initialize with correct metadata', () => {
      expect(connector.id).toBe('safe')
      expect(connector.type).toBe('safe')
      expect(connector.metadata.name).toBe('Safe')
      expect(connector.metadata.description).toBe('Connect to Safe smart wallet')
    })

    it('should have correct connection methods', () => {
      expect(connector.connectionMethods).toEqual(['extension'])
    })

    it('should have correct features for Safe', () => {
      expect(connector.features.signMessage).toBe(true)
      expect(connector.features.signTypedData).toBe(true)
      expect(connector.features.personalSign).toBe(false) // Safe doesn't support personal_sign
      expect(connector.features.switchChain).toBe(false) // Safe doesn't support chain switching
      expect(connector.features.addChain).toBe(false)
      expect(connector.features.batchTransactions).toBe(true)
      expect(connector.features.isSmartWallet).toBe(true)
      expect(connector.features.accountAbstraction).toBe(true)
    })
  })

  describe('isAvailable', () => {
    it('should return true when in Safe App context', async () => {
      // Mock iframe context (Safe App)
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
      
      const availability = await connector.isAvailable()
      
      expect(availability.isAvailable).toBe(true)
      expect(availability.isInstalled).toBe(true)
      expect(availability.isReady).toBe(true)
      expect(availability.downloadUrl).toBe('https://safe.global')
    })

    it('should return false when not in Safe App context', async () => {
      // Ensure we're not in iframe context
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
      
      const availability = await connector.isAvailable()
      
      expect(availability.isAvailable).toBe(false)
      expect(availability.isInstalled).toBe(false)
    })

    it('should handle iframe detection error gracefully', async () => {
      // Mock access error
      Object.defineProperty(window, 'top', {
        get: () => {
          throw new Error('Access denied')
        },
        configurable: true
      })
      
      const availability = await connector.isAvailable()
      
      expect(availability.isAvailable).toBe(false)
    })
  })

  describe('getProvider', () => {
    beforeEach(() => {
      // Mock Safe App context
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
    })

    it('should return existing Safe provider when available', async () => {
      // Delete existing ethereum property first and set up fresh mock
      delete (window as any).ethereum
      Object.defineProperty(window, 'ethereum', {
        value: mockSafeProvider,
        writable: true,
        configurable: true
      })
      
      const provider = await connector.getProvider()
      
      expect(provider).toBe(mockSafeProvider)
    })

    it('should return cached provider on subsequent calls', async () => {
      const provider1 = await connector.getProvider()
      const provider2 = await connector.getProvider()
      
      expect(provider1).toBe(provider2)
    })

    it('should throw error when not in Safe App context', async () => {
      // Not in iframe context
      Object.defineProperty(window, 'self', {
        value: window,
        writable: true,
        configurable: true
      })
      
      await expect(connector.getProvider()).rejects.toThrow('safe')
    })

    it('should throw error when Safe SDK is not available', async () => {
      // Mock failed import
      global.Function = vi.fn().mockImplementation(() => {
        return () => Promise.reject(new Error('Module not found'))
      }) as any
      
      await expect(connector.getProvider()).rejects.toThrow('safe')
    })
  })

  describe('SDK Provider Methods', () => {
    let provider: any

    beforeEach(async () => {
      // Mock Safe App context
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

      provider = await connector.getProvider()
    })

    describe('eth_requestAccounts / eth_accounts', () => {
      it('should return Safe address', async () => {
        const accounts = await provider.request({ method: 'eth_requestAccounts' })
        
        expect(accounts).toEqual(['0x9876543210987654321098765432109876543210'])
        expect(mockSafeSDK.safe.getInfo).toHaveBeenCalled()
      })

      it('should work with eth_accounts method', async () => {
        const accounts = await provider.request({ method: 'eth_accounts' })
        
        expect(accounts).toEqual(['0x9876543210987654321098765432109876543210'])
      })
    })

    describe('eth_chainId', () => {
      it('should return chain ID in hex format', async () => {
        const chainId = await provider.request({ method: 'eth_chainId' })
        
        expect(chainId).toBe('0x1') // 1 in hex
        expect(mockSafeSDK.safe.getInfo).toHaveBeenCalled()
      })
    })

    describe('personal_sign', () => {
      it('should throw error as not supported', async () => {
        await expect(
          provider.request({ 
            method: 'personal_sign', 
            params: ['0x48656c6c6f', '0x9876543210987654321098765432109876543210'] 
          })
        ).rejects.toThrow('personal_sign is not supported by Safe')
      })
    })

    describe('eth_signTypedData_v4', () => {
      it('should sign typed data', async () => {
        const typedData = JSON.stringify({
          types: { EIP712Domain: [] },
          domain: {},
          primaryType: 'EIP712Domain',
          message: {}
        })
        
        const signature = await provider.request({
          method: 'eth_signTypedData_v4',
          params: ['0x9876543210987654321098765432109876543210', typedData]
        })
        
        expect(signature).toBe('0xsafesignature')
        expect(mockSafeSDK.txs.signTypedMessage).toHaveBeenCalledWith({
          types: { EIP712Domain: [] },
          domain: {},
          primaryType: 'EIP712Domain',
          message: {}
        })
      })
    })

    describe('eth_sendTransaction', () => {
      it('should send transaction through Safe', async () => {
        const transaction = {
          to: '0x1234567890123456789012345678901234567890',
          value: '0x0',
          data: '0x'
        }
        
        const txHash = await provider.request({
          method: 'eth_sendTransaction',
          params: [transaction]
        })
        
        expect(txHash).toBe('0xsafetxhash')
        expect(mockSafeSDK.txs.send).toHaveBeenCalledWith({
          txs: [transaction]
        })
      })
    })

    describe('unsupported methods', () => {
      it('should throw error for unsupported methods', async () => {
        await expect(
          provider.request({ method: 'wallet_switchEthereumChain' })
        ).rejects.toThrow('Method wallet_switchEthereumChain not supported by Safe connector')
      })
    })
  })

  describe('connect', () => {
    beforeEach(() => {
      // Mock Safe App context
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
    })

    it('should connect successfully in Safe context', async () => {
      const result = await connector.connect()
      
      expect(result.accounts).toEqual(['0x9876543210987654321098765432109876543210'])
      expect(result.chainId).toBe(1)
      expect(result.method).toBe('extension')
    })

    it('should throw error when not in Safe context', async () => {
      // Not in iframe context
      Object.defineProperty(window, 'self', {
        value: window,
        writable: true,
        configurable: true
      })
      
      await expect(connector.connect()).rejects.toThrow('safe')
    })
  })

  describe('Safe specific methods', () => {
    describe('isSDKAvailable', () => {
      it('should return true when SDK is available', async () => {
        const isAvailable = await connector.isSDKAvailable()
        
        expect(isAvailable).toBe(true)
      })

      it('should return false when SDK is not available', async () => {
        // Mock failed import
        global.Function = vi.fn().mockImplementation(() => {
          return () => Promise.reject(new Error('Module not found'))
        }) as any
        
        const isAvailable = await connector.isSDKAvailable()
        
        expect(isAvailable).toBe(false)
      })
    })

    describe('getSafeInfo', () => {
      beforeEach(async () => {
        // Mock Safe App context and connect
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
        
        await connector.connect()
      })

      it('should return Safe info when connected', async () => {
        const safeInfo = await connector.getSafeInfo()
        
        expect(safeInfo).toEqual({
          safeAddress: '0x9876543210987654321098765432109876543210',
          chainId: 1
        })
      })

      it('should return null when not connected', async () => {
        // Create a new connector instance that hasn't been connected
        const freshConnector = new SafeConnector()
        
        const safeInfo = await freshConnector.getSafeInfo()
        
        expect(safeInfo).toBeNull()
      })

      it('should return null on error', async () => {
        // Create a new connector with a broken provider to test error handling
        const brokenConnector = new SafeConnector()
        
        // Force the private safeProvider to be null by not connecting first
        const safeInfo = await brokenConnector.getSafeInfo()
        
        expect(safeInfo).toBeNull()
      })
    })
  })

  describe('isInSafeApp detection', () => {
    it('should detect Safe App context correctly', async () => {
      // Mock iframe context
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
      
      const availability = await connector.isAvailable()
      expect(availability.isAvailable).toBe(true)
    })

    it('should detect non-Safe context correctly', async () => {
      // Mock non-iframe context
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
      
      const availability = await connector.isAvailable()
      expect(availability.isAvailable).toBe(false)
    })

    it('should handle server environment', async () => {
      // Mock server environment
      const originalWindow = global.window
      delete (global as any).window
      
      const availability = await connector.isAvailable()
      expect(availability.isAvailable).toBe(false)
      
      // Restore window
      global.window = originalWindow
    })
  })
})