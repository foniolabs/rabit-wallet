/**
 * On-ramp routes — fiat to crypto (Prisma-backed orders).
 *
 * Supported assets: ETH, BTC, SOL, USDC, USDT
 * Rates fetched live from CoinGecko
 */

import { Router, type Router as ExpressRouter } from 'express';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';
import type { ProjectRequest } from '../middleware/api-key.js';
import { getRate } from '../services/price-feed.js';
import { onRampOrderRepo } from '../db/repositories.js';
import { asyncHandler } from '../utils/async-handler.js';
import { logger } from '../utils/logger.js';

export const onrampRouter: ExpressRouter = Router();

const SUPPORTED_ASSETS = [
  { symbol: 'ETH', name: 'Ethereum', chain: 'evm', chainId: 1, contractAddress: null, decimals: 18 },
  { symbol: 'BTC', name: 'Bitcoin', chain: 'evm', chainId: 1, contractAddress: null, decimals: 8, note: 'Wrapped BTC on EVM' },
  { symbol: 'SOL', name: 'Solana', chain: 'solana', contractAddress: null, decimals: 9 },
  { symbol: 'USDC', name: 'USD Coin', chain: 'evm', chainId: 1, contractAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', decimals: 6 },
  { symbol: 'USDT', name: 'Tether', chain: 'evm', chainId: 1, contractAddress: '0xdac17f958d2ee523a2206206994597c13d831ec7', decimals: 6 },
  { symbol: 'USDC', name: 'USD Coin (Solana)', chain: 'solana', contractAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', decimals: 6 },
];

// Quote cache — quotes are short-lived (5 min), in-memory is fine.
interface CachedQuote {
  id: string;
  projectId: string;
  fiatAmount: number;
  fiatCurrency: string;
  cryptoAsset: string;
  chain: string;
  cryptoAmount: string;
  rate: number;
  serviceFee: number;
  networkFee: number;
  paymentMethod: string;
  expiresAt: number;
}
const quoteCache = new Map<string, CachedQuote>();

// Housekeeping — purge expired quotes every 5 min
const onRampCleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [id, q] of quoteCache.entries()) {
    if (q.expiresAt < now) quoteCache.delete(id);
  }
}, 5 * 60 * 1000);
if (typeof (onRampCleanupTimer as any).unref === 'function') {
  (onRampCleanupTimer as any).unref();
}

const quoteSchema = z.object({
  fiatAmount: z.string(),
  fiatCurrency: z.string(),
  cryptoAsset: z.enum(['ETH', 'BTC', 'SOL', 'USDC', 'USDT']),
  chain: z.enum(['evm', 'solana']),
  paymentMethod: z.enum(['bank_transfer', 'card', 'mobile_money', 'p2p']),
});

const orderSchema = z.object({
  quoteId: z.string(),
  destinationAddress: z.string(),
  destinationChain: z.enum(['evm', 'solana']),
  paymentDetails: z.any().optional(),
});

onrampRouter.get('/assets', async (_req, res) => {
  res.json(SUPPORTED_ASSETS);
});

onrampRouter.get('/payment-methods', async (req, res) => {
  const currency = (req.query.currency as string || '').toUpperCase();

  const config: Record<string, any> = {
    NGN: {
      currency: 'NGN', country: 'NG',
      methods: ['bank_transfer', 'card'],
      payoutMethods: ['bank_transfer'],
      limits: { minFiat: '5000', maxFiat: '5000000', dailyLimit: '10000000' },
    },
    USD: {
      currency: 'USD', country: 'US',
      methods: ['bank_transfer', 'card'],
      payoutMethods: ['bank_transfer'],
      limits: { minFiat: '10', maxFiat: '10000', dailyLimit: '50000' },
    },
    GHS: {
      currency: 'GHS', country: 'GH',
      methods: ['bank_transfer', 'mobile_money'],
      payoutMethods: ['bank_transfer', 'mobile_money'],
      limits: { minFiat: '50', maxFiat: '50000', dailyLimit: '100000' },
    },
    KES: {
      currency: 'KES', country: 'KE',
      methods: ['mobile_money', 'bank_transfer'],
      payoutMethods: ['mobile_money', 'bank_transfer'],
      limits: { minFiat: '500', maxFiat: '500000', dailyLimit: '1000000' },
    },
    EUR: {
      currency: 'EUR', country: 'EU',
      methods: ['bank_transfer', 'card'],
      payoutMethods: ['bank_transfer'],
      limits: { minFiat: '10', maxFiat: '10000', dailyLimit: '50000' },
    },
    GBP: {
      currency: 'GBP', country: 'GB',
      methods: ['bank_transfer', 'card'],
      payoutMethods: ['bank_transfer'],
      limits: { minFiat: '10', maxFiat: '10000', dailyLimit: '50000' },
    },
  };

  res.json(config[currency] || config['USD']);
});

