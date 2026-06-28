/**
 * EVM EOA Wallet — signs transactions and messages using the derived private key
 * Uses viem under the hood for all EVM operations
 */

import {
  createWalletClient,
  createPublicClient,
  http,
  type WalletClient,
  type PublicClient,
  type Account,
  type Chain,
  type Hash,
  type TransactionRequest,
  type SignableMessage,
  type TypedDataDefinition,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import type { EvmTransactionRequest, ChainId } from '@rabit/types';

export interface EOAWalletConfig {
  /** Hex-encoded private key (without 0x prefix) */
  privateKey: string;
  /** Chain configuration */
  chain: Chain;
  /** RPC URL */
  rpcUrl: string;
}

export class EOAWallet {
  private account: Account;
  private walletClient: WalletClient;
  private publicClient: PublicClient;
  private chain: Chain;

  constructor(config: EOAWalletConfig) {
    const key = config.privateKey.startsWith('0x')
      ? config.privateKey as `0x${string}`
      : `0x${config.privateKey}` as `0x${string}`;

    this.account = privateKeyToAccount(key);
    this.chain = config.chain;

    this.walletClient = createWalletClient({
      account: this.account,
      chain: config.chain,
      transport: http(config.rpcUrl),
    });

    this.publicClient = createPublicClient({
      chain: config.chain,
      transport: http(config.rpcUrl),
    });
  }

  /** Get the EOA address */
  get address(): string {
    return this.account.address;
  }

  /** Get the current chain */
  get currentChain(): Chain {
    return this.chain;
  }

  /**
   * Send a transaction
   */
  async sendTransaction(tx: EvmTransactionRequest): Promise<Hash> {
    const hash = await this.walletClient.sendTransaction({
      account: this.account,
      to: tx.to as `0x${string}`,
      value: tx.value,
      data: tx.data as `0x${string}` | undefined,
      gas: tx.gas,
      gasPrice: tx.gasPrice,
      maxFeePerGas: tx.maxFeePerGas,
      maxPriorityFeePerGas: tx.maxPriorityFeePerGas,
      nonce: tx.nonce,
      chain: this.chain,
    } as any);

    return hash;
  }

  /**
   * Sign a message (personal_sign)
   */
  async signMessage(message: string): Promise<string> {
    const signature = await this.walletClient.signMessage({
      account: this.account,
      message,
    });
    return signature;
  }

  /**
   * Sign typed data (EIP-712)
   */
  async signTypedData(typedData: TypedDataDefinition): Promise<string> {
    const signature = await this.walletClient.signTypedData({
      account: this.account,
      ...typedData,
    } as any);
    return signature;
  }

  /**
   * Get native token balance
   */
  async getBalance(): Promise<bigint> {
    return this.publicClient.getBalance({
      address: this.account.address,
    });
  }

  /**
   * Get transaction count (nonce)
   */
  async getTransactionCount(): Promise<number> {
    return this.publicClient.getTransactionCount({
      address: this.account.address,
    });
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForTransaction(hash: Hash): Promise<{
    status: 'success' | 'reverted';
    blockNumber: bigint;
    gasUsed: bigint;
  }> {
    const receipt = await this.publicClient.waitForTransactionReceipt({ hash });
    return {
      status: receipt.status,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed,
    };
  }

  /**
   * Estimate gas for a transaction
   */
  async estimateGas(tx: EvmTransactionRequest): Promise<bigint> {
    return this.publicClient.estimateGas({
      account: this.account.address,
      to: tx.to as `0x${string}`,
      value: tx.value,
      data: tx.data as `0x${string}` | undefined,
    });
  }

  /**
   * Get public client for read operations
   */
  getPublicClient(): PublicClient {
    return this.publicClient;
  }
}
