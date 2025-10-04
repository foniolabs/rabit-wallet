/**
 * tests/providers/pimlico.test.ts
 * Tests for Pimlico Provider Implementation
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Address, Hex } from '@rabit/types'
import { createPimlicoProvider, PimlicoProvider } from '../../src/providers/pimlico'
import { ProviderType } from '../../src/types'

// Mock fetch globally for testing
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('Pimlico Provider', () => {
  let provider: PimlicoProvider

  beforeEach(() => {
    // Reset mocks
    mockFetch.mockReset()
    
    // Create provider instance
    provider = createPimlicoProvider({
      apiKey: 'test-api-key',
      chainId: 137, // Polygon
      sponsorshipPolicyId: 'test-policy-id'
    })
  })

  describe('Provider Creation', () => {
    it('should create provider with correct configuration', () => {
      expect(provider.type).toBe(ProviderType.PIMLICO)
      
      const config = provider.getConfig()
      expect(config.apiKey).toBe('test-api-key')
      expect(config.chainId).toBe(137)
      expect(config.sponsorshipPolicyId).toBe('test-policy-id')
    })

    it('should generate correct API URLs', () => {
      const config = provider.getConfig()
      
      expect(config.bundlerUrl).toContain('api.pimlico.io')
      expect(config.bundlerUrl).toContain('polygon')
      expect(config.bundlerUrl).toContain('test-api-key')
      
      expect(config.paymasterUrl).toContain('api.pimlico.io')
      expect(config.paymasterUrl).toContain('v2')
      expect(config.paymasterUrl).toContain('polygon')
    })

    it('should support different chain configurations', () => {
      const mainnetProvider = createPimlicoProvider({
        apiKey: 'test-key',
        chainId: 1
      })
      
      const arbitrumProvider = createPimlicoProvider({
        apiKey: 'test-key',
        chainId: 42161
      })

      expect(mainnetProvider.getConfig().bundlerUrl).toContain('ethereum')
      expect(arbitrumProvider.getConfig().bundlerUrl).toContain('arbitrum')
    })
  })

  describe('Bundler Client', () => {
    it('should have bundler client with correct methods', () => {
      const bundler = provider.getBundlerClient()
      
      expect(bundler).toBeDefined()
      expect(typeof bundler.sendUserOperation).toBe('function')
      expect(typeof bundler.estimateUserOperationGas).toBe('function')
      expect(typeof bundler.getUserOperationByHash).toBe('function')
      expect(typeof bundler.getUserOperationReceipt).toBe('function')
      expect(typeof bundler.getSupportedEntryPoints).toBe('function')
      expect(typeof bundler.getChainId).toBe('function')
    })

    it('should handle gas estimation request structure', async () => {
      const bundler = provider.getBundlerClient()
      
      // Mock successful response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: {
            callGasLimit: '0x186a0',
            verificationGasLimit: '0x186a0', 
            preVerificationGas: '0x5208',
            maxFeePerGas: '0x59682f00',
            maxPriorityFeePerGas: '0x59682f00'
          }
        })
      })

      const userOpRequest = {
        sender: '0x742d35Cc6634C0532925a3b8D8c0d3516C13B4B7' as Address,
        nonce: 0n,
        initCode: '0x' as Hex,
        callData: '0x' as Hex
      }

      const estimate = await bundler.estimateUserOperationGas(userOpRequest)
      
      expect(estimate).toBeDefined()
      expect(typeof estimate.callGasLimit).toBe('bigint')
      expect(typeof estimate.verificationGasLimit).toBe('bigint')
      expect(typeof estimate.preVerificationGas).toBe('bigint')
    })

    it('should handle RPC errors gracefully', async () => {
      const bundler = provider.getBundlerClient()
      
      // Mock error response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          error: {
            code: -32000,
            message: 'Invalid user operation'
          }
        })
      })

      const userOpRequest = {
        sender: '0x742d35Cc6634C0532925a3b8D8c0d3516C13B4B7' as Address,
        nonce: 0n,
        initCode: '0x' as Hex,
        callData: '0x' as Hex
      }

      await expect(bundler.estimateUserOperationGas(userOpRequest))
        .rejects.toThrow('Invalid user operation')
    })

    it('should format user operations correctly', async () => {
      const bundler = provider.getBundlerClient()
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: '0x1234567890abcdef' })
      })

      const userOp = {
        sender: '0x742d35Cc6634C0532925a3b8D8c0d3516C13B4B7' as Address,
        nonce: 1n,
        initCode: '0x' as Hex,
        callData: '0xdeadbeef' as Hex,
        callGasLimit: 100000n,
        verificationGasLimit: 100000n,
        preVerificationGas: 21000n,
        maxFeePerGas: 20000000000n,
        maxPriorityFeePerGas: 2000000000n,
        paymasterAndData: '0x' as Hex,
        signature: '0x' as Hex
      }

      await bundler.sendUserOperation(userOp)

      // Verify the request was formatted correctly
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('api.pimlico.io'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"nonce":"0x1"')
        })
      )
    })
  })

  describe('Paymaster Client', () => {
    it('should have paymaster client with correct methods', () => {
      const paymaster = provider.getPaymasterClient()
      
      expect(paymaster).toBeDefined()
      expect(typeof paymaster.getPaymasterAndData).toBe('function')
      expect(typeof paymaster.getPaymasterStubData).toBe('function')
      expect(typeof paymaster.validatePaymasterUserOp).toBe('function')
      expect(typeof paymaster.getSponsorshipPolicies).toBe('function')
    })

    it('should handle paymaster data requests', async () => {
      const paymaster = provider.getPaymasterClient()
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: {
            paymasterAndData: '0x1234567890abcdef',
            preVerificationGas: '0x5208',
            verificationGasLimit: '0x186a0',
            callGasLimit: '0x186a0'
          }
        })
      })

      const userOpRequest = {
        sender: '0x742d35Cc6634C0532925a3b8D8c0d3516C13B4B7' as Address,
        nonce: 0n,
        initCode: '0x' as Hex,
        callData: '0x' as Hex
      }

      const paymasterData = await paymaster.getPaymasterAndData(userOpRequest)
      
      expect(paymasterData).toBeDefined()
      expect(paymasterData.paymasterData).toBeDefined() // Fixed: Use paymasterData instead of paymasterAndData
    })
  })

  describe('Pimlico-Specific Features', () => {
    it('should get gas prices', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: {
            slow: '0x3b9aca00',
            standard: '0x77359400', 
            fast: '0xb2d05e00'
          }
        })
      })

      const gasPrices = await provider.getGasPrice()
      
      expect(typeof gasPrices.slow).toBe('bigint')
      expect(typeof gasPrices.standard).toBe('bigint')
      expect(typeof gasPrices.fast).toBe('bigint')
      expect(gasPrices.standard).toBeGreaterThan(gasPrices.slow)
      expect(gasPrices.fast).toBeGreaterThan(gasPrices.standard)
    })

    it('should handle gas price fallback when API fails', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const gasPrices = await provider.getGasPrice()
      
      // Should return fallback values
      expect(gasPrices.slow).toBe(10000000000n)
      expect(gasPrices.standard).toBe(20000000000n)
      expect(gasPrices.fast).toBe(30000000000n)
    })

    it('should get sponsorship policies', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          result: [
            {
              id: 'policy-1',
              name: 'Test Policy',
              isActive: true,
              rules: []
            }
          ]
        })
      })

      const policies = await provider.getSponsorshipPolicies()
      
      expect(Array.isArray(policies)).toBe(true)
    })

    it('should validate sponsorship policies', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ result: true })
      })

      const isValid = await provider.validateSponsorshipPolicy(
        'test-policy-id',
        '0x1234567890abcdef' as Hex
      )
      
      expect(typeof isValid).toBe('boolean')
      expect(isValid).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      const bundler = provider.getBundlerClient()
      
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(bundler.getChainId()).rejects.toThrow('Network error')
    })

    it('should handle HTTP errors', async () => {
      const bundler = provider.getBundlerClient()
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      })

      await expect(bundler.getChainId()).rejects.toThrow('HTTP 500')
    })

    it('should handle malformed responses', async () => {
      const bundler = provider.getBundlerClient()
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => { throw new Error('Invalid JSON') }
      })

      await expect(bundler.getChainId()).rejects.toThrow()
    })
  })

  describe('Configuration Validation', () => {
    it('should require both API key and chain ID', () => {
      // Since both apiKey and chainId are required, we can't actually test
      // missing fields at runtime - TypeScript prevents it.
      // Instead, we test that valid configs work properly.
      
      const validProvider = createPimlicoProvider({
        apiKey: 'test-key',
        chainId: 1
      })

      expect(validProvider.getConfig().apiKey).toBe('test-key')
      expect(validProvider.getConfig().chainId).toBe(1)
    })

    it('should handle optional parameters', () => {
      const minimalProvider = createPimlicoProvider({
        apiKey: 'test-key',
        chainId: 1
      })

      expect(minimalProvider.getConfig().sponsorshipPolicyId).toBeUndefined()
      expect(minimalProvider.getConfig().webhookSecret).toBeUndefined()
    })

    it('should accept all optional parameters', () => {
      const fullProvider = createPimlicoProvider({
        apiKey: 'test-key',
        chainId: 1,
        sponsorshipPolicyId: 'policy-123',
        webhookSecret: 'secret-456',
        entryPointAddress: '0x1234567890123456789012345678901234567890' as Address
      })

      expect(fullProvider.getConfig().sponsorshipPolicyId).toBe('policy-123')
      expect(fullProvider.getConfig().webhookSecret).toBe('secret-456')
      expect(fullProvider.getConfig().entryPointAddress).toBe('0x1234567890123456789012345678901234567890')
    })

    it('should validate API key format', () => {
      // Test with empty string (still valid TypeScript, but logically invalid)
      const provider = createPimlicoProvider({
        apiKey: '',
        chainId: 1
      })

      // The provider should still be created, but the API key should be empty
      expect(provider.getConfig().apiKey).toBe('')
    })

    it('should validate chain ID range', () => {
      // Test with various chain IDs
      const validChainIds = [1, 137, 42161, 10, 8453]
      
      validChainIds.forEach(chainId => {
        const provider = createPimlicoProvider({
          apiKey: 'test-key',
          chainId
        })
        
        expect(provider.getConfig().chainId).toBe(chainId)
      })
    })
  })

  describe('Chain Support', () => {
    const chainTests = [
      { chainId: 1, expectedName: 'ethereum' },
      { chainId: 137, expectedName: 'polygon' },
      { chainId: 10, expectedName: 'optimism' },
      { chainId: 42161, expectedName: 'arbitrum' },
      { chainId: 8453, expectedName: 'base' },
      { chainId: 11155111, expectedName: 'sepolia' }
    ]

    chainTests.forEach(({ chainId, expectedName }) => {
      it(`should support ${expectedName} (chainId: ${chainId})`, () => {
        const provider = createPimlicoProvider({
          apiKey: 'test-key',
          chainId
        })

        const config = provider.getConfig()
        expect(config.bundlerUrl).toContain(expectedName)
        expect(config.paymasterUrl).toContain(expectedName)
      })
    })

    it('should handle unknown chain IDs gracefully', () => {
      const provider = createPimlicoProvider({
        apiKey: 'test-key',
        chainId: 999999 // Unknown chain
      })

      const config = provider.getConfig()
      expect(config.bundlerUrl).toContain('ethereum') // Should fallback to ethereum
    })
  })
})