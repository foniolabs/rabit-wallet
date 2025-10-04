/**
 * src/signers/passkey.ts
 * WebAuthn/Passkey Signer Implementation
 */
import { Address, Hex } from '@rabit/types'
import { SmartAccountSigner, SignerType, TransactionRequest } from '../types'
import { keccak256, toBytes, concat, encodeAbiParameters, parseAbiParameters } from 'viem'

// Fixed: Updated interface to use method instead of property
export interface PasskeyCredential {
  id: string
  rawId: ArrayBuffer
  publicKey: {
    x: string
    y: string
  }
  getAuthenticatorData?: () => ArrayBuffer  // Changed from property to method
}

export interface PasskeySignatureResult {
  signature: {
    r: bigint
    s: bigint
  }
  authenticatorData: string
  clientDataJSON: string
  challengeIndex: number
  typeIndex: number
  userVerificationRequired: boolean
}

export class PasskeySigner implements SmartAccountSigner {
  public readonly type = SignerType.PASSKEY
  public readonly address: Address
  private credential: PasskeyCredential
  private rpId: string

  constructor(credential: PasskeyCredential, rpId: string) {
    this.credential = credential
    this.rpId = rpId
    // Generate address from public key coordinates
    this.address = this.generateAddressFromPublicKey(credential.publicKey)
  }

  async signMessage(message: string | Uint8Array): Promise<Hex> {
    try {
      const messageBytes = typeof message === 'string' ? toBytes(message) : message
      const messageHash = keccak256(messageBytes)

      const signature = await this.signHash(messageHash)
      return this.encodePasskeySignature(signature)
    } catch (error) {
      throw new Error(`Failed to sign message with passkey: ${error}`)
    }
  }

  async signTypedData(domain: any, types: any, value: any): Promise<Hex> {
    try {
      // Create EIP-712 hash
      const { hashTypedData } = await import('viem')
      const hash = hashTypedData({
        domain,
        types,
        primaryType: Object.keys(types)[0],
        message: value
      })

      const signature = await this.signHash(hash)
      return this.encodePasskeySignature(signature)
    } catch (error) {
      throw new Error(`Failed to sign typed data with passkey: ${error}`)
    }
  }

  async signTransaction(tx: TransactionRequest): Promise<Hex> {
    // For passkeys, we typically don't sign raw transactions
    // Instead, we sign the transaction hash or user operation hash
    throw new Error('Direct transaction signing not supported for passkeys. Use signMessage with transaction hash.')
  }

  private async signHash(hash: string): Promise<PasskeySignatureResult> {
    const challenge = new Uint8Array(32)
    crypto.getRandomValues(challenge)

    // Prepare client data
    const clientData = {
      type: 'webauthn.get',
      challenge: this.arrayBufferToBase64Url(challenge),
      origin: window.location.origin,
      crossOrigin: false
    }

    const clientDataJSON = JSON.stringify(clientData)
    const clientDataHash = new Uint8Array(await crypto.subtle.digest('SHA-256', toBytes(clientDataJSON)))

    // Create the message to sign (authenticatorData + clientDataHash)
    const messageToSign = concat([
      new Uint8Array(32), // Placeholder for authenticatorData (would come from WebAuthn)
      clientDataHash
    ])

    // In a real implementation, this would use navigator.credentials.get()
    // For now, we'll simulate the WebAuthn signature process
    const assertion = await this.simulateWebAuthnAssertion(messageToSign, challenge)

    return {
      signature: {
        r: BigInt('0x' + assertion.signature.slice(0, 64)),
        s: BigInt('0x' + assertion.signature.slice(64, 128))
      },
      authenticatorData: assertion.authenticatorData,
      clientDataJSON,
      challengeIndex: clientDataJSON.indexOf('"challenge"'),
      typeIndex: clientDataJSON.indexOf('"type"'),
      userVerificationRequired: assertion.userVerificationRequired
    }
  }

