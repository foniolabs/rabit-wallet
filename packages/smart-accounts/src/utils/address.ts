import { Address } from '@rabit/types'
import { keccak256, toBytes, getAddress } from 'viem'

/**
 * Check if a string is a valid Ethereum address
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

/**
 * Calculate contract address using CREATE opcode
 */
export function getContractAddress(from: Address, nonce: number): Address {
  const { encodeRlp } = require('viem')
  const encoded = encodeRlp([from, `0x${nonce.toString(16)}`])
  const hash = keccak256(encoded)
  return getAddress(`0x${hash.slice(-40)}`)
}

/**
 * Calculate contract address using CREATE2 opcode
 */
export function getCreate2Address(
  deployer: Address,
  salt: string,
  initCodeHash: string
): Address {
  const encoded = `0xff${deployer.slice(2)}${salt.slice(2)}${initCodeHash.slice(2)}`
  const hash = keccak256(toBytes(encoded))
  return getAddress(`0x${hash.slice(-40)}`)
}

/**
 * Normalize address to lowercase checksum format
 */
export function normalizeAddress(address: string): Address {
  if (!isValidAddress(address)) {
    throw new Error('Invalid address format')
  }
  return getAddress(address)
}