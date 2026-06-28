import type { Address, Hash, Hex, Chain } from 'viem';

export type SmartAccountImpl = 'kernel' | 'safe' | 'light';

export interface SmartAccountConfig {
  /** Which smart-account implementation to deploy. */
  type: SmartAccountImpl;
  /** Hex-encoded owner private key (signer for the smart account). */
  ownerPrivateKey: string;
  /** Target chain. */
  chain: Chain;
  /** RPC URL for on-chain reads. */
  rpcUrl: string;
  /** ERC-4337 bundler RPC (eth_sendUserOperation, etc.). */
  bundlerUrl: string;
  /** Optional paymaster RPC for gas sponsorship. */
  paymasterUrl?: string;
  /** Account index (salt) — lets one owner have multiple smart accounts. */
  index?: bigint;
  /** EntryPoint address override (defaults to canonical 0.7). */
  entryPointAddress?: Address;
}

export interface SmartAccountCall {
  to: Address;
  value?: bigint;
  data?: Hex;
}

export interface SmartAccountSendResult {
  userOpHash: Hash;
  /** Returned once the userOp is included; null if not waited on. */
  txHash: Hash | null;
}

export interface SmartAccount {
  /** Counterfactual smart-account address (may or may not be deployed). */
  readonly address: Address;
  /** True once the account contract exists on-chain. */
  isDeployed(): Promise<boolean>;
  /** Deploy the smart account by submitting a no-op userOp. */
  deploy(): Promise<SmartAccountSendResult>;
  /** Execute a single call. */
  execute(call: SmartAccountCall): Promise<SmartAccountSendResult>;
  /** Execute a batch of calls atomically. */
  executeBatch(calls: SmartAccountCall[]): Promise<SmartAccountSendResult>;
  /** Sign an arbitrary message via the account (ERC-1271 compatible). */
  signMessage(message: string): Promise<Hex>;
  /** Sign EIP-712 typed data (ERC-1271 compatible). */
  signTypedData(typedData: unknown): Promise<Hex>;
  /** Current on-chain nonce for the account in the EntryPoint. */
  getNonce(): Promise<bigint>;
}
