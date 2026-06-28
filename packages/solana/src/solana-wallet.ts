/**
 * Solana EOA Wallet — signs transactions and messages using the derived Ed25519 key
 */

import {
  Connection,
  Keypair,
  Transaction,
  VersionedTransaction,
  SystemProgram,
  PublicKey,
  LAMPORTS_PER_SOL,
  type SendOptions,
  type Commitment,
} from '@solana/web3.js';

export interface SolanaWalletConfig {
  /** Hex-encoded private key (32 bytes Ed25519 seed) */
  privateKey: string;
  /** Solana RPC URL */
  rpcUrl: string;
  /** Commitment level */
  commitment?: Commitment;
}

export class SolanaWallet {
  private keypair: Keypair;
  private connection: Connection;

  constructor(config: SolanaWalletConfig) {
    const keyBytes = hexToBytes(config.privateKey);
    // Solana Keypair expects 64 bytes (32 private + 32 public)
    // If we only have 32 bytes (seed), create from seed
    if (keyBytes.length === 32) {
      this.keypair = Keypair.fromSeed(keyBytes);
    } else {
      this.keypair = Keypair.fromSecretKey(keyBytes);
    }

    this.connection = new Connection(config.rpcUrl, config.commitment || 'confirmed');
  }

  /** Get wallet address (base58) */
  get address(): string {
    return this.keypair.publicKey.toBase58();
  }

  /** Get public key */
  get publicKey(): PublicKey {
    return this.keypair.publicKey;
  }

  /**
   * Send SOL to an address
   */
  async sendSol(to: string, amountSol: number): Promise<string> {
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: this.keypair.publicKey,
        toPubkey: new PublicKey(to),
        lamports: Math.round(amountSol * LAMPORTS_PER_SOL),
      })
    );

    const { blockhash } = await this.connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = this.keypair.publicKey;
    transaction.sign(this.keypair);

    const signature = await this.connection.sendRawTransaction(
      transaction.serialize()
    );

    await this.connection.confirmTransaction(signature, 'confirmed');
    return signature;
  }

  /**
   * Sign and send a pre-built transaction
   */
  async signAndSendTransaction(
    transaction: Transaction,
    options?: SendOptions
  ): Promise<string> {
    const { blockhash } = await this.connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = this.keypair.publicKey;
    transaction.sign(this.keypair);

    return this.connection.sendRawTransaction(
      transaction.serialize(),
      options
    );
  }

  /**
   * Sign a message
   */
  async signMessage(message: Uint8Array): Promise<Uint8Array> {
    const { ed25519 } = await import('@noble/curves/ed25519');
    const signature = ed25519.sign(message, this.keypair.secretKey.slice(0, 32));
    return signature;
  }

  /**
   * Get SOL balance
   */
  async getBalance(): Promise<number> {
    const lamports = await this.connection.getBalance(this.keypair.publicKey);
    return lamports / LAMPORTS_PER_SOL;
  }

  /**
   * Get SOL balance in lamports
   */
  async getBalanceLamports(): Promise<number> {
    return this.connection.getBalance(this.keypair.publicKey);
  }

  /**
   * Get recent transaction signatures
   */
  async getTransactionHistory(limit: number = 10): Promise<Array<{
    signature: string;
    slot: number;
    blockTime: number | null;
  }>> {
    const signatures = await this.connection.getSignaturesForAddress(
      this.keypair.publicKey,
      { limit }
    );

    return signatures.map(s => ({
      signature: s.signature,
      slot: s.slot,
      blockTime: s.blockTime ?? null,
    }));
  }

  /**
   * Get the underlying connection
   */
  getConnection(): Connection {
    return this.connection;
  }

  /**
   * Get the keypair (for advanced operations)
   */
  getKeypair(): Keypair {
    return this.keypair;
  }
}

/** Convert hex string to Uint8Array */
function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}
