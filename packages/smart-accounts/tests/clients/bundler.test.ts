/**
 * tests/clients/bundler.test.ts
 * Comprehensive tests for BundlerClient - FIXED VERSION
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { Address, Hash, Hex } from '@rabit/types'
import { BundlerClient } from '../../src/clients/bundler'
import { 
  ProviderConfig, 
  UserOperation, 
  UserOperationRequest, 
  RpcError,
  ProviderType
} from '../../src/types'

describe('BundlerClient', () => {
  let bundlerClient: BundlerClient
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

    // Create bundler client instance
    bundlerClient = new BundlerClient(mockConfig)

    // Mock fetch globally
    mockFetch = vi.fn()
    global.fetch = mockFetch
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Constructor', () => {
    it('should initialize with provided config', () => {
      expect(bundlerClient).toBeDefined()
      expect(bundlerClient['config']).toEqual(mockConfig)
      expect(bundlerClient['rpcUrl']).toBe(mockConfig.bundlerUrl)
    })

    it('should generate default bundler URL when not provided', () => {
      const configWithoutUrl: ProviderConfig = {
        type: ProviderType.PIMLICO,
        apiKey: 'test-key',
        chainId: 1,
        bundlerUrl: '',
        paymasterUrl: ''
      }

      const client = new BundlerClient(configWithoutUrl)
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

      const client = new BundlerClient(alchemyConfig)
      expect(client['rpcUrl']).toContain('alchemy.com')
    })
  })

  describe('sendUserOperation', () => {
    const mockUserOp: UserOperation = {
      sender: '0x742d35Cc6634C0532925a3b8D8c0d3516C13B4B7' as Address,
      nonce: 0n,
      initCode: '0x' as Hex,
      callData: '0xdeadbeef' as Hex,
      callGasLimit: 100000n,
      verificationGasLimit: 100000n,
      preVerificationGas: 21000n,
      maxFeePerGas: 20000000000n,
      maxPriorityFeePerGas: 2000000000n,
      paymasterAndData: '0x' as Hex,
      signature: '0x1234567890abcdef' as Hex
    }

    it('should send user operation successfully', async () => {
      const expectedHash = '0xabcdef1234567890' as Hash
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          id: expect.any(Number),
          result: expectedHash
        })
      })

      const result = await bundlerClient.sendUserOperation(mockUserOp)
      
      expect(result).toBe(expectedHash)
      expect(mockFetch).toHaveBeenCalledWith(
        mockConfig.bundlerUrl,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('eth_sendUserOperation')
        })
      )
    })

    it('should handle RPC errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          id: 1,
          error: {
            code: -32602,
            message: 'Invalid user operation',
            data: { details: 'Insufficient gas' }
          }
        })
      })

      await expect(bundlerClient.sendUserOperation(mockUserOp))
        .rejects.toThrow('Invalid user operation')
    })

    it('should handle HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      })

      await expect(bundlerClient.sendUserOperation(mockUserOp))
        .rejects.toThrow('HTTP 500: Internal Server Error')
    })

    it('should serialize user operation correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ jsonrpc: '2.0', id: 1, result: '0xhash' })
      })

      await bundlerClient.sendUserOperation(mockUserOp)

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      const serializedUserOp = callBody.params[0]

      expect(serializedUserOp.sender).toBe(mockUserOp.sender)
      expect(serializedUserOp.nonce).toBe('0x0')
      expect(serializedUserOp.callGasLimit).toBe('0x186a0')
      expect(serializedUserOp.maxFeePerGas).toBe('0x4a817c800')
    })
  })

  describe('estimateUserOperationGas', () => {
    const mockUserOpRequest: UserOperationRequest = {
      sender: '0x742d35Cc6634C0532925a3b8D8c0d3516C13B4B7' as Address,
      nonce: 0n,
      initCode: '0x' as Hex,
      callData: '0xdeadbeef' as Hex
    }

    it('should estimate gas successfully', async () => {
      const mockGasEstimate = {
        callGasLimit: '0x186a0',
        verificationGasLimit: '0x186a0',
        preVerificationGas: '0x5208',
        maxFeePerGas: '0x4a817c800',
        maxPriorityFeePerGas: '0x77359400'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          id: 1,
          result: mockGasEstimate
        })
      })

      const result = await bundlerClient.estimateUserOperationGas(mockUserOpRequest)
      
      expect(result.callGasLimit).toBe(BigInt(mockGasEstimate.callGasLimit))
      expect(result.verificationGasLimit).toBe(BigInt(mockGasEstimate.verificationGasLimit))
      expect(result.preVerificationGas).toBe(BigInt(mockGasEstimate.preVerificationGas))
      expect(result.maxFeePerGas).toBe(BigInt(mockGasEstimate.maxFeePerGas))
      expect(result.maxPriorityFeePerGas).toBe(BigInt(mockGasEstimate.maxPriorityFeePerGas))
    })

    it('should handle missing optional gas fields', async () => {
      const mockGasEstimate = {
        callGasLimit: '0x186a0',
        verificationGasLimit: '0x186a0',
        preVerificationGas: '0x5208'
        // maxFeePerGas and maxPriorityFeePerGas missing
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          id: 1,
          result: mockGasEstimate
        })
      })

      const result = await bundlerClient.estimateUserOperationGas(mockUserOpRequest)
      
      expect(result.maxFeePerGas).toBe(0n)
      expect(result.maxPriorityFeePerGas).toBe(0n)
    })
  })

  describe('getUserOperationByHash', () => {
    it('should return user operation when found', async () => {
      const mockUserOpResponse = {
        sender: '0x742d35Cc6634C0532925a3b8D8c0d3516C13B4B7',
        nonce: '0x0',
        initCode: '0x',
        callData: '0xdeadbeef',
        callGasLimit: '0x186a0',
        verificationGasLimit: '0x186a0',
        preVerificationGas: '0x5208',
        maxFeePerGas: '0x4a817c800',
        maxPriorityFeePerGas: '0x77359400',
        paymasterAndData: '0x',
        signature: '0x1234567890abcdef'
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          id: 1,
          result: mockUserOpResponse
        })
      })

      const result = await bundlerClient.getUserOperationByHash('0xhash' as Hash)
      
      expect(result).toBeDefined()
      expect(result!.sender).toBe(mockUserOpResponse.sender)
      expect(result!.nonce).toBe(0n)
      expect(result!.callGasLimit).toBe(BigInt(mockUserOpResponse.callGasLimit))
    })

    it('should return null when user operation not found', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          id: 1,
          result: null
        })
      })

      const result = await bundlerClient.getUserOperationByHash('0xhash' as Hash)
      expect(result).toBeNull()
    })
  })

  describe('getUserOperationReceipt', () => {
    it('should return receipt when found', async () => {
      const mockReceipt = {
        userOpHash: '0xhash',
        sender: '0x742d35Cc6634C0532925a3b8D8c0d3516C13B4B7',
        nonce: '0x0',
        actualGasCost: '0x5208',
        actualGasUsed: '0x5208',
        success: true,
        logs: [],
        receipt: {
          transactionHash: '0xtxhash',
          transactionIndex: '0x0',
          blockHash: '0xblockhash',
          blockNumber: '0x1',
          from: '0xfrom',
          to: '0xto',
          cumulativeGasUsed: '0x5208',
          gasUsed: '0x5208',
          logs: [],
          status: '0x1'
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          id: 1,
          result: mockReceipt
        })
      })

      const result = await bundlerClient.getUserOperationReceipt('0xhash' as Hash)
      
      expect(result).toBeDefined()
      expect(result!.userOpHash).toBe(mockReceipt.userOpHash)
      expect(result!.success).toBe(true)
      expect(result!.receipt.status).toBe('success')
    })

    it('should handle reverted transactions', async () => {
      const mockReceipt = {
        userOpHash: '0xhash',
        sender: '0x742d35Cc6634C0532925a3b8D8c0d3516C13B4B7',
        nonce: '0x0',
        actualGasCost: '0x5208',
        actualGasUsed: '0x5208',
        success: false,
        logs: [],
        receipt: {
          transactionHash: '0xtxhash',
          transactionIndex: '0x0',
          blockHash: '0xblockhash',
          blockNumber: '0x1',
          from: '0xfrom',
          to: '0xto',
          cumulativeGasUsed: '0x5208',
          gasUsed: '0x5208',
          logs: [],
          status: '0x0'
        }
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          id: 1,
          result: mockReceipt
        })
      })

      const result = await bundlerClient.getUserOperationReceipt('0xhash' as Hash)
      
      expect(result!.success).toBe(false)
      expect(result!.receipt.status).toBe('reverted')
    })
  })

  describe('getSupportedEntryPoints', () => {
    it('should return supported entry points', async () => {
      const mockEntryPoints = [
        '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
        '0x0576a174D229E3cFA37253523E645A78A0C91B57'
      ]

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          id: 1,
          result: mockEntryPoints
        })
      })

      const result = await bundlerClient.getSupportedEntryPoints()
      expect(result).toEqual(mockEntryPoints)
    })
  })

  describe('getChainId', () => {
    it('should return chain ID', async () => {
      const mockChainId = '0x89' // Polygon

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          id: 1,
          result: mockChainId
        })
      })

      const result = await bundlerClient.getChainId()
      expect(result).toBe(mockChainId)
    })
  })

  describe('Provider-specific configurations', () => {
    it('should handle Alchemy provider', () => {
      const alchemyConfig: ProviderConfig = {
        type: ProviderType.ALCHEMY,
        apiKey: 'test-key',
        chainId: 1,
        bundlerUrl: '',
        paymasterUrl: ''
      }

      const client = new BundlerClient(alchemyConfig)
      expect(client['rpcUrl']).toContain('alchemy.com')
    })

    it('should handle Biconomy provider', () => {
      const biconomyConfig: ProviderConfig = {
        type: ProviderType.BICONOMY,
        apiKey: 'test-key',
        chainId: 137,
        bundlerUrl: '',
        paymasterUrl: ''
      }

      const client = new BundlerClient(biconomyConfig)
      expect(client['rpcUrl']).toContain('biconomy.io')
    })

    it('should handle ZeroDev provider', () => {
      const zerodevConfig: ProviderConfig = {
        type: ProviderType.ZERODEV,
        apiKey: 'test-key',
        chainId: 1,
        bundlerUrl: '',
        paymasterUrl: ''
      }

      const client = new BundlerClient(zerodevConfig)
      expect(client['rpcUrl']).toContain('zerodev.app')
    })
  })

  describe('Chain name mapping', () => {
    it('should map common chain IDs correctly', () => {
      const configs = [
        { chainId: 1, expected: 'ethereum' },
        { chainId: 137, expected: 'polygon' },
        { chainId: 10, expected: 'optimism' },
        { chainId: 42161, expected: 'arbitrum' },
        { chainId: 8453, expected: 'base' }
      ]

      configs.forEach(({ chainId, expected }) => {
        const config: ProviderConfig = {
          type: ProviderType.PIMLICO,
          apiKey: 'test-key',
          chainId,
          bundlerUrl: '',
          paymasterUrl: ''
        }
        const client = new BundlerClient(config)
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
      const client = new BundlerClient(config)
      expect(client['rpcUrl']).toContain('ethereum')
    })
  })

  describe('Error handling', () => {
    it('should properly create RpcError instances', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          jsonrpc: '2.0',
          id: 1,
          error: {
            code: -32602,
            message: 'Invalid params',
            data: { details: 'Gas too low' }
          }
        })
      })

      try {
        await bundlerClient.getChainId()
      } catch (error) {
        expect(error).toBeInstanceOf(RpcError)
        expect((error as RpcError).code).toBe(-32602)
        expect((error as RpcError).data).toEqual({ details: 'Gas too low' })
      }
    })

    it('should handle network failures', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(bundlerClient.getChainId())
        .rejects.toThrow('Failed to get chain ID: Network error')
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

      const client = new BundlerClient(alchemyConfig)
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ jsonrpc: '2.0', id: 1, result: '0x1' })
      })

      await client.getChainId()

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

      const client = new BundlerClient(biconomyConfig)
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ jsonrpc: '2.0', id: 1, result: '0x89' })
      })

      await client.getChainId()

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'authToken': 'test-key'
          })
        })
      )
    })
  })

  describe('Entry point handling', () => {
    it('should use default entry point when not configured', () => {
      const entryPoint = bundlerClient['getEntryPointAddress']()
      expect(entryPoint).toBe('0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789')
    })

    it('should use configured entry point', () => {
      const customConfig: ProviderConfig = {
        ...mockConfig,
        entryPointAddress: '0x0576a174D229E3cFA37253523E645A78A0C91B57' as Address
      }

      const client = new BundlerClient(customConfig)
      const entryPoint = client['getEntryPointAddress']()
      expect(entryPoint).toBe('0x0576a174D229E3cFA37253523E645A78A0C91B57')
    })
  })
})