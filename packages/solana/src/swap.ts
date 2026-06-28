/**
 * Solana swap helpers — Jupiter aggregator (v6).
 *
 * Public API, no key required. Two-step flow:
 *   1. /quote      — get the best route + price
 *   2. /swap       — receive a serialized VersionedTransaction
 *   3. sign + send — caller signs with their wallet
 *
 *   docs: https://station.jup.ag/docs/apis/swap-api
 *
 * Jupiter only supports mainnet-beta. Devnet/testnet swap demos won't work.
 */

import {
  Connection,
  VersionedTransaction,
  type Commitment,
} from '@solana/web3.js';
import { hexToBytes } from './hex.js';
import { Keypair } from '@solana/web3.js';

const JUP_BASE = 'https://quote-api.jup.ag/v6';

/** Native SOL is represented as the wrapped-SOL mint in Jupiter's API. */
export const SOL_MINT = 'So11111111111111111111111111111111111111112';

export interface JupiterQuoteRequest {
  inputMint: string;
  outputMint: string;
  /** Smallest-unit amount as a string (decimals depend on inputMint). */
  amount: string;
  /** Slippage in basis points. Default 50 (0.5%). */
  slippageBps?: number;
  /** Treat amount as the OUTPUT amount instead of input. */
  exactOut?: boolean;
}

export interface JupiterQuote {
  /** Output in smallest unit. */
  outAmount: string;
  /** Other amount threshold (min out for ExactIn, max in for ExactOut). */
  otherAmountThreshold: string;
  priceImpactPct: string;
  /** The route ID Jupiter will execute. */
  raw: any;
}

export async function getJupiterQuote(req: JupiterQuoteRequest): Promise<JupiterQuote> {
  const params = new URLSearchParams({
    inputMint: req.inputMint,
    outputMint: req.outputMint,
    amount: req.amount,
    slippageBps: String(req.slippageBps ?? 50),
    swapMode: req.exactOut ? 'ExactOut' : 'ExactIn',
  });

  const res = await fetch(`${JUP_BASE}/quote?${params}`);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Jupiter quote failed (${res.status}): ${text || res.statusText}`);
  }
  const json = await res.json();
  return {
    outAmount: json.outAmount,
    otherAmountThreshold: json.otherAmountThreshold,
    priceImpactPct: json.priceImpactPct,
    raw: json,
  };
}

function keypairFromHex(privateKeyHex: string): Keypair {
  const bytes = hexToBytes(privateKeyHex);
  if (bytes.length === 32) return Keypair.fromSeed(bytes);
  if (bytes.length === 64) return Keypair.fromSecretKey(bytes);
  throw new Error(`Unexpected key length: ${bytes.length}`);
}

/**
 * Execute a Jupiter quote: fetch the swap transaction, sign with the wallet,
 * broadcast, and confirm.
 */
export async function executeJupiterSwap(args: {
  quote: JupiterQuote;
  privateKeyHex: string;
  rpcUrl: string;
  commitment?: Commitment;
}): Promise<string> {
  const payer = keypairFromHex(args.privateKeyHex);

  const swapRes = await fetch(`${JUP_BASE}/swap`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quoteResponse: args.quote.raw,
      userPublicKey: payer.publicKey.toBase58(),
      wrapAndUnwrapSol: true,
      // 'auto' lets Jupiter pick a safe priority fee for the network state.
      prioritizationFeeLamports: 'auto',
      dynamicComputeUnitLimit: true,
    }),
  });
  if (!swapRes.ok) {
    const text = await swapRes.text().catch(() => '');
    throw new Error(`Jupiter swap build failed (${swapRes.status}): ${text || swapRes.statusText}`);
  }
  const { swapTransaction } = await swapRes.json();

  // swapTransaction is a base64-encoded VersionedTransaction.
  const txBuf = base64Decode(swapTransaction);
  const tx = VersionedTransaction.deserialize(txBuf);
  tx.sign([payer]);

  const conn = new Connection(args.rpcUrl, args.commitment ?? 'confirmed');
  const sig = await conn.sendRawTransaction(tx.serialize(), {
    skipPreflight: false,
    preflightCommitment: args.commitment ?? 'confirmed',
  });
  await conn.confirmTransaction(sig, args.commitment ?? 'confirmed');
  return sig;
}

function base64Decode(s: string): Uint8Array {
  // browser Buffer is shimmed at app boot in our example; fall back to atob
  // when not available.
  if (typeof globalThis.Buffer !== 'undefined') {
    return new Uint8Array(globalThis.Buffer.from(s, 'base64'));
  }
  const binary = atob(s);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}
