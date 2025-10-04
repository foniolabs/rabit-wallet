import { ProviderType } from '../../types'

export class ZeroDevProvider {
  public readonly type = ProviderType.ZERODEV
  // Placeholder implementation
}

export function createZeroDevProvider() {
  throw new Error('ZeroDev provider implementation not yet available')
}

export function createZeroDevClient() {
  throw new Error('ZeroDev client implementation not yet available')
}