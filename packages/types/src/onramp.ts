/**
 * On-ramp and off-ramp types for Rabit
 */

/**
 * Supported fiat currencies
 */
export type FiatCurrency =
  | 'NGN' | 'USD' | 'EUR' | 'GBP' | 'GHS' | 'KES'
  | 'ZAR' | 'EGP' | 'MAD' | 'TZS' | 'UGX' | 'XOF'
  | 'XAF' | 'INR' | 'BRL' | 'ARS' | 'COP' | 'MXN';

/**
 * Supported crypto assets for on/off ramp
 */
export interface CryptoAsset {
  /** Token symbol (e.g., ETH, USDC, SOL) */
  symbol: string;
  /** Token name */
  name: string;
  /** Chain ecosystem */
  chain: 'evm' | 'solana';
  /** Chain ID (for EVM) or network */
  chainId?: number;
  /** Contract address (null for native tokens) */
  contractAddress: string | null;
  /** Token decimals */
  decimals: number;
}

/**
 * Payment methods for on-ramp
 */
export type PaymentMethod =
  | 'bank_transfer'
  | 'card'
  | 'mobile_money'
  | 'p2p';

/**
 * Off-ramp payout methods
 */
export type PayoutMethod =
  | 'bank_transfer'
  | 'mobile_money';

/**
 * On-ramp quote
 */
export interface OnRampQuote {
  /** Quote ID */
  id: string;
  /** Fiat amount to pay */
  fiatAmount: string;
  /** Fiat currency */
  fiatCurrency: FiatCurrency;
  /** Crypto amount to receive */
  cryptoAmount: string;
  /** Crypto asset */
  cryptoAsset: CryptoAsset;
  /** Exchange rate (1 crypto = X fiat) */
  exchangeRate: string;
  /** Fee breakdown */
  fees: {
    networkFee: string;
    serviceFee: string;
    totalFee: string;
    feeCurrency: FiatCurrency;
  };
  /** Payment method */
  paymentMethod: PaymentMethod;
  /** Quote expiry timestamp */
  expiresAt: number;
  /** Estimated completion time (seconds) */
  estimatedTime: number;
}

/**
 * Off-ramp quote
 */
export interface OffRampQuote {
  /** Quote ID */
  id: string;
  /** Crypto amount to sell */
  cryptoAmount: string;
  /** Crypto asset */
  cryptoAsset: CryptoAsset;
  /** Fiat amount to receive */
  fiatAmount: string;
  /** Fiat currency */
  fiatCurrency: FiatCurrency;
  /** Exchange rate */
  exchangeRate: string;
  /** Fee breakdown */
  fees: {
    networkFee: string;
    serviceFee: string;
    totalFee: string;
    feeCurrency: FiatCurrency;
  };
  /** Payout method */
  payoutMethod: PayoutMethod;
  /** Quote expiry */
  expiresAt: number;
  /** Estimated time */
  estimatedTime: number;
}

/**
 * On-ramp order status
 */
export type OrderStatus =
  | 'pending'
  | 'awaiting_payment'
  | 'payment_received'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'expired'
  | 'refunded';

/**
 * Bank account details for on-ramp payment / off-ramp payout
 */
export interface BankAccount {
  /** Bank name */
  bankName: string;
  /** Bank code / routing number */
  bankCode: string;
  /** Account number */
  accountNumber: string;
  /** Account holder name */
  accountName: string;
  /** Country code (ISO 3166-1 alpha-2) */
  country: string;
  /** Currency */
  currency: FiatCurrency;
}

/**
 * Mobile money details
 */
export interface MobileMoneyAccount {
  /** Provider (e.g., M-Pesa, MTN MoMo) */
  provider: string;
  /** Phone number */
  phoneNumber: string;
  /** Account holder name */
  accountName: string;
  /** Country code */
  country: string;
}

/**
 * On-ramp order
 */
export interface OnRampOrder {
  /** Order ID */
  id: string;
  /** User ID */
  userId: string;
  /** Quote snapshot */
  quote: OnRampQuote;
  /** Order status */
  status: OrderStatus;
  /** Destination wallet address */
  destinationAddress: string;
  /** Destination chain */
  destinationChain: 'evm' | 'solana';
  /** Payment details (bank account used) */
  paymentDetails?: BankAccount | MobileMoneyAccount;
  /** Transaction hash (when crypto is sent) */
  txHash?: string;
  /** Created timestamp */
  createdAt: number;
  /** Last updated timestamp */
  updatedAt: number;
  /** Failure reason if failed */
  failureReason?: string;
}

/**
 * Off-ramp order
 */
export interface OffRampOrder {
  /** Order ID */
  id: string;
  /** User ID */
  userId: string;
  /** Quote snapshot */
  quote: OffRampQuote;
  /** Order status */
  status: OrderStatus;
  /** Source wallet address */
  sourceAddress: string;
  /** Source chain */
  sourceChain: 'evm' | 'solana';
  /** Payout details */
  payoutDetails: BankAccount | MobileMoneyAccount;
  /** Crypto deposit tx hash */
  depositTxHash?: string;
  /** Fiat payout reference */
  payoutReference?: string;
  /** Created timestamp */
  createdAt: number;
  /** Updated timestamp */
  updatedAt: number;
  /** Failure reason */
  failureReason?: string;
}

/**
 * Supported payment methods per country/currency
 */
export interface PaymentMethodConfig {
  currency: FiatCurrency;
  country: string;
  methods: PaymentMethod[];
  payoutMethods: PayoutMethod[];
  limits: {
    minFiat: string;
    maxFiat: string;
    dailyLimit: string;
  };
}
