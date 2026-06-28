/**
 * Solana token registry and helpers.
 *
 * Native SOL is represented with `mint: null`.
 * SPL tokens carry a mint address.
 */

import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
  type Commitment,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferCheckedInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import type { SolanaCluster } from '@rabit/types';
import { hexToBytes } from './hex.js';

export interface SolanaTokenDef {
  symbol: string;
  name: string;
  decimals: number;
  /** SPL mint address; null for native SOL. */
  mint: string | null;
  logoUrl?: string;
}

/** Per-cluster token list. */
export const SOLANA_TOKEN_LIST: Record<SolanaCluster, SolanaTokenDef[]> = {
  'mainnet-beta': [
    { symbol: 'SOL', name: 'Solana', decimals: 9, mint: null },
    { symbol: 'USDC', name: 'USD Coin', decimals: 6, mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' },
    { symbol: 'USDT', name: 'Tether USD', decimals: 6, mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB' },
  ],
  devnet: [
    { symbol: 'SOL', name: 'Solana (Devnet)', decimals: 9, mint: null },
    // Circle's official devnet USDC mint
    { symbol: 'USDC', name: 'USDC (Devnet)', decimals: 6, mint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU' },
  ],
  testnet: [
    { symbol: 'SOL', name: 'Solana (Testnet)', decimals: 9, mint: null },
  ],
};

export function getSolanaTokens(cluster: SolanaCluster): SolanaTokenDef[] {
  return SOLANA_TOKEN_LIST[cluster] ?? [];
}

/** Current slot for the cluster — useful for status badges. */
export async function fetchSolanaSlot(rpcUrl: string): Promise<number> {
  const conn = new Connection(rpcUrl, 'confirmed');
  return conn.getSlot();
}

/**
 * Fetch on-chain decimals for an SPL mint. Used by custom-token import.
 * Returns null if the mint doesn't exist.
 */
export async function fetchSplMintDecimals(args: {
  mint: string;
  rpcUrl: string;
}): Promise<number | null> {
  try {
    const conn = new Connection(args.rpcUrl, 'confirmed');
    const supply = await conn.getTokenSupply(new PublicKey(args.mint));
    return supply.value.decimals;
  } catch {
    return null;
  }
}

// ─── Balance reads ───

export interface SolanaBalance {
  token: SolanaTokenDef;
  /** Raw amount in smallest unit (lamports for native, smallest mint unit for SPL). */
  raw: bigint;
  /** Human-readable amount. */
  formatted: string;
}

export async function fetchSolanaBalances(args: {
  owner: string;
  rpcUrl: string;
  cluster: SolanaCluster;
  commitment?: Commitment;
  /** Extra tokens to include alongside the built-in cluster list. */
  extraTokens?: SolanaTokenDef[];
}): Promise<SolanaBalance[]> {
  const conn = new Connection(args.rpcUrl, args.commitment ?? 'confirmed');
  const owner = new PublicKey(args.owner);
  const builtin = getSolanaTokens(args.cluster);
  const extra = (args.extraTokens ?? []).filter(
    (t) => !builtin.some((b) => b.mint === t.mint)
  );
  const tokens = [...builtin, ...extra];

  return Promise.all(
    tokens.map(async (t) => {
      if (!t.mint) {
        const lamports = await conn.getBalance(owner);
        return {
          token: t,
          raw: BigInt(lamports),
          formatted: (lamports / LAMPORTS_PER_SOL).toString(),
        };
      }

      try {
        const ata = await getAssociatedTokenAddress(new PublicKey(t.mint), owner);
        const info = await conn.getTokenAccountBalance(ata);
        const raw = BigInt(info.value.amount);
        return {
          token: t,
          raw,
          formatted: info.value.uiAmountString ?? '0',
        };
      } catch {
        // ATA doesn't exist → balance is 0.
        return { token: t, raw: 0n, formatted: '0' };
      }
    })
  );
}

// ─── Sends ───

function keypairFromSeedHex(privateKeyHex: string): Keypair {
  const bytes = hexToBytes(privateKeyHex);
  if (bytes.length === 32) return Keypair.fromSeed(bytes);
  if (bytes.length === 64) return Keypair.fromSecretKey(bytes);
  throw new Error(`Unexpected key length: ${bytes.length}`);
}

export async function sendSolanaNative(args: {
  privateKeyHex: string;
  rpcUrl: string;
  to: string;
  amount: string; // SOL
  commitment?: Commitment;
}): Promise<string> {
  const conn = new Connection(args.rpcUrl, args.commitment ?? 'confirmed');
  const payer = keypairFromSeedHex(args.privateKeyHex);
  const lamports = BigInt(Math.round(parseFloat(args.amount) * LAMPORTS_PER_SOL));

  const tx = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: payer.publicKey,
      toPubkey: new PublicKey(args.to),
      lamports: Number(lamports),
    })
  );

  const sig = await conn.sendTransaction(tx, [payer]);
  await conn.confirmTransaction(sig, args.commitment ?? 'confirmed');
  return sig;
}

export async function sendSolanaSplToken(args: {
  privateKeyHex: string;
  rpcUrl: string;
  mint: string;
  decimals: number;
  to: string;
  amount: string; // human-readable
  commitment?: Commitment;
}): Promise<string> {
  const conn = new Connection(args.rpcUrl, args.commitment ?? 'confirmed');
  const payer = keypairFromSeedHex(args.privateKeyHex);
  const mint = new PublicKey(args.mint);
  const recipient = new PublicKey(args.to);

  const fromAta = await getAssociatedTokenAddress(mint, payer.publicKey);
  const toAta = await getAssociatedTokenAddress(mint, recipient);

  const tx = new Transaction();

  // Create the recipient ATA if it doesn't exist (payer pays the rent).
  const recipientAtaInfo = await conn.getAccountInfo(toAta);
  if (!recipientAtaInfo) {
    tx.add(
      createAssociatedTokenAccountInstruction(
        payer.publicKey,
        toAta,
        recipient,
        mint,
        TOKEN_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID
      )
    );
  }

  const rawAmount = BigInt(
    Math.round(parseFloat(args.amount) * Math.pow(10, args.decimals))
  );

  tx.add(
    createTransferCheckedInstruction(
      fromAta,
      mint,
      toAta,
      payer.publicKey,
      rawAmount,
      args.decimals
    )
  );

  const sig = await conn.sendTransaction(tx, [payer]);
  await conn.confirmTransaction(sig, args.commitment ?? 'confirmed');
  return sig;
}