/**
 * POST /onramp/quote
 */
onrampRouter.post('/quote', asyncHandler(async (req: ProjectRequest, res) => {
  try {
    const params = quoteSchema.parse(req.body);
    const rate = await getRate(params.cryptoAsset, params.fiatCurrency);

    if (!rate) {
      res.status(400).json({
        message: `Unsupported pair: ${params.cryptoAsset}/${params.fiatCurrency}`,
      });
      return;
    }

    const fiatAmount = parseFloat(params.fiatAmount);
    const serviceFee = fiatAmount * 0.015;
    const networkFee = fiatAmount * 0.005;
    const netFiat = fiatAmount - serviceFee - networkFee;
    const cryptoAmount = (netFiat / rate).toFixed(8);

    const quoteId = `qt_${nanoid(16)}`;
    const expiresAt = Date.now() + 5 * 60 * 1000;

    quoteCache.set(quoteId, {
      id: quoteId,
      projectId: req.projectId!,
      fiatAmount,
      fiatCurrency: params.fiatCurrency,
      cryptoAsset: params.cryptoAsset,
      chain: params.chain,
      cryptoAmount,
      rate,
      serviceFee,
      networkFee,
      paymentMethod: params.paymentMethod,
      expiresAt,
    });

    const asset = SUPPORTED_ASSETS.find(
      a => a.symbol === params.cryptoAsset && a.chain === params.chain
    ) || SUPPORTED_ASSETS.find(a => a.symbol === params.cryptoAsset);

    res.json({
      id: quoteId,
      fiatAmount: params.fiatAmount,
      fiatCurrency: params.fiatCurrency,
      cryptoAmount,
      cryptoAsset: asset || {
        symbol: params.cryptoAsset,
        name: params.cryptoAsset,
        chain: params.chain,
        contractAddress: null,
        decimals: 18,
      },
      exchangeRate: rate.toString(),
      fees: {
        networkFee: networkFee.toFixed(2),
        serviceFee: serviceFee.toFixed(2),
        totalFee: (serviceFee + networkFee).toFixed(2),
        feeCurrency: params.fiatCurrency,
      },
      paymentMethod: params.paymentMethod,
      expiresAt,
      estimatedTime: params.paymentMethod === 'card' ? 60 : 900,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Invalid request', errors: error.errors });
      return;
    }
    throw error;
  }
}));

/**
 * POST /onramp/orders
 */
onrampRouter.post('/orders', requireAuth, asyncHandler(async (req: AuthRequest & ProjectRequest, res) => {
  try {
    const params = orderSchema.parse(req.body);
    const quote = quoteCache.get(params.quoteId);

    if (!quote || quote.expiresAt < Date.now()) {
      res.status(400).json({ message: 'Quote expired or invalid' });
      return;
    }
    if (quote.projectId !== req.projectId) {
      res.status(403).json({ message: 'Forbidden' });
      return;
    }

    const order = await onRampOrderRepo.create({
      projectId: req.projectId!,
      userId: req.userId!,
      status: 'awaiting_payment',
      fiatAmount: quote.fiatAmount,
      fiatCurrency: quote.fiatCurrency,
      cryptoAmount: quote.cryptoAmount,
      cryptoAsset: quote.cryptoAsset,
      chain: quote.chain,
      destinationAddress: params.destinationAddress,
      paymentMethod: quote.paymentMethod,
      rate: quote.rate,
      serviceFee: quote.serviceFee,
      networkFee: quote.networkFee,
      paymentReference: `pay_${nanoid(16)}`,
      metadata: params.paymentDetails ?? undefined,
    });

    quoteCache.delete(params.quoteId);
    logger.info(`On-ramp order created: ${order.id}`);
    res.json(order);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Invalid request', errors: error.errors });
      return;
    }
    throw error;
  }
}));

/**
 * GET /onramp/orders/:id
 */
onrampRouter.get('/orders/:id', requireAuth, asyncHandler(async (req: AuthRequest, res) => {
  const order = await onRampOrderRepo.findById(req.params.id);
  if (!order) {
    res.status(404).json({ message: 'Order not found' });
    return;
  }
  if (order.userId !== req.userId) {
    res.status(403).json({ message: 'Forbidden' });
    return;
  }
  res.json(order);
}));

/**
 * GET /onramp/orders
 */
onrampRouter.get('/orders', requireAuth, asyncHandler(async (req: AuthRequest, res) => {
  const userOrders = await onRampOrderRepo.listForUser(req.userId!);
  res.json(userOrders);
}));
