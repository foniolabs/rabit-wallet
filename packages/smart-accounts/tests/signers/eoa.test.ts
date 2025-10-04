/**
 * tests/signers/eoa.test.ts
 * EOA Signer test file
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Address, Hex } from '@rabit/types'
import { EOASigner, createEOASigner, createEOASignerFromPrivateKey, createEOASignerFromMnemonic } from '../../src/signers/eoa'
import { SignerType } from '../../src/types'
import { privateKeyToAccount } from 'viem/accounts'
import { createWalletClient, http } from 'viem'
import { mainnet } from 'viem/chains'

// Mock viem functions
vi.mock('viem/accounts', () => ({
  privateKeyToAccount: vi.fn(),
  mnemonicToAccount: vi.fn()
}))

vi.mock('viem', () => ({
  createWalletClient: vi.fn(),
  http: vi.fn()
}))

const mockPrivateKeyToAccount = vi.mocked(privateKeyToAccount)
const mockCreateWalletClient = vi.mocked(createWalletClient)

describe('EOA Signer', () => {
  let mockAccount: any
  let mockWalletClient: any

  beforeEach(() => {
    vi.clearAllMocks()

    mockAccount = {
      address: '0x742d35Cc6634C0532925a3b8D8c0d3516C13B4B7' as Address,
      signMessage: vi.fn().mockResolvedValue('0xsignature' as Hex),
      signTypedData: vi.fn().mockResolvedValue('0xsignature' as Hex)
    }

    mockWalletClient = {
      account: mockAccount,
      chain: mainnet,
      signMessage: vi.fn().mockResolvedValue('0xsignature' as Hex),
      signTypedData: vi.fn().mockResolvedValue('0xsignature' as Hex),
      signTransaction: vi.fn().mockResolvedValue('0xsignature' as Hex)
    }

    mockPrivateKeyToAccount.mockReturnValue(mockAccount)
    mockCreateWalletClient.mockReturnValue(mockWalletClient)
  })

  describe('EOASigner class', () => {
    it('should create EOA signer with account only', () => {
      const signer = new EOASigner(mockAccount)

      expect(signer.type).toBe(SignerType.EOA)
      expect(signer.address).toBe(mockAccount.address)
      expect(signer.getAccount()).toBe(mockAccount)
    })

    it('should create EOA signer with wallet client', () => {
      const signer = new EOASigner(mockAccount, mockWalletClient)

      expect(signer.type).toBe(SignerType.EOA)
      expect(signer.address).toBe(mockAccount.address)
      expect(signer.getWalletClient()).toBe(mockWalletClient)
    })

    it('should handle null account gracefully', () => {
      const signer = new EOASigner(null as any)

      expect(signer.type).toBe(SignerType.EOA)
      expect(signer.address).toBe('0x0000000000000000000000000000000000000000')
      expect(signer.getAccount()).toBe(null)
    })

    it('should sign message with wallet client', async () => {
      const signer = new EOASigner(mockAccount, mockWalletClient)
      const message = 'Hello World'

      const signature = await signer.signMessage(message)

      expect(mockWalletClient.signMessage).toHaveBeenCalledWith({
        account: mockAccount,
        message
      })
      expect(signature).toBe('0xsignature')
    })

    it('should sign message with direct account signing', async () => {
      const signer = new EOASigner(mockAccount)
      const message = 'Hello World'

      const signature = await signer.signMessage(message)

      expect(mockAccount.signMessage).toHaveBeenCalledWith({
        message
      })
      expect(signature).toBe('0xsignature')
    })

    it('should sign message with Uint8Array', async () => {
      const signer = new EOASigner(mockAccount, mockWalletClient)
      const message = new Uint8Array([1, 2, 3, 4])

      const signature = await signer.signMessage(message)

      expect(mockWalletClient.signMessage).toHaveBeenCalledWith({
        account: mockAccount,
        message: { raw: message }
      })
      expect(signature).toBe('0xsignature')
    })

    it('should throw error when account not initialized', async () => {
      const signer = new EOASigner(null as any)

      await expect(signer.signMessage('test'))
        .rejects.toThrow('Failed to sign message: Error: Account not initialized')
    })

    it('should sign typed data with wallet client', async () => {
      const signer = new EOASigner(mockAccount, mockWalletClient)
      const domain = { name: 'Test' }
      const types = { TestType: [{ name: 'test', type: 'string' }] }
      const value = { test: 'value' }

      const signature = await signer.signTypedData(domain, types, value)

      expect(mockWalletClient.signTypedData).toHaveBeenCalledWith({
        account: mockAccount,
        domain,
        types,
        primaryType: 'TestType',
        message: value
      })
      expect(signature).toBe('0xsignature')
    })

    it('should sign transaction with wallet client', async () => {
      const signer = new EOASigner(mockAccount, mockWalletClient)
      const transaction = {
        to: '0x742d35Cc6634C0532925a3b8D8c0d3516C13B4B7' as Address,
        value: 1000000000000000000n
      }

      const signature = await signer.signTransaction(transaction)

      expect(mockWalletClient.signTransaction).toHaveBeenCalled()
      expect(signature).toBe('0xsignature')
    })

    it('should throw error when signing transaction without wallet client', async () => {
      const signer = new EOASigner(mockAccount)
      const transaction = {
        to: '0x742d35Cc6634C0532925a3b8D8c0d3516C13B4B7' as Address,
        value: 1000000000000000000n
      }

      await expect(signer.signTransaction(transaction))
        .rejects.toThrow('Failed to sign transaction: Error: Wallet client required for transaction signing')
    })

    it('should set wallet client', () => {
      const signer = new EOASigner(mockAccount)
      expect(signer.getWalletClient()).toBeUndefined()

      signer.setWalletClient(mockWalletClient)
      expect(signer.getWalletClient()).toBe(mockWalletClient)
    })
  })

  describe('Factory functions', () => {
    it('should create EOA signer with options', () => {
      const signer = createEOASigner(mockAccount, {
        walletClient: mockWalletClient
      })

      expect(signer.getAccount()).toBe(mockAccount)
      expect(signer.getWalletClient()).toBe(mockWalletClient)
    })

    it('should create EOA signer from private key', async () => {
      const privateKey = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' as Hex

      const signer = await createEOASignerFromPrivateKey(privateKey)

      expect(mockPrivateKeyToAccount).toHaveBeenCalledWith(privateKey)
      expect(signer.getAccount()).toBe(mockAccount)
    })

    it('should create EOA signer from private key with chain and RPC', async () => {
      const privateKey = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' as Hex

      const signer = await createEOASignerFromPrivateKey(privateKey, {
        chain: mainnet,
        rpcUrl: 'https://eth.llamarpc.com'
      })

      expect(mockCreateWalletClient).toHaveBeenCalled()
      expect(signer.getWalletClient()).toBe(mockWalletClient)
    })
  })
})