/**
 * tests/factory/index.test.ts
 * Fixed factory test with proper mock setup
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { Address, Hash, Hex } from '@rabit/types'
import { 
  SmartAccountConfig, 
  SmartAccountType, 
  SignerType,
  SmartAccountSigner,
  ProviderType,
  SmartAccount,
  SmartAccountFeatures
} from '../../src/types'
import type { KernelSmartAccount } from '../../src/implementations/kernel'

// Mock the kernel implementation - this gets hoisted
vi.mock('../../src/implementations/kernel', () => ({
  createKernelAccount: vi.fn()
}))

// Import after mocking - use the correct import path
import { 
  SmartAccountFactory,
  createFactory,
  kernelFactory,
  safeFactory,
  lightAccountFactory,
  getBestFactory,
  createOptimalAccount
} from '../../src/factory/index'

// Import the mocked function
import { createKernelAccount } from '../../src/implementations/kernel'

// Type assertion to access the mock
const mockCreateKernelAccount = vi.mocked(createKernelAccount)

describe('Smart Account Factory', () => {
  let mockSigner: SmartAccountSigner
  let mockConfig: SmartAccountConfig
  let mockSmartAccount: KernelSmartAccount

  beforeEach(() => {
    // Setup mock signer
    mockSigner = {
      type: SignerType.EOA,
      address: '0x742d35Cc6634C0532925a3b8D8c0d3516C13B4B7' as Address,
      signMessage: vi.fn().mockResolvedValue('0xsignature' as Hex),
      signTypedData: vi.fn().mockResolvedValue('0xsignature' as Hex),
      signTransaction: vi.fn().mockResolvedValue('0xsignature' as Hex)
    }

    // Setup mock features
    const mockFeatures: SmartAccountFeatures = {
      gasSponsorship: true,
      batchTransactions: true,
      sessionKeys: true,
      socialRecovery: false,
      spendingLimits: false,
      timeDelays: false,
      multiSig: false,
      customValidation: false
    }

    // Setup complete mock KernelSmartAccount
    mockSmartAccount = {
      address: '0x1234567890123456789012345678901234567890' as Address,
      type: SmartAccountType.KERNEL,
      signer: mockSigner,
      features: mockFeatures,
      provider: {
        type: ProviderType.PIMLICO,
        apiKey: 'test-api-key',
        chainId: 137,
        bundlerUrl: 'https://api.pimlico.io/v1/polygon/rpc?apikey=test-api-key',
        paymasterUrl: 'https://api.pimlico.io/v2/polygon/rpc?apikey=test-api-key'
      },
      isDeployed: false,
      
      // Kernel-specific properties
      client: {
        // Mock client object - adjust based on actual client interface
        account: {
          address: '0x1234567890123456789012345678901234567890' as Address,
          type: 'kernel'
        },
        chain: {
          id: 137,
          name: 'Polygon'
        },
        transport: vi.fn(),
        request: vi.fn(),
        batch: vi.fn(),
        mode: 'bundler'
      } as any, // Use 'as any' to avoid strict type checking for complex client object
      
      validator: {
        // Mock validator object - adjust based on actual validator interface
        address: '0x0000000000000000000000000000000000000001' as Address,
        source: 'mock-validator',
        getIdentifier: vi.fn().mockReturnValue('0x00'),
        getDummySignature: vi.fn().mockReturnValue('0x' + '00'.repeat(65)),
        isValidSignatureForHash: vi.fn().mockResolvedValue(true),
        signMessage: vi.fn().mockResolvedValue('0xsignature' as Hex),
        signTypedData: vi.fn().mockResolvedValue('0xsignature' as Hex)
      } as any, // Use 'as any' to avoid strict type checking for complex validator object
      
      // Core operations
      sendTransaction: vi.fn().mockResolvedValue('0xtxhash' as Hash),
      sendBatchTransaction: vi.fn().mockResolvedValue('0xtxhash' as Hash),
      signMessage: vi.fn().mockResolvedValue('0xsignature' as Hex),
      signTypedData: vi.fn().mockResolvedValue('0xsignature' as Hex),
      
      // Account management
      addSessionKey: vi.fn().mockResolvedValue(undefined),
      removeSessionKey: vi.fn().mockResolvedValue(undefined),
      updateSpendingLimit: vi.fn().mockResolvedValue(undefined),
      getSessionKeys: vi.fn().mockResolvedValue([]),
      getSpendingLimits: vi.fn().mockResolvedValue([]),
      
      // Recovery
      initiateRecovery: vi.fn().mockResolvedValue(undefined),
      approveRecovery: vi.fn().mockResolvedValue(undefined),
      executeRecovery: vi.fn().mockResolvedValue(undefined),
      cancelRecovery: vi.fn().mockResolvedValue(undefined),
      
      // Utilities
      getNonce: vi.fn().mockResolvedValue(0n),
      getBalance: vi.fn().mockResolvedValue(1000000000000000000n),
      estimateGas: vi.fn().mockResolvedValue(21000n),
      isValidSignature: vi.fn().mockResolvedValue(true)
    }

    // Setup mock configuration
    mockConfig = {
      type: SmartAccountType.KERNEL,
      signer: mockSigner,
      provider: {
        type: ProviderType.PIMLICO,
        apiKey: 'test-api-key',
        chainId: 137,
        bundlerUrl: 'https://api.pimlico.io/v1/polygon/rpc?apikey=test-api-key',
        paymasterUrl: 'https://api.pimlico.io/v2/polygon/rpc?apikey=test-api-key'
      },
      features: {
        sessionKeys: true,
        gasSponsorship: true,
        batchTransactions: true,
        socialRecovery: false,
        spendingLimits: false,
        timeDelays: false,
        multiSig: false,
        customValidation: false
      }
    }

    // Setup mock return value for createKernelAccount
    mockCreateKernelAccount.mockResolvedValue(mockSmartAccount)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('SmartAccountFactory.create', () => {
    it('should create a Kernel smart account', async () => {
      const account = await SmartAccountFactory.create(mockConfig)
      
      expect(account).toBeDefined()
      expect(account.type).toBe(SmartAccountType.KERNEL)
      expect(account.address).toBe('0x1234567890123456789012345678901234567890')
      expect(mockCreateKernelAccount).toHaveBeenCalledWith(mockConfig)
      expect(mockCreateKernelAccount).toHaveBeenCalledTimes(1)
    })

    it('should throw for unsupported account types', async () => {
      const unsupportedConfig: SmartAccountConfig = {
        ...mockConfig,
        type: SmartAccountType.SAFE
      }

      await expect(SmartAccountFactory.create(unsupportedConfig))
        .rejects.toThrow('Unsupported account type: safe')
    })

    it('should pass configuration correctly to implementation', async () => {
      await SmartAccountFactory.create(mockConfig)
      
      expect(mockCreateKernelAccount).toHaveBeenCalledWith(mockConfig)
      expect(mockCreateKernelAccount).toHaveBeenCalledTimes(1)
    })

    it('should handle different signer types', async () => {
      const passkeyConfig: SmartAccountConfig = {
        ...mockConfig,
        signer: {
          ...mockSigner,
          type: SignerType.PASSKEY
        }
      }

      const account = await SmartAccountFactory.create(passkeyConfig)
      expect(account).toBeDefined()
      expect(account.type).toBe(SmartAccountType.KERNEL)
    })

    it('should handle different provider configurations', async () => {
      const alchemyConfig: SmartAccountConfig = {
        ...mockConfig,
        provider: {
          type: ProviderType.ALCHEMY,
          apiKey: 'alchemy-key',
          chainId: 1,
          bundlerUrl: 'https://eth-mainnet.g.alchemy.com/v2/alchemy-key',
          paymasterUrl: 'https://eth-mainnet.g.alchemy.com/v2/alchemy-key'
        }
      }

      const account = await SmartAccountFactory.create(alchemyConfig)
      expect(account).toBeDefined()
      expect(account.type).toBe(SmartAccountType.KERNEL)
    })
  })

  describe('createFactory', () => {
    it('should return SmartAccountFactory class', () => {
      const factory = createFactory()
      expect(factory).toBe(SmartAccountFactory)
    })

    it('should allow creating accounts through returned factory', async () => {
      const factory = createFactory()
      const account = await factory.create(mockConfig)
      
      expect(account).toBeDefined()
      expect(account.type).toBe(SmartAccountType.KERNEL)
      expect(mockCreateKernelAccount).toHaveBeenCalledWith(mockConfig)
    })
  })

  describe('kernelFactory', () => {
    it('should create Kernel accounts', async () => {
      const account = await kernelFactory.create(mockConfig)
      
      expect(account).toBeDefined()
      expect(account.type).toBe(SmartAccountType.KERNEL)
      expect(mockCreateKernelAccount).toHaveBeenCalledWith(mockConfig)
    })

    it('should work with any SmartAccountConfig', async () => {
      const differentConfig: SmartAccountConfig = {
        ...mockConfig,
        features: {
          sessionKeys: false,
          gasSponsorship: true,
          batchTransactions: false,
          socialRecovery: true,
          spendingLimits: false,
          timeDelays: false,
          multiSig: false,
          customValidation: false
        }
      }

      const account = await kernelFactory.create(differentConfig)
      expect(account).toBeDefined()
      expect(account.type).toBe(SmartAccountType.KERNEL)
    })
  })

  describe('safeFactory', () => {
    it('should throw not implemented error', () => {
      expect(() => safeFactory.create(mockConfig))
        .toThrow('Safe implementation not yet available')
    })
  })

  describe('lightAccountFactory', () => {
    it('should throw not implemented error', () => {
      expect(() => lightAccountFactory.create(mockConfig))
        .toThrow('Light Account implementation not yet available')
    })
  })

  describe('getBestFactory', () => {
    it('should return kernelFactory for any use case', () => {
      const useCases = [
        'basic',
        'gaming',
        'defi',
        'social',
        'enterprise',
        'unknown'
      ]

      useCases.forEach(useCase => {
        const factory = getBestFactory(useCase)
        expect(factory).toBe(kernelFactory)
      })
    })
  })

  describe('createOptimalAccount', () => {
    it('should create account using SmartAccountFactory', async () => {
      const account = await createOptimalAccount(mockConfig)
      
      expect(account).toBeDefined()
      expect(account.type).toBe(SmartAccountType.KERNEL)
      expect(mockCreateKernelAccount).toHaveBeenCalledWith(mockConfig)
    })

    it('should handle errors from factory', async () => {
      const invalidConfig = {
        ...mockConfig,
        type: 'INVALID' as any
      }

      await expect(createOptimalAccount(invalidConfig))
        .rejects.toThrow('Unsupported account type: INVALID')
    })
  })

  describe('Configuration validation', () => {
    it('should handle minimal configuration', async () => {
      const minimalConfig: SmartAccountConfig = {
        type: SmartAccountType.KERNEL,
        signer: mockSigner,
        provider: {
          type: ProviderType.PIMLICO,
          apiKey: 'test-key',
          chainId: 1,
          bundlerUrl: 'https://api.pimlico.io/v1/ethereum/rpc?apikey=test-key',
          paymasterUrl: 'https://api.pimlico.io/v2/ethereum/rpc?apikey=test-key'
        }
      }

      const account = await SmartAccountFactory.create(minimalConfig)
      expect(account).toBeDefined()
      expect(account.type).toBe(SmartAccountType.KERNEL)
    })

    it('should handle full configuration with all features', async () => {
      const fullConfig: SmartAccountConfig = {
        type: SmartAccountType.KERNEL,
        signer: mockSigner,
        provider: {
          type: ProviderType.PIMLICO,
          apiKey: 'test-key',
          chainId: 1,
          bundlerUrl: 'https://custom-bundler.com',
          paymasterUrl: 'https://custom-paymaster.com',
          entryPointAddress: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789' as Address
        },
        features: {
          sessionKeys: true,
          gasSponsorship: true,
          batchTransactions: true,
          socialRecovery: true,
          spendingLimits: true,
          timeDelays: true,
          multiSig: true,
          customValidation: true
        },
        address: '0x1234567890123456789012345678901234567890' as Address,
        recoveryConfig: {
          guardians: [
            '0x742d35Cc6634C0532925a3b8D8c0d3516C13B4B7' as Address,
            '0x0000000000000000000000000000000000000001' as Address,
            '0x0000000000000000000000000000000000000002' as Address
          ],
          threshold: 2,
          delay: 14 * 24 * 60 * 60 // 14 days in seconds
        }
      }

      const account = await SmartAccountFactory.create(fullConfig)
      expect(account).toBeDefined()
      expect(account.type).toBe(SmartAccountType.KERNEL)
    })
  })

  describe('Provider compatibility', () => {
    const providerConfigs = [
      { type: ProviderType.PIMLICO, name: 'pimlico' },
      { type: ProviderType.ALCHEMY, name: 'alchemy' },
      { type: ProviderType.BICONOMY, name: 'biconomy' },
      { type: ProviderType.ZERODEV, name: 'zerodev' },
      { type: ProviderType.STACKUP, name: 'stackup' }
    ]

    providerConfigs.forEach(({ type, name }) => {
      it(`should work with ${name} provider`, async () => {
        const providerConfig: SmartAccountConfig = {
          ...mockConfig,
          provider: {
            ...mockConfig.provider,
            type: type
          }
        }

        const account = await SmartAccountFactory.create(providerConfig)
        expect(account).toBeDefined()
        expect(account.type).toBe(SmartAccountType.KERNEL)
      })
    })
  })

  describe('Error scenarios', () => {
    it('should handle implementation errors', async () => {
      // Make the mock throw an error
      mockCreateKernelAccount.mockRejectedValueOnce(new Error('Implementation error'))

      await expect(SmartAccountFactory.create(mockConfig))
        .rejects.toThrow('Implementation error')
    })

    it('should handle missing signer', async () => {
      const configWithoutSigner = {
        ...mockConfig,
        signer: null as any
      }

      // The factory should still try to create the account
      // Validation happens in the implementation
      await expect(SmartAccountFactory.create(configWithoutSigner))
        .resolves.toBeDefined()
    })
  })

  describe('Type system validation', () => {
    it('should enforce correct account types', async () => {
      const validConfig: SmartAccountConfig = {
        type: SmartAccountType.KERNEL,
        signer: mockSigner,
        provider: {
          type: ProviderType.PIMLICO,
          apiKey: 'test-key',
          chainId: 1,
          bundlerUrl: 'https://api.pimlico.io/v1/ethereum/rpc?apikey=test-key',
          paymasterUrl: 'https://api.pimlico.io/v2/ethereum/rpc?apikey=test-key'
        }
      }

      const account = await SmartAccountFactory.create(validConfig)
      expect(account).toBeDefined()
      expect(account.type).toBe(SmartAccountType.KERNEL)
    })

    it('should work with different signer types', async () => {
      const signerTypes = [
        SignerType.EOA,
        SignerType.PASSKEY,
        SignerType.EMBEDDED,
        SignerType.MAGIC_LINK,
        SignerType.WEB3AUTH
      ]

      for (const signerType of signerTypes) {
        const configWithSignerType: SmartAccountConfig = {
          ...mockConfig,
          signer: {
            ...mockSigner,
            type: signerType
          }
        }

        const account = await SmartAccountFactory.create(configWithSignerType)
        expect(account).toBeDefined()
        expect(account.type).toBe(SmartAccountType.KERNEL)
      }
    })
  })
})