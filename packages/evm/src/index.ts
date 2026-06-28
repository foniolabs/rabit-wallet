/**
 * @rabit/evm — EVM wallet operations for Rabit embedded wallet
 */

export { EOAWallet } from './eoa-wallet.js';
export type { EOAWalletConfig } from './eoa-wallet.js';

export {
  MAINNET_CHAINS,
  TESTNET_CHAINS,
  ALL_CHAINS,
  getChain,
} from './chains.js';

export {
  PRESET_MAINNETS,
  PRESET_TESTNETS,
  PRESET_EVM_CHAINS,
  findPresetEvmChain,
  defineEvmChain,
  ETHEREUM_MAINNET,
  ETHEREUM_SEPOLIA,
  POLYGON_MAINNET,
  POLYGON_AMOY,
  ARBITRUM_MAINNET,
  ARBITRUM_SEPOLIA,
  OPTIMISM_MAINNET,
  OPTIMISM_SEPOLIA,
  BASE_MAINNET,
  BASE_SEPOLIA,
} from './preset-evm-chains.js';

export {
  EVM_TOKEN_LIST,
  getEvmTokens,
  fetchEvmBalances,
  sendEvmNative,
  sendEvmErc20,
} from './tokens.js';
export type { EvmTokenDef, EvmBalance, SendNativeArgs, SendErc20Args } from './tokens.js';

export {
  readEvmContract,
  writeEvmContract,
  fetchEvmBlockNumber,
  estimateEvmFee,
  signEvmMessage,
  signEvmTypedData,
  ERC20_ABI,
} from './contract.js';
export type {
  ReadContractArgs,
  WriteContractArgs,
  EvmFeeEstimateArgs,
  EvmFeeEstimateResult,
} from './contract.js';
export type { Abi } from 'viem';
export {
  parseUnits,
  formatUnits,
  parseEther,
  formatEther,
  createPublicClient,
  http,
} from 'viem';

export {
  getLiFiQuote,
  executeLiFiQuote,
  formatLiFiAmount,
  LIFI_NATIVE_ADDRESS,
} from './swap.js';
export type { LiFiQuote, LiFiQuoteRequest } from './swap.js';

export {
  RabitSmartAccount,
  createSmartAccount,
  createSmartAccountResolver,
} from './smart-account/index.js';
export type {
  SmartAccount,
  SmartAccountCall,
  SmartAccountConfig,
  SmartAccountImpl,
  SmartAccountSendResult,
  SmartAccountResolverOptions,
} from './smart-account/index.js';
