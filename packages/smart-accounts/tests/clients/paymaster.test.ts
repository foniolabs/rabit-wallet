/**
 * tests/clients/paymaster.test.ts
 * Comprehensive tests for PaymasterClient - FIXED VERSION
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { Address, Hex } from '@rabit/types'
import { PaymasterClient } from '../../src/clients/paymaster'
import { 
  ProviderConfig, 
  UserOperationRequest, 
  PaymasterData,
  SponsorshipPolicy,
  RpcError,
  ProviderType
} from '../../src/types'

describe('PaymasterClient', () => {
  let paymasterClient: PaymasterClient
  let mockConfig: ProviderConfig
  let mockFetch: any

  beforeEach(() => {
    // Setup mock configuration
    mockConfig = {
      type: ProviderType.PIMLICO,
      apiKey: 'test-api-key',
      chainId: 137,
      bundlerUrl: 'https://api.pimlico.io/v1/polygon/rpc?apikey=test-api-key',
      paymasterUrl: 'https://api.pimlico.io/v2/polygon/rpc?apikey=test-api-key'
    }

    // Create paymaster client instance
    paymasterClient = new PaymasterClient(mockConfig)

    // Mock fetch globally
    mockFetch = vi.fn()
    global.fetch = mockFetch
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Constructor', () => {
    it('should initialize with provided config', () => {
      expect(paymasterClient).toBeDefined()
      expect(paymasterClient['config']).toEqual(mockConfig)
      expect(paymasterClient['rpcUrl']).toBe(mockConfig.paymasterUrl)
    })

    it('should generate default paymaster URL when not provided', () => {
      const configWithoutUrl: ProviderConfig = {
        type: ProviderType.PIMLICO,
        apiKey: 'test-key',
        chainId: 1,
        bundlerUrl: '',
        paymasterUrl: ''
      }

      const client = new PaymasterClient(configWithoutUrl)
      expect(client['rpcUrl']).toContain('ethereum')
      expect(client['rpcUrl']).toContain('test-key')
    })

    it('should handle different provider types', () => {
      const alchemyConfig: ProviderConfig = {
        type: ProviderType.ALCHEMY,
        apiKey: 'test-key',
        chainId: 1,
        bundlerUrl: '',
        paymasterUrl: ''
      }

      const client = new PaymasterClient(alchemyConfig)
      expect(client['rpcUrl']).toContain('alchemy.com')
    })
  })

  describe('getPaymasterAndData', () => {
    const mockUserOpRequest: UserOperationRequest = {
      sender: '0x742d35Cc6634C0532925a3b8D8c0d3516C13B4B7' as Address,
      nonce: 0n,
      initCode: '0x' as Hex,
      callData: '0xdeadbeef' as Hex,
      callGasLimit: 100000n,
      verificationGasLimit: 100000n,
      preVerificationGas: 21000n
    }

    it('should get paymaster and data successfully', async () => {
      const mockPaymasterResponse = {
        paymaster: '0x1234567890123456789012345678901234567890',
        paymasterData: '0xabcdef',
        paymasterVerificationGasLimit: '0x186a0',
        paymasterPostOpGasLimit: '0x5208'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          id: 1,
          result: mockPaymasterResponse
        })
      })

      const result = await paymasterClient.getPaymasterAndData(mockUserOpRequest)
      
      expect(result.paymaster).toBe(mockPaymasterResponse.paymaster)
      expect(result.paymasterData).toBe(mockPaymasterResponse.paymasterData)
      expect(result.paymasterVerificationGasLimit).toBe(BigInt(mockPaymasterResponse.paymasterVerificationGasLimit))
      expect(result.paymasterPostOpGasLimit).toBe(BigInt(mockPaymasterResponse.paymasterPostOpGasLimit))
    })

    it('should handle minimal paymaster response', async () => {
      const mockPaymasterResponse = {
        paymaster: '0x1234567890123456789012345678901234567890'
        // Missing optional fields
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          id: 1,
          result: mockPaymasterResponse
        })
      })

      const result = await paymasterClient.getPaymasterAndData(mockUserOpRequest)
      
      expect(result.paymaster).toBe(mockPaymasterResponse.paymaster)
      expect(result.paymasterData).toBe('0x')
      expect(result.paymasterVerificationGasLimit).toBeUndefined()
      expect(result.paymasterPostOpGasLimit).toBeUndefined()
    })

    it('should include context in request when provided', async () => {
      const context = { policyId: 'test-policy' }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          id: 1,
          result: { paymaster: '0x1234567890123456789012345678901234567890' }
        })
      })

      await paymasterClient.getPaymasterAndData(mockUserOpRequest, context)

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.params[2]).toEqual(context)
    })

    it('should use correct method for different providers', async () => {
      // Test Pimlico method
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          id: 1,
          result: { paymaster: '0x1234567890123456789012345678901234567890' }
        })
      })

      await paymasterClient.getPaymasterAndData(mockUserOpRequest)

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.method).toBe('pm_sponsorUserOperation')
    })

    it('should handle RPC errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          id: 1,
          error: {
            code: -32602,
            message: 'Sponsorship not available',
            data: { reason: 'Daily limit exceeded' }
          }
        })
      })

      await expect(paymasterClient.getPaymasterAndData(mockUserOpRequest))
        .rejects.toThrow('Sponsorship not available')
    })
  })

  describe('getPaymasterStubData', () => {
    const mockUserOpRequest: UserOperationRequest = {
      sender: '0x742d35Cc6634C0532925a3b8D8c0d3516C13B4B7' as Address,
      nonce: 0n,
      initCode: '0x' as Hex,
      callData: '0xdeadbeef' as Hex
    }

    it('should get paymaster stub data successfully', async () => {
      const mockStubResponse = {
        paymaster: '0x1234567890123456789012345678901234567890',
        paymasterData: '0xstubdata'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          id: 1,
          result: mockStubResponse
        })
      })

      const result = await paymasterClient.getPaymasterStubData(mockUserOpRequest)
      
      expect(result.paymaster).toBe(mockStubResponse.paymaster)
      expect(result.paymasterData).toBe(mockStubResponse.paymasterData)
    })

    it('should use correct stub method for different providers', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          id: 1,
          result: { paymaster: '0x1234567890123456789012345678901234567890' }
        })
      })

      await paymasterClient.getPaymasterStubData(mockUserOpRequest)

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.method).toBe('pm_getPaymasterStubData')
    })
  })

  describe('validatePaymasterUserOp', () => {
    const mockUserOpRequest: UserOperationRequest = {
      sender: '0x742d35Cc6634C0532925a3b8D8c0d3516C13B4B7' as Address,
      nonce: 0n,
      initCode: '0x' as Hex,
      callData: '0xdeadbeef' as Hex
    }

    it('should validate user operation successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          id: 1,
          result: true
        })
      })

      const result = await paymasterClient.validatePaymasterUserOp(mockUserOpRequest)
      expect(result).toBe(true)
    })

    it('should return false for invalid user operation', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          id: 1,
          result: false
        })
      })

      const result = await paymasterClient.validatePaymasterUserOp(mockUserOpRequest)
      expect(result).toBe(false)
    })

    it('should return true when method not found (fallback)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          id: 1,
          error: {
            code: -32601,
            message: 'Method not found'
          }
        })
      })

      const result = await paymasterClient.validatePaymasterUserOp(mockUserOpRequest)
      expect(result).toBe(true)
    })

    it('should throw for other RPC errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          id: 1,
          error: {
            code: -32602,
            message: 'Invalid params'
          }
        })
      })

      await expect(paymasterClient.validatePaymasterUserOp(mockUserOpRequest))
        .rejects.toThrow('Invalid params')
    })
  })

  describe('getSponsorshipPolicies', () => {
    it('should get sponsorship policies successfully', async () => {
      const mockPolicies = [
        {
          id: 'policy-1',
          name: 'Basic Sponsorship',
          isActive: true,
          rules: ['rule1', 'rule2'],
          gasLimits: {
            maxGasPerTransaction: '0x186a0',
            maxGasPerDay: '0x989680',
            maxGasPerWeek: '0x5f5e100'
          }
        },
        {
          id: 'policy-2',
          name: 'Premium Sponsorship',
          isActive: false,
          rules: [],
          gasLimits: {}
        }
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          id: 1,
          result: mockPolicies
        })
      })

      const result = await paymasterClient.getSponsorshipPolicies()
      
      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('policy-1')
      expect(result[0].name).toBe('Basic Sponsorship')
      expect(result[0].isActive).toBe(true)
      expect(result[0].gasLimits.maxGasPerTransaction).toBe(BigInt(mockPolicies[0].gasLimits.maxGasPerTransaction))
      expect(result[1].gasLimits.maxGasPerTransaction).toBeUndefined()
    })

    it('should return empty array when method not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          id: 1,
          error: {
            code: -32601,
            message: 'Method not found'
          }
        })
      })

      const result = await paymasterClient.getSponsorshipPolicies()
      expect(result).toEqual([])
    })

    it('should throw for other RPC errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          id: 1,
          error: {
            code: -32603,
            message: 'Internal error'
          }
        })
      })

      await expect(paymasterClient.getSponsorshipPolicies())
        .rejects.toThrow('Internal error')
    })
  })

  describe('Provider-specific methods', () => {
    it('should use correct method for Alchemy provider', () => {
      const alchemyConfig: ProviderConfig = {
        type: ProviderType.ALCHEMY,
        apiKey: 'test-key',
        chainId: 1,
        bundlerUrl: '',
        paymasterUrl: ''
      }

      const client = new PaymasterClient(alchemyConfig)
      expect(client['getPaymasterMethod']()).toBe('alchemy_requestGasAndPaymasterAndData')
      expect(client['getPaymasterStubMethod']()).toBe('alchemy_requestPaymasterAndData')
    })

    it('should use correct method for Biconomy provider', () => {
      const biconomyConfig: ProviderConfig = {
        type: ProviderType.BICONOMY,
        apiKey: 'test-key',
        chainId: 137,
        bundlerUrl: '',
        paymasterUrl: ''
      }

      const client = new PaymasterClient(biconomyConfig)
      expect(client['getPaymasterMethod']()).toBe('pm_sponsorUserOperation')
      expect(client['getPaymasterStubMethod']()).toBe('pm_getPaymasterStubData')
    })

    it('should throw for unknown provider type', () => {
      const unknownConfig: ProviderConfig = {
        type: 'unknown' as any,
        apiKey: 'test-key',
        chainId: 1,
        bundlerUrl: '',
        paymasterUrl: ''
      }

      expect(() => new PaymasterClient(unknownConfig))
        .toThrow('Unsupported provider type: unknown')
    })
  })

  describe('URL generation', () => {
    it('should generate correct URLs for different providers', () => {
      const providers = [
        {
          type: ProviderType.PIMLICO,
          expected: 'api.pimlico.io/v2',
          chainId: 137
        },
        {
          type: ProviderType.ALCHEMY,
          expected: 'alchemy.com/v2',
          chainId: 1
        },
        {
          type: ProviderType.STACKUP,
          expected: 'api.stackup.sh/v1/paymaster',
          chainId: 1
        },
        {
          type: ProviderType.BICONOMY,
          expected: 'paymaster.biconomy.io/api/v1',
          chainId: 137
        },
        {
          type: ProviderType.ZERODEV,
          expected: 'rpc.zerodev.app/api/v2/paymaster',
          chainId: 1
        }
      ]

      providers.forEach(({ type, expected, chainId }) => {
        const config: ProviderConfig = {
          type: type,
          apiKey: 'test-key',
          chainId,
          bundlerUrl: '',
          paymasterUrl: ''
        }
        const client = new PaymasterClient(config)
        expect(client['rpcUrl']).toContain(expected)
      })
    })

    it('should throw for unsupported provider type', () => {
      const config: ProviderConfig = {
        type: 'unsupported' as any,
        apiKey: 'test-key',
        chainId: 1,
        bundlerUrl: '',
        paymasterUrl: ''
      }

      expect(() => new PaymasterClient(config))
        .toThrow('Unsupported provider type: unsupported')
    })
  })

  describe('Chain name mapping', () => {
    it('should map common chain IDs correctly', () => {
      const chains = [
        { chainId: 1, expected: 'ethereum' },
        { chainId: 137, expected: 'polygon' },
        { chainId: 10, expected: 'optimism' },
        { chainId: 42161, expected: 'arbitrum' },
        { chainId: 8453, expected: 'base' },
        { chainId: 56, expected: 'bsc' },
        { chainId: 43114, expected: 'avalanche' }
      ]

      chains.forEach(({ chainId, expected }) => {
        const config: ProviderConfig = {
          type: ProviderType.PIMLICO,
          apiKey: 'test-key',
          chainId,
          bundlerUrl: '',
          paymasterUrl: ''
        }
        const client = new PaymasterClient(config)
        expect(client['rpcUrl']).toContain(expected)
      })
    })

    it('should fallback to ethereum for unknown chain IDs', () => {
      const config: ProviderConfig = {
        type: ProviderType.PIMLICO,
        apiKey: 'test-key',
        chainId: 999999,
        bundlerUrl: '',
        paymasterUrl: ''
      }
      const client = new PaymasterClient(config)
      expect(client['rpcUrl']).toContain('ethereum')
    })
  })

  describe('User operation serialization', () => {
    it('should serialize user operation request correctly', async () => {
      const userOpRequest: UserOperationRequest = {
        sender: '0x742d35Cc6634C0532925a3b8D8c0d3516C13B4B7' as Address,
        nonce: 42n,
        initCode: '0xdeadbeef' as Hex,
        callData: '0x12345678' as Hex,
        callGasLimit: 100000n,
        verificationGasLimit: 200000n,
        preVerificationGas: 21000n,
        maxFeePerGas: 20000000000n,
        maxPriorityFeePerGas: 2000000000n,
        paymasterAndData: '0xabcdef' as Hex,
        signature: '0x987654321' as Hex
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          id: 1,
          result: { paymaster: '0x1234567890123456789012345678901234567890' }
        })
      })

      await paymasterClient.getPaymasterAndData(userOpRequest)

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      const serializedUserOp = callBody.params[0]

      expect(serializedUserOp.sender).toBe(userOpRequest.sender)
      expect(serializedUserOp.nonce).toBe('0x2a') // 42 in hex
      expect(serializedUserOp.initCode).toBe(userOpRequest.initCode)
      expect(serializedUserOp.callData).toBe(userOpRequest.callData)
      expect(serializedUserOp.callGasLimit).toBe('0x186a0') // 100000 in hex
      expect(serializedUserOp.verificationGasLimit).toBe('0x30d40') // 200000 in hex
      expect(serializedUserOp.paymasterAndData).toBe(userOpRequest.paymasterAndData)
    })

    it('should handle optional fields in serialization', async () => {
      const minimalUserOp: UserOperationRequest = {
        sender: '0x742d35Cc6634C0532925a3b8D8c0d3516C13B4B7' as Address,
        callData: '0x12345678' as Hex
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          id: 1,
          result: { paymaster: '0x1234567890123456789012345678901234567890' }
        })
      })

      await paymasterClient.getPaymasterAndData(minimalUserOp)

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      const serializedUserOp = callBody.params[0]

      expect(serializedUserOp.sender).toBe(minimalUserOp.sender)
      expect(serializedUserOp.nonce).toBe('0x0')
      expect(serializedUserOp.initCode).toBe('0x')
      expect(serializedUserOp.callData).toBe(minimalUserOp.callData)
      expect(serializedUserOp.callGasLimit).toBeUndefined()
      expect(serializedUserOp.verificationGasLimit).toBeUndefined()
      expect(serializedUserOp.paymasterAndData).toBe('0x')
      expect(serializedUserOp.signature).toBe('0x')
    })
  })

  describe('API key handling', () => {
    it('should add Authorization header for Alchemy', async () => {
      const alchemyConfig: ProviderConfig = {
        type: ProviderType.ALCHEMY,
        apiKey: 'test-key',
        chainId: 1,
        bundlerUrl: 'https://eth-mainnet.g.alchemy.com/v2/test-key',
        paymasterUrl: 'https://eth-mainnet.g.alchemy.com/v2/test-key'
      }

      const client = new PaymasterClient(alchemyConfig)
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          id: 1,
          result: { paymaster: '0x1234567890123456789012345678901234567890' }
        })
      })

      const userOpRequest: UserOperationRequest = {
        sender: '0x742d35Cc6634C0532925a3b8D8c0d3516C13B4B7' as Address,
        callData: '0x12345678' as Hex
      }

      await client.getPaymasterAndData(userOpRequest)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-key'
          })
        })
      )
    })

    it('should add authToken header for Biconomy', async () => {
      const biconomyConfig: ProviderConfig = {
        type: ProviderType.BICONOMY,
        apiKey: 'test-key',
        chainId: 137,
        bundlerUrl: 'https://bundler.biconomy.io/api/v2/137/test-key',
        paymasterUrl: 'https://paymaster.biconomy.io/api/v1/137/test-key'
      }

      const client = new PaymasterClient(biconomyConfig)
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          id: 1,
          result: { paymaster: '0x1234567890123456789012345678901234567890' }
        })
      })

      const userOpRequest: UserOperationRequest = {
        sender: '0x742d35Cc6634C0532925a3b8D8c0d3516C13B4B7' as Address,
        callData: '0x12345678' as Hex
      }

      await client.getPaymasterAndData(userOpRequest)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'authToken': 'test-key'
          })
        })
      )
    })

    it('should not add extra headers for Pimlico (uses URL params)', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          id: 1,
          result: { paymaster: '0x1234567890123456789012345678901234567890' }
        })
      })

      const userOpRequest: UserOperationRequest = {
        sender: '0x742d35Cc6634C0532925a3b8D8c0d3516C13B4B7' as Address,
        callData: '0x12345678' as Hex
      }

      await paymasterClient.getPaymasterAndData(userOpRequest)

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: {
            'Content-Type': 'application/json'
          }
        })
      )
    })
  })

  describe('Entry point handling', () => {
    it('should use default entry point when not configured', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          id: 1,
          result: { paymaster: '0x1234567890123456789012345678901234567890' }
        })
      })

      const userOpRequest: UserOperationRequest = {
        sender: '0x742d35Cc6634C0532925a3b8D8c0d3516C13B4B7' as Address,
        callData: '0x12345678' as Hex
      }

      await paymasterClient.getPaymasterAndData(userOpRequest)

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.params[1]).toBe('0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789')
    })

    it('should use configured entry point', async () => {
      const customConfig: ProviderConfig = {
        ...mockConfig,
        entryPointAddress: '0x0576a174D229E3cFA37253523E645A78A0C91B57' as Address
      }

      const client = new PaymasterClient(customConfig)
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          id: 1,
          result: { paymaster: '0x1234567890123456789012345678901234567890' }
        })
      })

      const userOpRequest: UserOperationRequest = {
        sender: '0x742d35Cc6634C0532925a3b8D8c0d3516C13B4B7' as Address,
        callData: '0x12345678' as Hex
      }

      await client.getPaymasterAndData(userOpRequest)

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.params[1]).toBe('0x0576a174D229E3cFA37253523E645A78A0C91B57')
    })
  })

  describe('Error handling', () => {
    it('should handle network failures', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      const userOpRequest: UserOperationRequest = {
        sender: '0x742d35Cc6634C0532925a3b8D8c0d3516C13B4B7' as Address,
        callData: '0x12345678' as Hex
      }

      await expect(paymasterClient.getPaymasterAndData(userOpRequest))
        .rejects.toThrow('Failed to get paymaster and data: Network error')
    })

    it('should handle HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests'
      })

      const userOpRequest: UserOperationRequest = {
        sender: '0x742d35Cc6634C0532925a3b8D8c0d3516C13B4B7' as Address,
        callData: '0x12345678' as Hex
      }

      await expect(paymasterClient.getPaymasterAndData(userOpRequest))
        .rejects.toThrow('HTTP 429: Too Many Requests')
    })

    it('should properly identify method not found errors', () => {
      const methodNotFoundError1 = { code: -32601, message: 'Method not found' }
      const methodNotFoundError2 = { code: 1234, message: 'method not found in description' }
      const otherError = { code: -32602, message: 'Invalid params' }

      expect(paymasterClient['isMethodNotFoundError'](methodNotFoundError1)).toBe(true)
      expect(paymasterClient['isMethodNotFoundError'](methodNotFoundError2)).toBe(true)
      expect(paymasterClient['isMethodNotFoundError'](otherError)).toBe(false)
    })
  })
})