import { Address, Hex } from '@rabit/types'
import { 
  encodeFunctionData, 
  encodeAbiParameters, 
  parseAbiParameters,
  concat,
  keccak256  
} from 'viem'

/**
 * Encode call data for a simple execute function
 */
export function encodeCallData(target: Address, value: bigint, data: Hex): Hex {
  return encodeFunctionData({
    abi: [
      {
        inputs: [
          { name: 'dest', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'func', type: 'bytes' }
        ],
        name: 'execute',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
      }
    ],
    functionName: 'execute',
    args: [target, value, data]
  }) as Hex
}

/**
 * Encode call data for batch transactions
 */
export function encodeBatchCallData(
  calls: Array<{ target: Address; value: bigint; data: Hex }>
): Hex {
  const targets = calls.map(call => call.target)
  const values = calls.map(call => call.value)
  const datas = calls.map(call => call.data)

  return encodeFunctionData({
    abi: [
      {
        inputs: [
          { name: 'dest', type: 'address[]' },
          { name: 'value', type: 'uint256[]' },
          { name: 'func', type: 'bytes[]' }
        ],
        name: 'executeBatch',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
      }
    ],
    functionName: 'executeBatch',
    args: [targets, values, datas]
  }) as Hex
}

/**
 * Encode user operation for hashing
 */
export function encodeUserOperation(userOp: any): Hex {
  return encodeAbiParameters(
    parseAbiParameters('address, uint256, bytes32, bytes32, uint256, uint256, uint256, uint256, uint256, bytes32'),
    [
      userOp.sender,
      userOp.nonce,
      userOp.initCode ? keccak256(userOp.initCode) : '0x0000000000000000000000000000000000000000000000000000000000000000',
      userOp.callData ? keccak256(userOp.callData) : '0x0000000000000000000000000000000000000000000000000000000000000000',
      userOp.callGasLimit,
      userOp.verificationGasLimit,
      userOp.preVerificationGas,
      userOp.maxFeePerGas,
      userOp.maxPriorityFeePerGas,
      userOp.paymasterAndData ? keccak256(userOp.paymasterAndData) : '0x0000000000000000000000000000000000000000000000000000000000000000'
    ]
  ) as Hex
}