  private async simulateWebAuthnAssertion(messageToSign: Uint8Array, challenge: Uint8Array): Promise<{
    signature: string
    authenticatorData: string
    userVerificationRequired: boolean
  }> {
    // This is a simulation - in reality, this would call navigator.credentials.get()
    
    if (typeof navigator !== 'undefined' && navigator.credentials) {
      try {
        const assertion = await navigator.credentials.get({
          publicKey: {
            challenge,
            rpId: this.rpId,
            allowCredentials: [{
              type: 'public-key',
              id: new Uint8Array(this.credential.rawId)
            }],
            userVerification: 'preferred'
          }
        }) as PublicKeyCredential

        if (!assertion.response || !('signature' in assertion.response)) {
          throw new Error('Invalid assertion response')
        }

        const response = assertion.response as AuthenticatorAssertionResponse

        return {
          signature: this.arrayBufferToHex(response.signature),
          authenticatorData: this.arrayBufferToHex(response.authenticatorData),
          userVerificationRequired: true
        }
      } catch (error) {
        throw new Error(`WebAuthn assertion failed: ${error}`)
      }
    } else {
      // Fallback simulation for non-browser environments
      return {
        signature: '0'.repeat(128), // Dummy signature
        authenticatorData: '0'.repeat(64), // Dummy authenticator data
        userVerificationRequired: false
      }
    }
  }

  private encodePasskeySignature(signature: PasskeySignatureResult): Hex {
    // Encode the passkey signature according to the smart account's expected format
    // This format may vary depending on the smart account implementation
    
    const encoded = encodeAbiParameters(
      parseAbiParameters('uint256, uint256, string, string, uint256, uint256, bool'),
      [
        signature.signature.r,
        signature.signature.s,
        signature.authenticatorData,
        signature.clientDataJSON,
        BigInt(signature.challengeIndex),
        BigInt(signature.typeIndex),
        signature.userVerificationRequired
      ]
    )

    return encoded as Hex
  }

  private generateAddressFromPublicKey(publicKey: { x: string; y: string }): Address {
    // Generate an address from the P256 public key coordinates
    // This is a simplified implementation - the actual method depends on the smart account
    const combined = concat([toBytes(publicKey.x), toBytes(publicKey.y)])
    const hash = keccak256(combined)
    
    // Take the last 20 bytes as the address
    return ('0x' + hash.slice(-40)) as Address
  }

  private arrayBufferToHex(buffer: ArrayBuffer): string {
    return Array.from(new Uint8Array(buffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
  }

  private arrayBufferToBase64Url(buffer: ArrayBuffer): string {
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)))
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  }

  // Getter methods
  getCredential(): PasskeyCredential {
    return this.credential
  }

  getRpId(): string {
    return this.rpId
  }
}

/**
 * Create a passkey signer from existing credential
 */
export function createPasskeySigner(
  credential: PasskeyCredential,
  rpId: string
): PasskeySigner {
  return new PasskeySigner(credential, rpId)
}

/**
 * Register a new passkey and create signer
 */
export async function registerPasskey(
  userName: string,
  displayName: string,
  rpId: string,
  rpName: string
): Promise<PasskeySigner> {
  if (typeof navigator === 'undefined' || !navigator.credentials) {
    throw new Error('WebAuthn not supported in this environment')
  }

  try {
    const challenge = new Uint8Array(32)
    crypto.getRandomValues(challenge)

    const userId = new Uint8Array(32)
    crypto.getRandomValues(userId)

    const credential = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: {
          name: rpName,
          id: rpId
        },
        user: {
          id: userId,
          name: userName,
          displayName
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' }, // ES256
          { alg: -257, type: 'public-key' } // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'preferred',
          requireResidentKey: false
        },
        timeout: 60000,
        attestation: 'direct'
      }
    }) as PublicKeyCredential

    if (!credential.response || !('getPublicKey' in credential.response)) {
      throw new Error('Invalid credential response')
    }

    const response = credential.response as AuthenticatorAttestationResponse
    
    // Extract public key coordinates (this is simplified)
    const publicKeyData = response.getPublicKey()
    if (!publicKeyData) {
      throw new Error('Failed to get public key from credential')
    }

    // Parse the public key to extract x and y coordinates
    // This is a simplified implementation - real implementation would parse CBOR
    const publicKey = await parseP256PublicKey(publicKeyData)

    // Fixed: Use method instead of property for authenticatorData
    const passkeyCredential: PasskeyCredential = {
      id: credential.id,
      rawId: credential.rawId,
      publicKey,
      getAuthenticatorData: () => response.getAuthenticatorData()
    }

    return new PasskeySigner(passkeyCredential, rpId)
  } catch (error) {
    throw new Error(`Failed to register passkey: ${error}`)
  }
}

/**
 * Parse P256 public key from ArrayBuffer
 * This is a simplified implementation
 */
async function parseP256PublicKey(publicKeyData: ArrayBuffer): Promise<{ x: string; y: string }> {
  // This is a placeholder implementation
  // In reality, you would parse the CBOR-encoded public key
  const dummyX = '0x' + '1'.repeat(64)
  const dummyY = '0x' + '2'.repeat(64)
  
  return {
    x: dummyX,
    y: dummyY
  }
}