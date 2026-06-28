/**
 * EVM smart-contract helpers.
 *
 * Thin friendly wrappers over viem's `readContract` / `writeContract`. Devs
 * can pass in their own ABI + function name + args; we handle chain lookup,
 * RPC client construction, and account binding.
 */

import {
  createPublicClient,
  createWalletClient,
  http,
  type Abi,
  type Address,
  type Hash,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import type { ChainId } from '@rabit/types';
import { getChain } from './chains.js';

/** Get the latest block number for a chain. */
export async function fetchEvmBlockNumber(args: {
  chainId: ChainId;
  rpcUrl?: string;
}): Promise<bigint> {
  const chain = getChain(args.chainId);
  if (!chain) throw new Error(`Unsupported chainId ${args.chainId}`);
  const rpcUrl = args.rpcUrl ?? chain.rpcUrls.default.http[0];
  const client = createPublicClient({ chain, transport: http(rpcUrl) });
  return client.getBlockNumber();
}

export interface EvmFeeEstimateArgs {
  chainId: ChainId;
  from: Address;
  to: Address;
  value?: bigint;
  abi?: Abi;
  functionName?: string;
  callArgs?: readonly unknown[];
  rpcUrl?: string;
}

export interface EvmFeeEstimateResult {
  /** Total fee in wei (gas × gasPrice). */
  totalWei: bigint;
  /** Gas units. */
  gas: bigint;
  /** Gas price in wei. */
  gasPrice: bigint;
}

export async function signEvmMessage(args: {
  privateKey: string;
  message: string;
}): Promise<`0x${string}`> {
  const account = privateKeyToAccount(
    (args.privateKey.startsWith('0x') ? args.privateKey : `0x${args.privateKey}`) as `0x${string}`
  );
  return account.signMessage({ message: args.message });
}

export async function signEvmTypedData(args: {
  privateKey: string;
  /** EIP-712 typed data — pass viem's TypedDataDefinition. */
  typedData: any;
}): Promise<`0x${string}`> {
  const account = privateKeyToAccount(
    (args.privateKey.startsWith('0x') ? args.privateKey : `0x${args.privateKey}`) as `0x${string}`
  );
  return account.signTypedData(args.typedData);
}

export async function estimateEvmFee(args: EvmFeeEstimateArgs): Promise<EvmFeeEstimateResult> {
  const chain = getChain(args.chainId);
  if (!chain) throw new Error(`Unsupported chainId ${args.chainId}`);
  const rpcUrl = args.rpcUrl ?? chain.rpcUrls.default.http[0];
  const client = createPublicClient({ chain, transport: http(rpcUrl) });

  const [gas, gasPrice] = await Promise.all([
    args.abi && args.functionName
      ? client.estimateContractGas({
          account: args.from,
          address: args.to,
          abi: args.abi,
          functionName: args.functionName,
          args: args.callArgs ?? [],
          value: args.value,
        } as any)
      : client.estimateGas({
          account: args.from,
          to: args.to,
          value: args.value ?? 0n,
        } as any),
    client.getGasPrice(),
  ]);

  return { totalWei: gas * gasPrice, gas, gasPrice };
}

export interface ReadContractArgs {
  chainId: ChainId;
  address: Address;
  abi: Abi;
  functionName: string;
  args?: readonly unknown[];
  rpcUrl?: string;
}

export async function readEvmContract<T = unknown>(opts: ReadContractArgs): Promise<T> {
  const chain = getChain(opts.chainId);
  if (!chain) throw new Error(`Unsupported chainId ${opts.chainId}`);
  const rpcUrl = opts.rpcUrl ?? chain.rpcUrls.default.http[0];
  const client = createPublicClient({ chain, transport: http(rpcUrl) });

  return client.readContract({
    address: opts.address,
    abi: opts.abi,
    functionName: opts.functionName,
    args: opts.args ?? [],
  } as any) as Promise<T>;
}

export interface WriteContractArgs {
  chainId: ChainId;
  privateKey: string;
  address: Address;
  abi: Abi;
  functionName: string;
  args?: readonly unknown[];
  /** ETH (or chain native) value to send with the call (in wei). */
  value?: bigint;
  rpcUrl?: string;
}

export async function writeEvmContract(opts: WriteContractArgs): Promise<Hash> {
  const chain = getChain(opts.chainId);
  if (!chain) throw new Error(`Unsupported chainId ${opts.chainId}`);
  const account = privateKeyToAccount(
    (opts.privateKey.startsWith('0x') ? opts.privateKey : `0x${opts.privateKey}`) as `0x${string}`
  );
  const rpcUrl = opts.rpcUrl ?? chain.rpcUrls.default.http[0];
  const wallet = createWalletClient({ account, chain, transport: http(rpcUrl) });

  return wallet.writeContract({
    account,
    chain,
    address: opts.address,
    abi: opts.abi,
    functionName: opts.functionName,
    args: opts.args ?? [],
    value: opts.value,
  } as any);
}

/**
 * Tiny ERC-20 ABI subset — useful as a default for the most common contract
 * interactions (balance / approve / transfer / allowance / metadata).
 * Devs can pass their own ABI; this is here for convenience.
 */
export const ERC20_ABI = [
  { type: 'function', name: 'name', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
  { type: 'function', name: 'symbol', stateMutability: 'view', inputs: [], outputs: [{ type: 'string' }] },
  { type: 'function', name: 'decimals', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint8' }] },
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'allowance',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
  },
] as const satisfies Abi;
