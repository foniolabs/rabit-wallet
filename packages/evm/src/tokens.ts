/**
 * EVM token registry and helpers.
 *
 * Built-in token list for the 5 preset chains (mainnet + testnet pairs).
 * Native asset is represented with `address: null`. ERC-20 tokens carry a
 * contract address.
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  parseUnits,
  formatUnits,
  type Address,
  type Chain,
  type Hash,
  type PublicClient,
  type WalletClient,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import type { ChainId } from '@rabit/types';
import { getChain } from './chains.js';

export interface EvmTokenDef {
  /** Display symbol e.g. "ETH" */
  symbol: string;
  /** Display name */
  name: string;
  /** Decimals */
  decimals: number;
  /** ERC-20 contract address; null for the chain's native coin. */
  address: Address | null;
  /** Optional logo URL */
  logoUrl?: string;
}

/**
 * Per-chain token list. Keys are chain IDs.
 * Curated to the most common tokens devs/users want for testing.
 */
export const EVM_TOKEN_LIST: Record<ChainId, EvmTokenDef[]> = {
  // ─── Mainnets ───
  1: [
    nativeEth(),
    { symbol: 'USDC', name: 'USD Coin', decimals: 6, address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' },
    { symbol: 'USDT', name: 'Tether USD', decimals: 6, address: '0xdAC17F958D2ee523a2206206994597C13D831ec7' },
  ],
  137: [
    { symbol: 'POL', name: 'POL', decimals: 18, address: null },
    { symbol: 'USDC', name: 'USD Coin', decimals: 6, address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359' },
    { symbol: 'USDT', name: 'Tether USD', decimals: 6, address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F' },
  ],
  42161: [
    nativeEth(),
    { symbol: 'USDC', name: 'USD Coin', decimals: 6, address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' },
    { symbol: 'USDT', name: 'Tether USD', decimals: 6, address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9' },
  ],
  10: [
    nativeEth(),
    { symbol: 'USDC', name: 'USD Coin', decimals: 6, address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85' },
    { symbol: 'USDT', name: 'Tether USD', decimals: 6, address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58' },
  ],
  8453: [
    nativeEth(),
    { symbol: 'USDC', name: 'USD Coin', decimals: 6, address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' },
  ],

  // ─── Testnets ───
  11155111: [
    nativeEth('Sepolia Ether'),
    // Circle's official testnet USDC on Sepolia (faucet at faucet.circle.com)
    { symbol: 'USDC', name: 'USDC (Sepolia)', decimals: 6, address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' },
  ],
  80002: [
    { symbol: 'POL', name: 'POL (Amoy)', decimals: 18, address: null },
    { symbol: 'USDC', name: 'USDC (Amoy)', decimals: 6, address: '0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582' },
  ],
  421614: [
    nativeEth('Arbitrum Sepolia ETH'),
    { symbol: 'USDC', name: 'USDC (Arbitrum Sepolia)', decimals: 6, address: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d' },
  ],
  11155420: [
    nativeEth('OP Sepolia ETH'),
    { symbol: 'USDC', name: 'USDC (OP Sepolia)', decimals: 6, address: '0x5fd84259d66Cd46123540766Be93DFE6D43130D7' },
  ],
  84532: [
    nativeEth('Base Sepolia ETH'),
    { symbol: 'USDC', name: 'USDC (Base Sepolia)', decimals: 6, address: '0x036CbD53842c5426634e7929541eC2318f3dCF7e' },
  ],
};

function nativeEth(name = 'Ether'): EvmTokenDef {
  return { symbol: 'ETH', name, decimals: 18, address: null };
}

/** Get tokens for a chain id, or empty array. */
export function getEvmTokens(chainId: ChainId): EvmTokenDef[] {
  return EVM_TOKEN_LIST[chainId] ?? [];
}

// ─── Balance reads ───

const ERC20_BALANCE_ABI = [
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

const ERC20_TRANSFER_ABI = [
  {
    type: 'function',
    name: 'transfer',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

export interface EvmBalance {
  token: EvmTokenDef;
  /** Raw on-chain amount (wei for native, smallest unit for ERC-20). */
  raw: bigint;
  /** Human-readable formatted with `decimals`. */
  formatted: string;
}

export async function fetchEvmBalances(args: {
  owner: Address;
  chainId: ChainId;
  rpcUrl?: string;
  /** Extra tokens to include alongside the built-in chain list. */
  extraTokens?: EvmTokenDef[];
}): Promise<EvmBalance[]> {
  const chain = getChain(args.chainId);
  if (!chain) throw new Error(`Unsupported chainId ${args.chainId}`);
  const rpcUrl = args.rpcUrl ?? chain.rpcUrls.default.http[0];
  const client = createPublicClient({ chain, transport: http(rpcUrl) });
  const builtin = getEvmTokens(args.chainId);
  const extra = (args.extraTokens ?? []).filter(
    (t) => !builtin.some((b) => (b.address?.toLowerCase() ?? null) === (t.address?.toLowerCase() ?? null))
  );
  const tokens = [...builtin, ...extra];

  return Promise.all(
    tokens.map(async (t) => {
      const raw = t.address
        ? await client.readContract({
            address: t.address,
            abi: ERC20_BALANCE_ABI,
            functionName: 'balanceOf',
            args: [args.owner],
          })
        : await client.getBalance({ address: args.owner });
      return {
        token: t,
        raw,
        formatted: formatUnits(raw, t.decimals),
      };
    })
  );
}

// ─── Sends ───

export interface SendNativeArgs {
  privateKey: string;
  chainId: ChainId;
  to: Address;
  amount: string; // human-readable, e.g. "0.01"
  rpcUrl?: string;
}

export async function sendEvmNative(args: SendNativeArgs): Promise<Hash> {
  const chain = getChain(args.chainId);
  if (!chain) throw new Error(`Unsupported chainId ${args.chainId}`);
  const account = privateKeyToAccount(normalizeKey(args.privateKey));
  const rpcUrl = args.rpcUrl ?? chain.rpcUrls.default.http[0];
  const wallet: WalletClient = createWalletClient({ account, chain, transport: http(rpcUrl) });

  return wallet.sendTransaction({
    account,
    to: args.to,
    value: parseUnits(args.amount, 18),
    chain,
  } as any);
}

export interface SendErc20Args {
  privateKey: string;
  chainId: ChainId;
  tokenAddress: Address;
  decimals: number;
  to: Address;
  amount: string; // human-readable
  rpcUrl?: string;
}

export async function sendEvmErc20(args: SendErc20Args): Promise<Hash> {
  const chain = getChain(args.chainId);
  if (!chain) throw new Error(`Unsupported chainId ${args.chainId}`);
  const account = privateKeyToAccount(normalizeKey(args.privateKey));
  const rpcUrl = args.rpcUrl ?? chain.rpcUrls.default.http[0];
  const wallet = createWalletClient({ account, chain, transport: http(rpcUrl) });

  return wallet.writeContract({
    account,
    chain,
    address: args.tokenAddress,
    abi: ERC20_TRANSFER_ABI,
    functionName: 'transfer',
    args: [args.to, parseUnits(args.amount, args.decimals)],
  } as any);
}

function normalizeKey(key: string): `0x${string}` {
  return (key.startsWith('0x') ? key : `0x${key}`) as `0x${string}`;
}
