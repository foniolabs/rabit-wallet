/**
 * @rabit/solana — Solana wallet operations for Rabit embedded wallet
 */

export { SolanaWallet } from './solana-wallet.js';
export type { SolanaWalletConfig } from './solana-wallet.js';

export {
  SOLANA_MAINNET,
  SOLANA_DEVNET,
  SOLANA_TESTNET,
  PRESET_SOLANA_MAINNETS,
  PRESET_SOLANA_TESTNETS,
  PRESET_SOLANA_CHAINS,
  findPresetSolanaChain,
  defineSolanaChain,
} from './preset-solana-chains.js';

export {
  SOLANA_TOKEN_LIST,
  getSolanaTokens,
  fetchSolanaBalances,
  fetchSolanaSlot,
  fetchSplMintDecimals,
  sendSolanaNative,
  sendSolanaSplToken,
} from './tokens.js';
export type { SolanaTokenDef, SolanaBalance } from './tokens.js';

export {
  MEMO_PROGRAM_ID,
  sendSolanaMemo,
  getRecentSolanaMemos,
  sendSolanaInstructions,
} from './memo.js';
export type { MemoEntry } from './memo.js';

export { signSolanaMessage } from './sign.js';
export type { SignMessageResult } from './sign.js';

export {
  getJupiterQuote,
  executeJupiterSwap,
  SOL_MINT,
} from './swap.js';
export type { JupiterQuote, JupiterQuoteRequest } from './swap.js';
