/**
 * src/implementations/kernel/factory.ts
 * Kernel Account Factory Implementation
 */
import { Address, Hex } from '@rabit/types'
import { SmartAccountConfig } from '../../types'
import { getContract, createPublicClient, http, getAddress, keccak256, concat, toBytes, pad, encodeFunctionData } from 'viem'

// Kernel V2 Factory ABI (simplified)
const KERNEL_FACTORY_ABI = [
  {
    "inputs": [
      {"type": "address", "name": "_implementation"},
      {"type": "bytes", "name": "_data"},
      {"type": "uint256", "name": "_index"}
    ],
    "name": "createAccount",
    "outputs": [{"type": "address", "name": "proxy"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {"type": "address", "name": "_implementation"},
      {"type": "bytes", "name": "_data"},
      {"type": "uint256", "name": "_index"}
    ],
    "name": "getAccountAddress",
    "outputs": [{"type": "address", "name": "account"}],
    "stateMutability": "view",
    "type": "function"
  }
] as const

// Kernel account constants
const KERNEL_FACTORY_ADDRESS = '0x5de4839a76cf55d0c90e2061ef4386d962E15ae3' as Address
const KERNEL_IMPLEMENTATION_ADDRESS = '0x0DA6a956B9488eD4dd761E59f52FDc6c8068E6B5' as Address
const ECDSA_VALIDATOR_ADDRESS = '0xd9AB5096a832b9ce79914329DAEE236f8Eea0390' as Address

export async function predictKernelAddress(config: SmartAccountConfig): Promise<Address> {
  try {
    const publicClient = createPublicClient({
      transport: http(config.provider.bundlerUrl),
      chain: { 
        id: config.provider.chainId, 
        name: 'Unknown', 
        network: 'unknown', 
        nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 }, 
        rpcUrls: { default: { http: [config.provider.bundlerUrl] } } 
      }
    })

    const factory = getContract({
      address: KERNEL_FACTORY_ADDRESS,
      abi: KERNEL_FACTORY_ABI,
      client: publicClient
    })

    const initData = await getKernelInitData(config)
    const salt = getSalt(config)

    const predictedAddress = await factory.read.getAccountAddress([
      KERNEL_IMPLEMENTATION_ADDRESS,
      initData,
      salt
    ])

    return getAddress(predictedAddress)
  } catch (error) {
    console.error('Error predicting Kernel address:', error)
    throw new Error(`Failed to predict Kernel address: ${error}`)
  }
}

export async function getKernelInitCode(config: SmartAccountConfig): Promise<Hex> {
  try {
    const initData = await getKernelInitData(config)
    const salt = getSalt(config)

    // Encode factory call: factory.createAccount(implementation, initData, salt)
    const createCallData = encodeFunctionData({
      abi: KERNEL_FACTORY_ABI,
      functionName: 'createAccount',
      args: [KERNEL_IMPLEMENTATION_ADDRESS, initData, salt]
    })

    // Return factory address + create call data
    return concat([KERNEL_FACTORY_ADDRESS, createCallData]) as Hex
  } catch (error) {
    console.error('Error getting Kernel init code:', error)
    throw new Error(`Failed to get Kernel init code: ${error}`)
  }
}

async function getKernelInitData(config: SmartAccountConfig): Promise<Hex> {
  // Kernel initialization data includes:
  // 1. Validator address
  // 2. Validator init data (owner address for ECDSA validator)
  
  const validatorInitData = encodeValidatorInitData(config.signer.address)
  
  // Encode the initialize call for Kernel account
  const initData = encodeFunctionData({
    abi: [
      {
        "inputs": [
          {"type": "address", "name": "_defaultValidator"},
          {"type": "bytes", "name": "_data"}
        ],
        "name": "initialize",
        "type": "function"
      }
    ],
    functionName: 'initialize',
    args: [ECDSA_VALIDATOR_ADDRESS, validatorInitData]
  })

  return initData as Hex
}

function encodeValidatorInitData(owner: Address): Hex {
  // For ECDSA validator, init data is just the owner address
  return pad(owner, { size: 32 }) as Hex
}

function getSalt(config: SmartAccountConfig): bigint {
  if (config.salt) {
    return BigInt(config.salt)
  }
  
  // Generate deterministic salt based on signer address
  const saltData = concat([
    toBytes(config.signer.address),
    toBytes('kernel-v2')
  ])
  
  const saltHash = keccak256(saltData)
  return BigInt(saltHash)
}

export function getKernelFactoryAddress(): Address {
  return KERNEL_FACTORY_ADDRESS
}

export function getKernelImplementationAddress(): Address {
  return KERNEL_IMPLEMENTATION_ADDRESS
}

export function getECDSAValidatorAddress(): Address {
  return ECDSA_VALIDATOR_ADDRESS
}