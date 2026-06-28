/**
 * Solana Memo program helpers.
 *
 * The Memo program (`MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr`) is built
 * into Solana — no deployment required. It stores a UTF-8 string in a
 * transaction, signed by the user. Perfect for demonstrating signed
 * "smart contract" interactions without scaffolding an Anchor program.
 */

import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  type Commitment,
  type Finality,
} from '@solana/web3.js';
import { hexToBytes } from './hex.js';
import { Keypair } from '@solana/web3.js';

export const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

function keypairFromHex(privateKeyHex: string): Keypair {
  const bytes = hexToBytes(privateKeyHex);
  if (bytes.length === 32) return Keypair.fromSeed(bytes);
  if (bytes.length === 64) return Keypair.fromSecretKey(bytes);
  throw new Error(`Unexpected key length: ${bytes.length}`);
}

export async function sendSolanaMemo(args: {
  privateKeyHex: string;
  rpcUrl: string;
  message: string;
  commitment?: Commitment;
}): Promise<string> {
  const conn = new Connection(args.rpcUrl, args.commitment ?? 'confirmed');
  const payer = keypairFromHex(args.privateKeyHex);

  const ix = new TransactionInstruction({
    keys: [{ pubkey: payer.publicKey, isSigner: true, isWritable: false }],
    programId: MEMO_PROGRAM_ID,
    data: Buffer.from(args.message, 'utf8'),
  });

  const tx = new Transaction().add(ix);
  const sig = await conn.sendTransaction(tx, [payer]);
  await conn.confirmTransaction(sig, args.commitment ?? 'confirmed');
  return sig;
}

export interface MemoEntry {
  signature: string;
  blockTime: number | null;
  /** First memo found in this transaction's logs (if any). */
  memo: string | null;
}

/**
 * Fetch the user's recent memos by scanning their transaction history and
 * pulling the memo instruction's UTF-8 payload from the logs.
 */
export async function getRecentSolanaMemos(args: {
  owner: string;
  rpcUrl: string;
  limit?: number;
  commitment?: Commitment;
}): Promise<MemoEntry[]> {
  const conn = new Connection(args.rpcUrl, args.commitment ?? 'confirmed');
  const owner = new PublicKey(args.owner);

  const sigs = await conn.getSignaturesForAddress(owner, { limit: args.limit ?? 10 });

  // getTransaction only accepts Finality ('confirmed' | 'finalized'), not the
  // broader Commitment type that includes 'processed'.
  const finality: Finality = args.commitment === 'finalized' ? 'finalized' : 'confirmed';
  const txs = await Promise.all(
    sigs.map((s) =>
      conn.getTransaction(s.signature, {
        commitment: finality,
        maxSupportedTransactionVersion: 0,
      })
    )
  );

  return sigs.map((s, i) => {
    const tx = txs[i];
    if (!tx) {
      return { signature: s.signature, blockTime: s.blockTime ?? null, memo: null };
    }
    const log = tx.meta?.logMessages?.find((l) => l.startsWith('Program log: Memo'));
    // Parse: `Program log: Memo (len 5): "hello"`
    const match = log?.match(/Memo \(len \d+\): "(.*)"/);
    return {
      signature: s.signature,
      blockTime: s.blockTime ?? null,
      memo: match?.[1] ?? null,
    };
  });
}

/**
 * Send an arbitrary array of TransactionInstructions, signed by the wallet.
 * Use this for any program that isn't covered by a built-in helper.
 */
export async function sendSolanaInstructions(args: {
  privateKeyHex: string;
  rpcUrl: string;
  instructions: TransactionInstruction[];
  commitment?: Commitment;
}): Promise<string> {
  const conn = new Connection(args.rpcUrl, args.commitment ?? 'confirmed');
  const payer = keypairFromHex(args.privateKeyHex);
  const tx = new Transaction();
  args.instructions.forEach((ix) => tx.add(ix));
  const sig = await conn.sendTransaction(tx, [payer]);
  await conn.confirmTransaction(sig, args.commitment ?? 'confirmed');
  return sig;
}
