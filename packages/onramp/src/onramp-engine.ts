/**
 * OnRampEngine — handles fiat-to-crypto and crypto-to-fiat operations
 *
 * Core flow (on-ramp):
 * 1. User selects fiat amount + payment method → getQuote()
 * 2. User confirms → createOrder()
 * 3. User completes payment (bank transfer / card / mobile money)
 * 4. Backend detects payment → sends crypto to user's wallet
 *
 * Off-ramp is the reverse:
 * 1. User selects crypto amount + payout method → getOffRampQuote()
 * 2. User confirms → createOffRampOrder()
 * 3. User sends crypto to escrow address
 * 4. Backend detects deposit → sends fiat to user's bank/mobile money
 */

import type {
  FiatCurrency,
  CryptoAsset,
  PaymentMethod,
  PayoutMethod,
  OnRampQuote,
  OffRampQuote,
  OnRampOrder,
  OffRampOrder,
  OrderStatus,
  BankAccount,
  MobileMoneyAccount,
  PaymentMethodConfig,
} from '@rabit/types';

export interface OnRampEngineConfig {
  apiBaseUrl: string;
  apiKey: string;
  projectId: string;
}

export type OnRampEventType =
  | 'onramp:quote_received'
  | 'onramp:order_created'
  | 'onramp:order_updated'
  | 'onramp:order_completed'
  | 'onramp:order_failed'
  | 'offramp:quote_received'
  | 'offramp:order_created'
  | 'offramp:order_updated'
  | 'offramp:order_completed'
  | 'offramp:order_failed';

export type OnRampEventListener = (data: unknown) => void;

export class OnRampEngine {
  private config: OnRampEngineConfig;
  private authToken: string | null = null;
  private listeners = new Map<OnRampEventType, Set<OnRampEventListener>>();

  constructor(config: OnRampEngineConfig) {
    this.config = config;
  }

  /** Set the auth token (called after user authenticates) */
  setAuthToken(token: string): void {
    this.authToken = token;
  }

  // === On-Ramp (Buy Crypto) ===

  /**
   * Get supported payment methods for a currency/country
   */
  async getPaymentMethods(currency: FiatCurrency, country: string): Promise<PaymentMethodConfig> {
    const response = await this.apiRequest(
      `/onramp/payment-methods?currency=${currency}&country=${country}`
    );
    return response.json();
  }

  /**
   * Get supported crypto assets for on-ramp
   */
  async getSupportedAssets(): Promise<CryptoAsset[]> {
    const response = await this.apiRequest('/onramp/assets');
    return response.json();
  }

  /**
   * Get a quote for buying crypto
   */
  async getQuote(params: {
    fiatAmount: string;
    fiatCurrency: FiatCurrency;
    cryptoAsset: string; // symbol like 'ETH', 'USDC'
    chain: 'evm' | 'solana';
    paymentMethod: PaymentMethod;
  }): Promise<OnRampQuote> {
    const response = await this.apiRequest('/onramp/quote', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    const quote = await response.json();
    this.emit('onramp:quote_received', quote);
    return quote;
  }

  /**
   * Create an on-ramp order from a quote
   */
  async createOrder(params: {
    quoteId: string;
    destinationAddress: string;
    destinationChain: 'evm' | 'solana';
    paymentDetails?: BankAccount | MobileMoneyAccount;
  }): Promise<OnRampOrder> {
    const response = await this.apiRequest('/onramp/orders', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    const order = await response.json();
    this.emit('onramp:order_created', order);
    return order;
  }

  /**
   * Get order status
   */
  async getOrderStatus(orderId: string): Promise<OnRampOrder> {
    const response = await this.apiRequest(`/onramp/orders/${orderId}`);
    return response.json();
  }

  /**
   * Get order history
   */
  async getOrderHistory(params?: {
    limit?: number;
    offset?: number;
    status?: OrderStatus;
  }): Promise<OnRampOrder[]> {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.offset) query.set('offset', params.offset.toString());
    if (params?.status) query.set('status', params.status);

    const response = await this.apiRequest(`/onramp/orders?${query}`);
    return response.json();
  }

  // === Off-Ramp (Sell Crypto) ===

  /**
   * Get a quote for selling crypto
   */
  async getOffRampQuote(params: {
    cryptoAmount: string;
    cryptoAsset: string;
    chain: 'evm' | 'solana';
    fiatCurrency: FiatCurrency;
    payoutMethod: PayoutMethod;
  }): Promise<OffRampQuote> {
    const response = await this.apiRequest('/offramp/quote', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    const quote = await response.json();
    this.emit('offramp:quote_received', quote);
    return quote;
  }

  /**
   * Create an off-ramp order
   */
  async createOffRampOrder(params: {
    quoteId: string;
    sourceAddress: string;
    sourceChain: 'evm' | 'solana';
    payoutDetails: BankAccount | MobileMoneyAccount;
  }): Promise<OffRampOrder> {
    const response = await this.apiRequest('/offramp/orders', {
      method: 'POST',
      body: JSON.stringify(params),
    });
    const order = await response.json();
    this.emit('offramp:order_created', order);
    return order;
  }

  /**
   * Get off-ramp order status
   */
  async getOffRampOrderStatus(orderId: string): Promise<OffRampOrder> {
    const response = await this.apiRequest(`/offramp/orders/${orderId}`);
    return response.json();
  }

  /**
   * Poll order status until terminal state
   */
  async waitForOrder(
    orderId: string,
    type: 'onramp' | 'offramp' = 'onramp',
    pollInterval: number = 5000
  ): Promise<OnRampOrder | OffRampOrder> {
    const terminalStatuses: OrderStatus[] = ['completed', 'failed', 'expired', 'refunded'];

    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          const order = type === 'onramp'
            ? await this.getOrderStatus(orderId)
            : await this.getOffRampOrderStatus(orderId);

          if (terminalStatuses.includes(order.status)) {
            const event = order.status === 'completed'
              ? `${type}:order_completed` as OnRampEventType
              : `${type}:order_failed` as OnRampEventType;
            this.emit(event, order);
            resolve(order);
          } else {
            this.emit(`${type}:order_updated` as OnRampEventType, order);
            setTimeout(poll, pollInterval);
          }
        } catch (error) {
          reject(error);
        }
      };

      poll();
    });
  }

  // === Events ===

  on(event: OnRampEventType, listener: OnRampEventListener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
    return () => this.off(event, listener);
  }

  off(event: OnRampEventType, listener: OnRampEventListener): void {
    this.listeners.get(event)?.delete(listener);
  }

  private emit(event: OnRampEventType, data: unknown): void {
    this.listeners.get(event)?.forEach(fn => fn(data));
  }

  // === Internal ===

  private async apiRequest(
    path: string,
    init: Omit<RequestInit, 'headers'> & { headers?: Record<string, string> } = {}
  ): Promise<Response> {
    const url = `${this.config.apiBaseUrl}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-API-Key': this.config.apiKey,
      'X-Project-ID': this.config.projectId,
      ...(init.headers ?? {}),
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    const response = await fetch(url, { ...init, headers });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response;
  }
}
