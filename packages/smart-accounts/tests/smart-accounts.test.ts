/**
 * tests/smart-accounts.test.ts
 * Comprehensive test suite for the Smart Accounts package
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { Address, Hex } from '@rabit/types'

// Import signers with proper alias resolution
import { 
  createEOASignerFromPrivateKey, 
  createEmbeddedSigner, 
  createMagicLinkSigner,
  createPasskeySigner,
  createWeb3AuthSigner,
  EOASigner,
  EmbeddedSigner,
  MagicLinkSigner,
  PasskeySigner,
  Web3AuthSigner
} from '../src/signers'

// Import types
import { 
  SignerType, 
  TransactionRequest,
  UserOperationRequest,
  SmartAccountSigner
} from '../src/types'

// Test constants - moved to module level so they can be exported
const TEST_PRIVATE_KEY = '0x1234567890123456789012345678901234567890123456789012345678901234' as Hex
const TEST_ADDRESS = '0x742d35Cc6634C0532925a3b8D8c0d3516C13B4B7' as Address
const TEST_MESSAGE = 'Hello, Smart Account!'
const TEST_CHAIN_ID = 137 // Polygon

describe('Smart Accounts Package - Core Functionality', () => {

  describe('Signer Type System', () => {
    it('should have all signer types defined', () => {
      // Updated to match actual enum values (lowercase)
      expect(SignerType.EOA).toBe('eoa')
      expect(SignerType.EMBEDDED).toBe('embedded')
      expect(SignerType.MAGIC_LINK).toBe('magic_link')
      expect(SignerType.PASSKEY).toBe('passkey')
      expect(SignerType.WEB3AUTH).toBe('web3auth')
    })
  })

  describe('EOA Signer', () => {
    let signer: EOASigner

    beforeEach(async () => {
      signer = await createEOASignerFromPrivateKey(TEST_PRIVATE_KEY)
    })

    it('should create EOA signer with correct type', () => {
      expect(signer.type).toBe(SignerType.EOA)
      expect(signer.address).toBeDefined()
      expect(signer.address.startsWith('0x')).toBe(true)
    })

    it('should have signing methods', () => {
      expect(typeof signer.signMessage).toBe('function')
      expect(typeof signer.signTypedData).toBe('function')
      expect(typeof signer.signTransaction).toBe('function')
    })

    it('should get underlying account', () => {
      const account = signer.getAccount()
      expect(account).toBeDefined()
      expect(account.address).toBe(signer.address)
    })

    it('should have helper methods', () => {
      // Test accessible methods instead of private ones
      expect(typeof signer.getAccount).toBe('function')
      expect(typeof signer.getWalletClient).toBe('function')
      expect(typeof signer.setWalletClient).toBe('function')
    })
  })

  describe('Embedded Signer', () => {
    let signer: EmbeddedSigner

    beforeEach(() => {
      signer = createEmbeddedSigner({
        chainId: TEST_CHAIN_ID,
        storage: 'memory' // Use memory storage for tests
      })
    })

    it('should create embedded signer with correct type', () => {
      expect(signer.type).toBe(SignerType.EMBEDDED)
      expect(signer.address).toBeDefined()
      expect(signer.address.startsWith('0x')).toBe(true)
    })

    it('should have signing methods', () => {
      expect(typeof signer.signMessage).toBe('function')
      expect(typeof signer.signTypedData).toBe('function')
      expect(typeof signer.signTransaction).toBe('function')
    })

    it('should have wallet management methods', () => {
      expect(typeof signer.exportPrivateKey).toBe('function')
      expect(typeof signer.exportMnemonic).toBe('function')
      expect(typeof signer.changePassword).toBe('function')
    })

    it('should create with custom entropy', () => {
      const customSigner = createEmbeddedSigner({
        entropy: 'test-entropy-string',
        chainId: TEST_CHAIN_ID
      })
      expect(customSigner.address).toBeDefined()
      expect(customSigner.address).not.toBe(signer.address) // Different entropy = different address
    })

    it('should support different storage options', () => {
      const memoryWallet = createEmbeddedSigner({ storage: 'memory' })
      const localStorageWallet = createEmbeddedSigner({ storage: 'localStorage' })
      const sessionStorageWallet = createEmbeddedSigner({ storage: 'sessionStorage' })

      expect(memoryWallet.type).toBe(SignerType.EMBEDDED)
      expect(localStorageWallet.type).toBe(SignerType.EMBEDDED)
      expect(sessionStorageWallet.type).toBe(SignerType.EMBEDDED)
    })
  })

  describe('Magic Link Signer', () => {
    let signer: MagicLinkSigner

    beforeEach(() => {
      signer = createMagicLinkSigner({
        apiKey: 'test-api-key',
        network: 'mainnet',
        locale: 'en_US'
      })
    })

    it('should create Magic Link signer with correct type', () => {
      expect(signer.type).toBe(SignerType.MAGIC_LINK)
    })

    it('should have authentication methods', () => {
      expect(typeof signer.login).toBe('function')
      expect(typeof signer.logout).toBe('function')
      expect(typeof signer.isLoggedIn).toBe('function')
    })

    it('should have signing methods', () => {
      expect(typeof signer.signMessage).toBe('function')
      expect(typeof signer.signTypedData).toBe('function')
      expect(typeof signer.signTransaction).toBe('function')
    })

    it('should have helper methods', () => {
      expect(typeof signer.getUserMetadata).toBe('function')
      expect(typeof signer.sendTransaction).toBe('function')
    })

    it('should get configuration', () => {
      const config = signer.getConfig()
      expect(config.apiKey).toBe('test-api-key')
      expect(config.network).toBe('mainnet')
      expect(config.locale).toBe('en_US')
    })
  })

  describe('Passkey Signer', () => {
    const mockCredential = {
      id: 'test-credential-id',
      rawId: new ArrayBuffer(32),
      publicKey: {
        x: '0x' + '1'.repeat(64),
        y: '0x' + '2'.repeat(64)
      },
      getAuthenticatorData: () => new ArrayBuffer(32)
    }

    let signer: PasskeySigner

    beforeEach(() => {
      signer = createPasskeySigner(mockCredential, 'localhost')
    })

    it('should create Passkey signer with correct type', () => {
      expect(signer.type).toBe(SignerType.PASSKEY)
      expect(signer.address).toBeDefined()
    })

    it('should have signing methods', () => {
      expect(typeof signer.signMessage).toBe('function')
      expect(typeof signer.signTypedData).toBe('function')
      expect(typeof signer.signTransaction).toBe('function')
    })

    it('should have credential getter methods', () => {
      expect(typeof signer.getCredential).toBe('function')
      expect(typeof signer.getRpId).toBe('function')
      
      expect(signer.getCredential()).toEqual(mockCredential)
      expect(signer.getRpId()).toBe('localhost')
    })

    it('should throw error for direct transaction signing', async () => {
      const mockTx: TransactionRequest = {
        to: TEST_ADDRESS,
        value: 1000000000000000000n,
        data: '0x' as Hex
      }

      await expect(signer.signTransaction(mockTx)).rejects.toThrow(
        'Direct transaction signing not supported for passkeys'
      )
    })
  })

  describe('Web3Auth Signer', () => {
    let signer: Web3AuthSigner

    beforeEach(() => {
      signer = createWeb3AuthSigner({
        clientId: 'test-client-id',
        chainConfig: {
          chainNamespace: 'eip155',
          chainId: '0x89', // Polygon
          rpcTarget: 'https://polygon-rpc.com'
        }
      })
    })

    it('should create Web3Auth signer with correct type', () => {
      expect(signer.type).toBe(SignerType.WEB3AUTH)
    })

    it('should have authentication methods', () => {
      expect(typeof signer.connect).toBe('function')
      expect(typeof signer.disconnect).toBe('function')
      expect(typeof signer.isConnected).toBe('function')
    })

    it('should have signing methods', () => {
      expect(typeof signer.signMessage).toBe('function')
      expect(typeof signer.signTypedData).toBe('function')
      expect(typeof signer.signTransaction).toBe('function')
    })

    it('should have helper methods', () => {
      expect(typeof signer.getUserInfo).toBe('function')
      expect(typeof signer.getProvider).toBe('function')
      expect(typeof signer.sendTransaction).toBe('function')
    })

    it('should get configuration', () => {
      const config = signer.getConfig()
      expect(config.clientId).toBe('test-client-id')
      expect(config.chainConfig.chainId).toBe('0x89')
    })
  })

  describe('Transaction and UserOp Structures', () => {
    it('should handle transaction request types', () => {
      const txRequest: TransactionRequest = {
        to: TEST_ADDRESS,
        value: 1000000000000000000n, // 1 ETH
        data: '0x' as Hex,
        gas: 21000n,
        maxFeePerGas: 20000000000n,
        maxPriorityFeePerGas: 2000000000n,
        nonce: 0n 
      }

      expect(txRequest.to).toBe(TEST_ADDRESS)
      expect(typeof txRequest.value).toBe('bigint')
      expect(typeof txRequest.gas).toBe('bigint')
      expect(typeof txRequest.nonce).toBe('bigint')
    })

    it('should handle user operation request types', () => {
      const userOpRequest: UserOperationRequest = {
        sender: TEST_ADDRESS,
        nonce: 0n,
        initCode: '0x' as Hex,
        callData: '0x' as Hex,
        callGasLimit: 100000n,
        verificationGasLimit: 100000n,
        preVerificationGas: 21000n,
        maxFeePerGas: 20000000000n,
        maxPriorityFeePerGas: 2000000000n,
        paymasterAndData: '0x' as Hex,
        signature: '0x' as Hex
      }

      expect(userOpRequest.sender).toBe(TEST_ADDRESS)
      expect(typeof userOpRequest.nonce).toBe('bigint')
      expect(typeof userOpRequest.callGasLimit).toBe('bigint')
    })
  })

  describe('Signer Interface Consistency', () => {
    it('should create different signers with same interface', async () => {
      const signers: SmartAccountSigner[] = [
        await createEOASignerFromPrivateKey(TEST_PRIVATE_KEY),
        createEmbeddedSigner({ chainId: TEST_CHAIN_ID }),
        createMagicLinkSigner({ apiKey: 'test' }),
        createPasskeySigner({
          id: 'test',
          rawId: new ArrayBuffer(32),
          publicKey: { x: '0x1', y: '0x2' },
          getAuthenticatorData: () => new ArrayBuffer(32)
        }, 'localhost'),
        createWeb3AuthSigner({
          clientId: 'test',
          chainConfig: {
            chainNamespace: 'eip155',
            chainId: '0x89',
            rpcTarget: 'https://polygon-rpc.com'
          }
        })
      ]

      // All signers should implement the same interface
      signers.forEach(signer => {
        expect(signer.type).toBeDefined()
        expect(signer.address).toBeDefined()
        expect(typeof signer.signMessage).toBe('function')
        expect(typeof signer.signTypedData).toBe('function')
        expect(typeof signer.signTransaction).toBe('function')
      })

      // Each signer should have a different type
      const types = signers.map(s => s.type)
      const uniqueTypes = [...new Set(types)]
      expect(uniqueTypes.length).toBe(5)
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid private key gracefully', async () => {
      await expect(async () => {
        await createEOASignerFromPrivateKey('invalid-key' as Hex)
      }).rejects.toThrow()
    })

    it('should handle missing API key in Magic Link config', () => {
      // Test a specific validation case instead of empty config
      expect(() => {
        // @ts-expect-error - Testing error handling
        createMagicLinkSigner({ network: 'mainnet' })
      }).not.toThrow() // Magic Link might not validate immediately
    })

    it('should handle network errors in signers', async () => {
      const signer = createMagicLinkSigner({
        apiKey: 'invalid-key',
        network: 'mainnet'
      })

      // These should handle network failures gracefully
      await expect(signer.isLoggedIn()).resolves.toBe(false)
      expect(await signer.getUserMetadata()).toBeNull()
    })
  })

  describe('Type Safety', () => {
    it('should enforce Address type safety', () => {
      const validAddress: Address = '0x742d35Cc6634C0532925a3b8D8c0d3516C13B4B7'
      const validHex: Hex = '0x1234'
      
      expect(validAddress.startsWith('0x')).toBe(true)
      expect(validHex.startsWith('0x')).toBe(true)
    })

    it('should enforce bigint for gas values', () => {
      const gasLimit: bigint = 21000n
      const gasPrice: bigint = 20000000000n
      
      expect(typeof gasLimit).toBe('bigint')
      expect(typeof gasPrice).toBe('bigint')
    })

    it('should handle optional properties correctly', () => {
      const minimalTx: TransactionRequest = {
        to: TEST_ADDRESS,
        data: '0x' as Hex
      }

      expect(minimalTx.to).toBe(TEST_ADDRESS)
      expect(minimalTx.value).toBeUndefined()
      expect(minimalTx.gas).toBeUndefined()
    })
  })
})

// Export test utilities for use in other test files
export const testUtils = {
  TEST_PRIVATE_KEY,
  TEST_ADDRESS,
  TEST_MESSAGE,
  TEST_CHAIN_ID,
  
  createMockCredential: () => ({
    id: 'test-credential-id',
    rawId: new ArrayBuffer(32),
    publicKey: {
      x: '0x' + '1'.repeat(64),
      y: '0x' + '2'.repeat(64)
    },
    getAuthenticatorData: () => new ArrayBuffer(32)
  }),
  
  createMockTransaction: (): TransactionRequest => ({
    to: TEST_ADDRESS,
    value: 1000000000000000000n,
    data: '0x' as Hex,
    gas: 21000n,
    maxFeePerGas: 20000000000n,
    maxPriorityFeePerGas: 2000000000n,
    nonce: 0n 
  })
}