import { SmartAccount, SmartAccountConfig } from '../../types'

export class LightAccountSmartAccount implements Partial<SmartAccount> {
  // Placeholder implementation
}

export async function createLightAccount(config: SmartAccountConfig): Promise<SmartAccount> {
  throw new Error('Light Account implementation not yet available')
}
