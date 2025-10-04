import { Address, Hex } from '@rabit/types'
import { SmartAccountSigner, SmartAccountError } from '../../types'
import { keccak256, toBytes, recoverAddress, hashMessage } from 'viem'

// Kernel validator types
export enum KernelValidatorType {
  ECDSA = 'ecdsa',
  WEBAUTHN = 'webauthn',
  MULTISIG = 'multisig',
  SESSION_KEY = 'session_key'
}

export class KernelValidator {
  private signer: SmartAccountSigner
  private validatorType: KernelValidatorType

  constructor(signer: SmartAccountSigner, validatorType: KernelValidatorType = KernelValidatorType.ECDSA) {
    this.signer = signer
    this.validatorType = validatorType
  }

  async isValidSignature(message: string | Uint8Array, signature: Hex): Promise<boolean> {
    try {
      switch (this.validatorType) {
        case KernelValidatorType.ECDSA:
          return await this.validateECDSASignature(message, signature)
        case KernelValidatorType.WEBAUTHN:
          return await this.validateWebAuthnSignature(message, signature)
        case KernelValidatorType.MULTISIG:
          return await this.validateMultisigSignature(message, signature)
        case KernelValidatorType.SESSION_KEY:
          return await this.validateSessionKeySignature(message, signature)
        default:
          // Fallback to basic validation
          return await this.validateECDSASignature(message, signature)
      }
    } catch (error) {
      console.error('Signature validation failed:', error)
      return false
    }
  }

  async validateUserOperation(userOpHash: Hex, signature: Hex): Promise<boolean> {
    try {
      // Validate user operation signature using the appropriate validator
      return await this.isValidSignature(userOpHash, signature)
    } catch (error) {
      console.error('User operation validation failed:', error)
      return false
    }
  }

  async signUserOperationHash(userOpHash: Hex): Promise<Hex> {
    try {
      // Sign the user operation hash
      return await this.signer.signMessage(userOpHash)
    } catch (error) {
      throw new SmartAccountError(
        `Failed to sign user operation hash: ${error}`,
        'SIGNATURE_FAILED',
        { userOpHash }
      )
    }
  }

  getValidatorAddress(): Address {
    // Return the appropriate validator contract address based on type
    switch (this.validatorType) {
      case KernelValidatorType.ECDSA:
        return '0xd9AB5096a832b9ce79914329DAEE236f8Eea0390' as Address
      case KernelValidatorType.WEBAUTHN:
        return '0x8104e3Ad430EA6d354d013A6789fDFc71E671c43' as Address
      case KernelValidatorType.MULTISIG:
        return '0x8104e3Ad430EA6d354d013A6789fDFc71E671c43' as Address
      case KernelValidatorType.SESSION_KEY:
        return '0xd9AB5096a832b9ce79914329DAEE236f8Eea0390' as Address
      default:
        return '0xd9AB5096a832b9ce79914329DAEE236f8Eea0390' as Address
    }
  }

  getValidatorType(): KernelValidatorType {
    return this.validatorType
  }

  encodeValidatorData(data?: any): Hex {
    // Encode validator-specific data based on type
    switch (this.validatorType) {
      case KernelValidatorType.ECDSA:
        return this.encodeECDSAValidatorData(data)
      case KernelValidatorType.WEBAUTHN:
        return this.encodeWebAuthnValidatorData(data)
      case KernelValidatorType.MULTISIG:
        return this.encodeMultisigValidatorData(data)
      case KernelValidatorType.SESSION_KEY:
        return this.encodeSessionKeyValidatorData(data)
      default:
        return this.encodeECDSAValidatorData(data)
    }
  }

  // Private validation methods

  private async validateECDSASignature(message: string | Uint8Array, signature: Hex): Promise<boolean> {
    try {
      // For ECDSA validation, we can compare with expected signature
      const expectedSignature = await this.signer.signMessage(message)
      
      // Direct comparison
      if (expectedSignature.toLowerCase() === signature.toLowerCase()) {
        return true
      }

      // Alternative: recover address from signature and compare
      const messageHash = typeof message === 'string' 
        ? hashMessage(message)
        : hashMessage({ raw: message })

      try {
        const recoveredAddress = await recoverAddress({
          hash: messageHash,
          signature
        })

        return recoveredAddress.toLowerCase() === this.signer.address.toLowerCase()
      } catch (recoverError) {
        console.warn('Address recovery failed, using direct signature comparison')
        return false
      }
    } catch (error) {
      console.error('ECDSA signature validation failed:', error)
      return false
    }
  }

  private async validateWebAuthnSignature(message: string | Uint8Array, signature: Hex): Promise<boolean> {
    try {
      // WebAuthn signature validation
      // This would involve verifying the WebAuthn assertion
      if (this.signer.type === 'passkey') {
        // For passkey signers, delegate validation to the signer
        try {
          const expectedSignature = await this.signer.signMessage(message)
          return expectedSignature.toLowerCase() === signature.toLowerCase()
        } catch (error) {
          console.warn('WebAuthn signature validation via signer failed:', error)
          return false
        }
      }
      
      // For non-passkey signers with WebAuthn validator, this would need
      // specific WebAuthn signature verification logic
      console.warn('WebAuthn validation for non-passkey signer not yet implemented')
      return false
    } catch (error) {
      console.error('WebAuthn signature validation failed:', error)
      return false
    }
  }

