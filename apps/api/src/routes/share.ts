/**
 * Key share routes — store and retrieve auth shares (Prisma-backed).
 * The server never has access to the full key (2-of-3 Shamir).
 */

import { Router, type Router as ExpressRouter } from 'express';
import { z } from 'zod';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';
import { keyShareRepo } from '../db/repositories.js';
import { asyncHandler } from '../utils/async-handler.js';

export const shareRouter: ExpressRouter = Router();

shareRouter.use(requireAuth);

const shareSchema = z.object({
  share: z.object({
    index: z.number(),
    type: z.string(),
    data: z.string(),
    createdAt: z.number(),
  }),
});

/**
 * POST /auth/share
 */
shareRouter.post('/', asyncHandler(async (req: AuthRequest, res) => {
  try {
    const { share } = shareSchema.parse(req.body);
    if (!req.userId) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    await keyShareRepo.upsert(req.userId, share.data, share.index);
    res.json({ message: 'Share stored successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Invalid share data', errors: error.errors });
      return;
    }
    throw error;
  }
}));

/**
 * GET /auth/share
 */
shareRouter.get('/', asyncHandler(async (req: AuthRequest, res) => {
  if (!req.userId) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }

  const record = await keyShareRepo.get(req.userId);
  if (!record) {
    res.status(404).json({ message: 'No share found for this user' });
    return;
  }

  res.json({
    share: {
      index: record.shareIndex,
      type: 'auth',
      data: record.shareData,
      createdAt: record.createdAt.getTime(),
    },
  });
}));

/**
 * DELETE /auth/share
 */
shareRouter.delete('/', asyncHandler(async (req: AuthRequest, res) => {
  if (!req.userId) {
    res.status(401).json({ message: 'Not authenticated' });
    return;
  }
  await keyShareRepo.delete(req.userId);
  res.json({ message: 'Share deleted' });
}));
