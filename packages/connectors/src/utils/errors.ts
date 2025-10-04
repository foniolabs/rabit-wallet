/**
 * Connector-specific error classes
 */
import { BaseRabitError, RabitErrorCodes, type RabitErrorCode } from '@rabit/types'

export class ConnectorError extends BaseRabitError {
  constructor(message: string, code?: RabitErrorCode, cause?: Error) {
    super(message, code || RabitErrorCodes.CONNECTION_FAILED, { cause })
  }
}

export class WalletConnectionError extends ConnectorError {
  constructor(walletType: string, message: string, cause?: Error) {
    super(`${walletType} connection failed: ${message}`, RabitErrorCodes.CONNECTION_FAILED, cause)
  }
}

export class WalletNotSupportedError extends ConnectorError {
  constructor(walletType: string) {
    super(`Wallet ${walletType} is not supported on this platform`, RabitErrorCodes.WALLET_NOT_SUPPORTED)
  }
}

export class ChainSwitchError extends ConnectorError {
  constructor(chainId: number, cause?: Error) {
    super(`Failed to switch to chain ${chainId}`, RabitErrorCodes.CHAIN_SWITCH_FAILED, cause)
  }
}

export class SignatureError extends ConnectorError {
  constructor(message: string, cause?: Error) {
    super(`Signature failed: ${message}`, RabitErrorCodes.INVALID_SIGNATURE, cause)
  }
}