  private async validateMultisigSignature(message: string | Uint8Array, signature: Hex): Promise<boolean> {
    try {
      // Multisig signature validation
      // This would involve:
      // 1. Parsing the signature to extract individual signatures
      // 2. Validating each signature against known owners
      // 3. Checking if threshold is met
      
      console.warn('Multisig signature validation not yet fully implemented')
      
      // Fallback to basic validation for now
      return await this.validateECDSASignature(message, signature)
    } catch (error) {
      console.error('Multisig signature validation failed:', error)
      return false
    }
  }

  private async validateSessionKeySignature(message: string | Uint8Array, signature: Hex): Promise<boolean> {
    try {
      // Session key signature validation
      // This would involve:
      // 1. Checking if the session key is valid and not expired
      // 2. Verifying the signature against the session key
      // 3. Checking if the operation is within session key permissions
      
      console.warn('Session key signature validation not yet fully implemented')
      
      // Fallback to basic ECDSA validation for now
      return await this.validateECDSASignature(message, signature)
    } catch (error) {
      console.error('Session key signature validation failed:', error)
      return false
    }
  }

  // Encoding methods for different validator types

  private encodeECDSAValidatorData(data?: any): Hex {
    // For ECDSA validator, the init data is typically just the owner address
    const ownerAddress = data?.owner || this.signer.address
    
    // Pad address to 32 bytes (remove 0x, pad, add back 0x)
    const paddedAddress = ownerAddress.slice(2).padStart(64, '0')
    return ('0x' + paddedAddress) as Hex
  }

  private encodeWebAuthnValidatorData(data?: any): Hex {
    // WebAuthn validator data would include public key coordinates, etc.
    // This is a placeholder implementation
    console.warn('WebAuthn validator data encoding not yet implemented')
    
    if (data?.publicKey) {
      // In a real implementation, this would encode the WebAuthn public key
      return data.publicKey as Hex
    }
    
    return '0x' as Hex
  }

  private encodeMultisigValidatorData(data?: any): Hex {
    // Multisig validator data would include owners, threshold, etc.
    console.warn('Multisig validator data encoding not yet implemented')
    
    if (data?.owners && data?.threshold) {
      // In a real implementation, this would encode owners array and threshold
      return '0x' as Hex
    }
    
    return '0x' as Hex
  }

  private encodeSessionKeyValidatorData(data?: any): Hex {
    // Session key validator data would include permissions, expiry, etc.
    console.warn('Session key validator data encoding not yet implemented')
    
    if (data?.sessionKey) {
      // In a real implementation, this would encode session key data
      return '0x' as Hex
    }
    
    return '0x' as Hex
  }

  // Static factory methods for convenience

  static createECDSAValidator(signer: SmartAccountSigner): KernelValidator {
    return new KernelValidator(signer, KernelValidatorType.ECDSA)
  }

  static createWebAuthnValidator(signer: SmartAccountSigner): KernelValidator {
    return new KernelValidator(signer, KernelValidatorType.WEBAUTHN)
  }

  static createMultisigValidator(signer: SmartAccountSigner): KernelValidator {
    return new KernelValidator(signer, KernelValidatorType.MULTISIG)
  }

  static createSessionKeyValidator(signer: SmartAccountSigner): KernelValidator {
    return new KernelValidator(signer, KernelValidatorType.SESSION_KEY)
  }
}

// Utility functions

export function getValidatorInitData(
  validatorType: KernelValidatorType, 
  signer: SmartAccountSigner,
  config?: any
): Hex {
  const validator = new KernelValidator(signer, validatorType)
  return validator.encodeValidatorData(config)
}

export function isValidatorSupported(validatorType: string): boolean {
  return Object.values(KernelValidatorType).includes(validatorType as KernelValidatorType)
}

export function getValidatorAddressByType(validatorType: KernelValidatorType): Address {
  switch (validatorType) {
    case KernelValidatorType.ECDSA:
      return '0xd9AB5096a832b9ce79914329DAEE236f8Eea0390' as Address
    case KernelValidatorType.WEBAUTHN:
      return '0x8104e3Ad430EA6d354d013A6789fDFc71E671c43' as Address
    case KernelValidatorType.MULTISIG:
      return '0x8104e3Ad430EA6d354d013A6789fDFc71E671c43' as Address
    case KernelValidatorType.SESSION_KEY:
      return '0xd9AB5096a832b9ce79914329DAEE236f8Eea0390' as Address
    default:
      return '0xd9AB5096a832b9ce79914329DAEE236f8Eea0390' as Address
  }
}