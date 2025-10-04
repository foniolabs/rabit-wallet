/**
 * Save this as tests/__mocks__/unit/mock.test.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MockConnector } from '../../../src/implementations/mock.js'

describe('MockConnector', () => {
  let connector: MockConnector

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Constructor', () => {
    it('should initialize with default config', () => {
      connector = new MockConnector()
      
      expect(connector.id).toBe('mock')
      expect(connector.type).toBe('injected')
      expect(connector.metadata.name).toBe('Mock Wallet')
      expect(connector.status).toBe('disconnected')
    })

    it('should initialize with custom config', () => {
      const config = {
        name: 'Custom Mock Wallet',
        accounts: ['0xabcdef1234567890abcdef1234567890abcdef12' as any],
        chainId: 137,
        isConnected: true
      }
      
      connector = new MockConnector(config)
      
      expect(connector.metadata.name).toBe('Custom Mock Wallet')
      expect(connector.status).toBe('connected')
    })

    it('should merge custom features with defaults', () => {
      const config = {
        features: {
          batchTransactions: true,
          gaslessTransactions: true
        }
      }
      
      connector = new MockConnector(config)
      
      expect(connector.features.signMessage).toBe(true) // default
      expect(connector.features.batchTransactions).toBe(true) // overridden
      expect(connector.features.gaslessTransactions).toBe(true) // overridden
    })
  })

  describe('isAvailable', () => {
    beforeEach(() => {
      connector = new MockConnector()
    })

    it('should always return true', async () => {
      const availability = await connector.isAvailable()
      
      expect(availability.isAvailable).toBe(true)
      expect(availability.isInstalled).toBe(true)
      expect(availability.isReady).toBe(true)
      expect(availability.platforms[0].isBrowser).toBe(true)
    })
  })

  describe('getProvider', () => {
    beforeEach(() => {
      connector = new MockConnector()
    })

    it('should return mock provider', async () => {
      const provider = await connector.getProvider()
      
      expect(provider).toBeDefined()
      expect(typeof provider.request).toBe('function')
    })
  })

  describe('connect', () => {
    it('should connect with default config', async () => {
      connector = new MockConnector()
      
      const result = await connector.connect()
      
      expect(result.accounts).toEqual(['0x1234567890123456789012345678901234567890'])
      expect(result.chainId).toBe(1)
      expect(result.method).toBe('extension')
      expect(connector.status).toBe('connected')
    })

    it('should connect with custom config', async () => {
      const config = {
        accounts: ['0xabcdef1234567890abcdef1234567890abcdef12' as any],
        chainId: 137
      }
      
      connector = new MockConnector(config)
      
      const result = await connector.connect()
      
      expect(result.accounts).toEqual(['0xabcdef1234567890abcdef1234567890abcdef12'])
      expect(result.chainId).toBe(137)
    })

    it('should emit connect event', async () => {
      connector = new MockConnector()
      
      const connectSpy = vi.fn()
      connector.on('connect', connectSpy)
      
      await connector.connect()
      
      expect(connectSpy).toHaveBeenCalledWith({
        accounts: ['0x1234567890123456789012345678901234567890'],
        chainId: 1,
        method: 'extension',
        data: { provider: expect.any(Object) }
      })
    })

    it('should respect connection delay', async () => {
      const delay = 100
      connector = new MockConnector({ connectionDelay: delay })
      
      const startTime = Date.now()
      await connector.connect()
      const endTime = Date.now()
      
      expect(endTime - startTime).toBeGreaterThanOrEqual(delay - 10) // Allow small tolerance
    })

    it('should fail when shouldFailConnection is true', async () => {
      connector = new MockConnector({ shouldFailConnection: true })
      
      await expect(connector.connect()).rejects.toThrow('Mock connection failed')
    })

    it('should use custom connection method', async () => {
      connector = new MockConnector()
      
      const result = await connector.connect({ method: 'mobile' })
      
      expect(result.method).toBe('mobile')
    })
  })

  describe('Mock Provider Methods', () => {
    let provider: any

    beforeEach(async () => {
      connector = new MockConnector({
        accounts: ['0xabcdef1234567890abcdef1234567890abcdef12' as any],
        chainId: 137
      })
      provider = await connector.getProvider()
    })

    describe('eth_requestAccounts / eth_accounts', () => {
      it('should return configured accounts', async () => {
        const accounts = await provider.request({ method: 'eth_requestAccounts' })
        
        expect(accounts).toEqual(['0xabcdef1234567890abcdef1234567890abcdef12'])
      })

      it('should work with eth_accounts method', async () => {
        const accounts = await provider.request({ method: 'eth_accounts' })
        
        expect(accounts).toEqual(['0xabcdef1234567890abcdef1234567890abcdef12'])
      })
    })

    describe('eth_chainId', () => {
      it('should return chain ID in hex format', async () => {
        const chainId = await provider.request({ method: 'eth_chainId' })
        
        expect(chainId).toBe('0x89') // 137 in hex
      })
    })

    describe('signing methods', () => {
      it('should return mock signature for personal_sign', async () => {
        const signature = await provider.request({
          method: 'personal_sign',
          params: ['0x48656c6c6f', '0xabcdef1234567890abcdef1234567890abcdef12']
        })
        
        expect(signature).toBe('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1b')
      })

      it('should return mock signature for eth_signTypedData_v4', async () => {
        const signature = await provider.request({
          method: 'eth_signTypedData_v4',
          params: ['0xabcdef1234567890abcdef1234567890abcdef12', '{}']
        })
        
        expect(signature).toBe('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1b')
      })
    })

    describe('transaction methods', () => {
      it('should return mock transaction hash', async () => {
        const txHash = await provider.request({
          method: 'eth_sendTransaction',
          params: [{
            to: '0x1234567890123456789012345678901234567890',
            value: '0x0'
          }]
        })
        
        expect(txHash).toBe('0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12')
      })
    })

    describe('wallet methods', () => {
      it('should handle wallet_switchEthereumChain', async () => {
        const result = await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x1' }]
        })
        
        expect(result).toBeNull()
      })

      it('should handle wallet_addEthereumChain', async () => {
        const result = await provider.request({
          method: 'wallet_addEthereumChain',
          params: [{}]
        })
        
        expect(result).toBeNull()
      })

      it('should handle wallet_watchAsset', async () => {
        const result = await provider.request({
          method: 'wallet_watchAsset',
          params: {}
        })
        
        expect(result).toBe(true)
      })
    })

    describe('unsupported methods', () => {
      it('should throw error for unsupported methods', async () => {
        await expect(
          provider.request({ method: 'unsupported_method' })
        ).rejects.toThrow('Mock provider: Method unsupported_method not implemented')
      })
    })
  })

  describe('Mock-specific testing methods', () => {
    beforeEach(() => {
      connector = new MockConnector()
    })

    describe('setAccounts', () => {
      it('should update accounts and emit event', async () => {
        await connector.connect()
        
        const accountsChangedSpy = vi.fn()
        connector.on('accountsChanged', accountsChangedSpy)
        
        const newAccounts = ['0xnewaccount1234567890123456789012345678' as any]
        connector.setAccounts(newAccounts)
        
        expect(accountsChangedSpy).toHaveBeenCalledWith(newAccounts)
        
        const provider = await connector.getProvider()
        const accounts = await provider.request({ method: 'eth_accounts' })
        expect(accounts).toEqual(newAccounts)
      })
    })

    describe('setChainId', () => {
      it('should update chain ID and emit event', async () => {
        await connector.connect()
        
        const chainChangedSpy = vi.fn()
        connector.on('chainChanged', chainChangedSpy)
        
        connector.setChainId(56)
        
        expect(chainChangedSpy).toHaveBeenCalledWith(56)
        
        const provider = await connector.getProvider()
        const chainId = await provider.request({ method: 'eth_chainId' })
        expect(chainId).toBe('0x38') // 56 in hex
      })
    })

    describe('simulateDisconnect', () => {
      it('should simulate disconnection', async () => {
        await connector.connect()
        
        const disconnectSpy = vi.fn()
        connector.on('disconnect', disconnectSpy)
        
        connector.simulateDisconnect()
        
        expect(connector.status).toBe('disconnected')
        expect(disconnectSpy).toHaveBeenCalled()
      })
    })

    describe('simulateAccountsChanged', () => {
      it('should simulate accounts changed event', async () => {
        await connector.connect()
        
        const accountsChangedSpy = vi.fn()
        connector.on('accountsChanged', accountsChangedSpy)
        
        const newAccounts = ['0xnewaccount1234567890123456789012345678' as any]
        connector.simulateAccountsChanged(newAccounts)
        
        expect(accountsChangedSpy).toHaveBeenCalledWith(newAccounts)
      })
    })

    describe('simulateChainChanged', () => {
      it('should simulate chain changed event', async () => {
        await connector.connect()
        
        const chainChangedSpy = vi.fn()
        connector.on('chainChanged', chainChangedSpy)
        
        connector.simulateChainChanged(56)
        
        expect(chainChangedSpy).toHaveBeenCalledWith(56)
      })
    })

    describe('simulateError', () => {
      it('should simulate error state', async () => {
        await connector.connect()
        
        const statusChangedSpy = vi.fn()
        connector.on('statusChanged', statusChangedSpy)
        
        const error = new Error('Simulated error')
        
        expect(() => connector.simulateError(error)).toThrow('Simulated error')
        expect(connector.status).toBe('error')
        expect(statusChangedSpy).toHaveBeenCalledWith('error')
      })
    })

    describe('updateConfig', () => {
      it('should update configuration at runtime', async () => {
        await connector.connect()
        
        const newConfig = {
          accounts: ['0xupdatedaccount123456789012345678901234' as any],
          chainId: 56
        }
        
        connector.updateConfig(newConfig)
        
        const provider = await connector.getProvider()
        const accounts = await provider.request({ method: 'eth_accounts' })
        const chainId = await provider.request({ method: 'eth_chainId' })
        
        expect(accounts).toEqual(['0xupdatedaccount123456789012345678901234'])
        expect(chainId).toBe('0x38') // 56 in hex
      })
    })
  })

  describe('Event handling', () => {
    beforeEach(() => {
      connector = new MockConnector()
    })

    it('should handle provider events', async () => {
      const provider = await connector.getProvider()
      
      const listener = vi.fn()
      provider.on('test', listener)
      provider.removeListener('test', listener)
      
      // Should not throw errors
      expect(listener).not.toHaveBeenCalled()
    })
  })
})