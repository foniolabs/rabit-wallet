/**
 * Smart account (ERC-4337) wrapper.
 *
 * Uses `permissionless` so we don't reimplement the ERC-4337 plumbing
 * (factory calldata, entryPoint handshake, userOp packing/signing, bundler RPC).
 *
 * Supports three implementations, selected via `SmartAccountConfig.type`:
 *   - kernel — ZeroDev Kernel v3
 *   - safe   — Safe 4337 module
 *   - light  — Alchemy LightAccount
 */

import {
  createPublicClient,
  http,
  type Address,
  type Hash,
  type Hex,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
// permissionless 0.1.x uses loose generics; we cast at the boundary to keep
// the surface of this wrapper readable.
import { ENTRYPOINT_ADDRESS_V07, createSmartAccountClient } from 'permissionless';
import { createPimlicoPaymasterClient } from 'permissionless/clients/pimlico';
import {
  signerToEcdsaKernelSmartAccount,
  signerToSafeSmartAccount,
  signerToLightSmartAccount,
} from 'permissionless/accounts';

import type {
  SmartAccount,
  SmartAccountCall,
  SmartAccountConfig,
  SmartAccountImpl,
  SmartAccountSendResult,
} from './types.js';

function normalizePrivateKey(key: string): Hex {
  return (key.startsWith('0x') ? key : `0x${key}`) as Hex;
}

async function buildPermissionlessAccount(
  impl: SmartAccountImpl,
  publicClient: any,
  signer: ReturnType<typeof privateKeyToAccount>,
  entryPoint: Address,
  index?: bigint
): Promise<any> {
  const common = { signer, entryPoint: entryPoint as any };
  switch (impl) {
    case 'kernel':
      return signerToEcdsaKernelSmartAccount(publicClient, { ...common, index } as any);
    case 'safe':
      return signerToSafeSmartAccount(publicClient, {
        ...common,
        safeVersion: '1.4.1',
        saltNonce: index,
      } as any);
    case 'light':
      return signerToLightSmartAccount(publicClient, {
        ...common,
        lightAccountVersion: '1.1.0',
        index,
      } as any);
  }
}

export class RabitSmartAccount implements SmartAccount {
  private publicClient: any;
  private readyPromise: Promise<void>;
  private account!: any;
  private smartAccountClient!: any;
  private _address!: Address;

  constructor(private config: SmartAccountConfig) {
    this.publicClient = createPublicClient({
      chain: config.chain,
      transport: http(config.rpcUrl),
    });
    this.readyPromise = this.init();
  }

  private async init(): Promise<void> {
    const entryPoint = (this.config.entryPointAddress ?? ENTRYPOINT_ADDRESS_V07) as Address;
    const signer = privateKeyToAccount(normalizePrivateKey(this.config.ownerPrivateKey));

    this.account = await buildPermissionlessAccount(
      this.config.type,
      this.publicClient,
      signer,
      entryPoint,
      this.config.index
    );
    this._address = this.account.address;

    const paymasterClient = this.config.paymasterUrl
      ? createPimlicoPaymasterClient({
          chain: this.config.chain,
          transport: http(this.config.paymasterUrl),
          entryPoint: entryPoint as any,
        })
      : undefined;

    this.smartAccountClient = createSmartAccountClient({
      account: this.account,
      chain: this.config.chain,
      bundlerTransport: http(this.config.bundlerUrl),
      middleware: paymasterClient
        ? {
            sponsorUserOperation: (paymasterClient as any).sponsorUserOperation,
          }
        : undefined,
    } as any);
  }

  private async ready(): Promise<void> {
    await this.readyPromise;
  }

  get address(): Address {
    if (!this._address) {
      throw new Error('SmartAccount not initialized yet — await a method call first');
    }
    return this._address;
  }

  async getAddress(): Promise<Address> {
    await this.ready();
    return this._address;
  }

  async isDeployed(): Promise<boolean> {
    await this.ready();
    const code = await this.publicClient.getBytecode({ address: this._address });
    return !!code && code !== '0x';
  }

  async deploy(): Promise<SmartAccountSendResult> {
    return this.execute({ to: this._address, value: 0n, data: '0x' });
  }

  async execute(call: SmartAccountCall): Promise<SmartAccountSendResult> {
    await this.ready();
    const hash = await this.smartAccountClient.sendTransaction({
      to: call.to,
      value: call.value ?? 0n,
      data: call.data ?? '0x',
    });
    return { userOpHash: hash as Hash, txHash: hash as Hash };
  }

  async executeBatch(calls: SmartAccountCall[]): Promise<SmartAccountSendResult> {
    await this.ready();
    const txs = calls.map(c => ({
      to: c.to,
      value: c.value ?? 0n,
      data: c.data ?? '0x',
    }));
    const hash = await this.smartAccountClient.sendTransactions({ transactions: txs });
    return { userOpHash: hash as Hash, txHash: hash as Hash };
  }

  async signMessage(message: string): Promise<Hex> {
    await this.ready();
    return this.account.signMessage({ message });
  }

  async signTypedData(typedData: unknown): Promise<Hex> {
    await this.ready();
    return this.account.signTypedData(typedData as any);
  }

  async getNonce(): Promise<bigint> {
    await this.ready();
    return this.account.getNonce();
  }
}

/**
 * Convenience factory — creates and returns a smart account ready to use.
 * Does the async init eagerly so `.address` is safe to read immediately after `await`.
 */
export async function createSmartAccount(config: SmartAccountConfig): Promise<RabitSmartAccount> {
  const sa = new RabitSmartAccount(config);
  await sa.getAddress();
  return sa;
}
