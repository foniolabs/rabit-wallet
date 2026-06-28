/**
 * Off-ramp routes — crypto to fiat (Prisma-backed orders).
 * Rates fetched live from CoinGecko.
 */

import { Router, type Router as ExpressRouter } from 'express';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';
import type { ProjectRequest } from '../middleware/api-key.js';
import { getRate } from '../services/price-feed.js';
import { offRampOrderRepo } from '../db/repositories.js';
import { asyncHandler } from '../utils/async-handler.js';
import { logger } from '../utils/logger.js';

export const offrampRouter: ExpressRouter = Router();

interface CachedOffRampQuote {
  id: string;
  projectId: string;
  cryptoAmount: number;
  cryptoAsset: string;
  chain: string;
  fiatAmount: number;
  fiatCurrency: string;
  rate: number;
  serviceFee: number;
  networkFee: number;
  payoutMethod: string;
  expiresAt: number;
}
const quoteCache = new Map<string, CachedOffRampQuote>();

const offRampCleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [id, q] of quoteCache.entries()) {
    if (q.expiresAt < now) quoteCache.delete(id);
  }
}, 5 * 60 * 1000);
if (typeof (offRampCleanupTimer as any).unref === 'function') {
  (offRampCleanupTimer as any).unref();
}

const quoteSchema = z.object({
  cryptoAmount: z.string(),
  cryptoAsset: z.enum(['ETH', 'BTC', 'SOL', 'USDC', 'USDT']),
  chain: z.enum(['evm', 'solana']),
  fiatCurrency: z.string(),
  payoutMethod: z.enum(['bank_transfer', 'mobile_money']),
});

const orderSchema = z.object({
  quoteId: z.string(),
  sourceAddress: z.string(),
  sourceChain: z.enum(['evm', 'solana']),
  payoutDetails: z.any(),
});

/**
 * POST /offramp/quote
 */
offrampRouter.post('/quote', asyncHandler(async (req: ProjectRequest, res) => {
  try {
    const params = quoteSchema.parse(req.body);
    const rate = await getRate(params.cryptoAsset, params.fiatCurrency);

    if (!rate) {
      res.status(400).json({
        message: `Unsupported pair: ${params.cryptoAsset}/${params.fiatCurrency}`,
      });
      return;
    }

    const cryptoAmount = parseFloat(params.cryptoAmount);
    const grossFiat = cryptoAmount * rate;
    const serviceFee = grossFiat * 0.015;
    const networkFee = grossFiat * 0.005;
    const netFiat = grossFiat - serviceFee - networkFee;

    const quoteId = `oqt_${nanoid(16)}`;
    const expiresAt = Date.now() + 5 * 60 * 1000;

    quoteCache.set(quoteId, {
      id: quoteId,
      projectId: req.projectId!,
      cryptoAmount,
      cryptoAsset: params.cryptoAsset,
      chain: params.chain,
      fiatAmount: netFiat,
      fiatCurrency: params.fiatCurrency,
      rate,
      serviceFee,
      networkFee,
      payoutMethod: params.payoutMethod,
      expiresAt,
    });

    res.json({
      id: quoteId,
      cryptoAmount: params.cryptoAmount,
      cryptoAsset: {
        symbol: params.cryptoAsset,
        name: params.cryptoAsset,
        chain: params.chain,
        contractAddress: null,
        decimals: 18,
      },
      fiatAmount: netFiat.toFixed(2),
      fiatCurrency: params.fiatCurrency,
      exchangeRate: rate.toString(),
      fees: {
        networkFee: networkFee.toFixed(2),
        serviceFee: serviceFee.toFixed(2),
        totalFee: (serviceFee + networkFee).toFixed(2),
        feeCurrency: params.fiatCurrency,
      },
      payoutMethod: params.payoutMethod,
      expiresAt,
      estimatedTime: 1800,
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
 * POST /offramp/orders
 */
offrampRouter.post('/orders', requireAuth, asyncHandler(async (req: AuthRequest & ProjectRequest, res) => {
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

    const order = await offRampOrderRepo.create({
      projectId: req.projectId!,
      userId: req.userId!,
      status: 'pending',
      cryptoAmount: quote.cryptoAmount,
      cryptoAsset: quote.cryptoAsset,
      chain: quote.chain,
      fiatAmount: quote.fiatAmount,
      fiatCurrency: quote.fiatCurrency,
      payoutMethod: quote.payoutMethod,
      payoutDetails: params.payoutDetails,
      rate: quote.rate,
      serviceFee: quote.serviceFee,
      networkFee: quote.networkFee,
    });

    quoteCache.delete(params.quoteId);
    logger.info(`Off-ramp order created: ${order.id}`);
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
 * GET /offramp/orders/:id
 */
offrampRouter.get('/orders/:id', requireAuth, asyncHandler(async (req: AuthRequest, res) => {
  const order = await offRampOrderRepo.findById(req.params.id);
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
 * GET /offramp/orders
 */
offrampRouter.get('/orders', requireAuth, asyncHandler(async (req: AuthRequest, res) => {
  const userOrders = await offRampOrderRepo.listForUser(req.userId!);
  res.json(userOrders);
}));
