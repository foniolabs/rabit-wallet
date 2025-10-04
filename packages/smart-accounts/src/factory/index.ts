import { Address } from '@rabit/types'
import { SmartAccount, SmartAccountConfig, SmartAccountType } from '../types'
import { createKernelAccount } from '../implementations/kernel'

export class SmartAccountFactory {
  static async create(config: SmartAccountConfig): Promise<SmartAccount> {
    switch (config.type) {
      case SmartAccountType.KERNEL:
        return createKernelAccount(config)
      // Add other implementations as they become available
      default:
        throw new Error(`Unsupported account type: ${config.type}`)
    }
  }
}

export function createFactory() {
  return SmartAccountFactory
}

export const kernelFactory = {
  create: (config: SmartAccountConfig) => createKernelAccount(config)
}

export const safeFactory = {
  create: (config: SmartAccountConfig) => {
    throw new Error('Safe implementation not yet available')
  }
}

export const lightAccountFactory = {
  create: (config: SmartAccountConfig) => {
    throw new Error('Light Account implementation not yet available')
  }
}

export function getBestFactory(useCase: string) {
  return kernelFactory // Default to kernel for now
}

export async function createOptimalAccount(config: SmartAccountConfig): Promise<SmartAccount> {
  return SmartAccountFactory.create(config)
}
