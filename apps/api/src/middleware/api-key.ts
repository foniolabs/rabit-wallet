/**
 * API key authentication middleware
 * Validates X-API-Key header against either:
 *   - the legacy Project.apiKey column (back-compat / dev bypass), or
 *   - the new ApiKey table (multi-key per project, with revocation).
 */

import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/prisma.js';
import { apiKeyRepo, projectRepo } from '../db/repositories.js';
import { prefixOf, verifyApiKey } from '../utils/api-keys.js';
import { logger } from '../utils/logger.js';

export interface ProjectRequest extends Request {
  projectId?: string;
  projectTier?: string;
}

const DEV_PROJECT_ID = 'dev-project';
let devProjectEnsured = false;

async function ensureDevProject(): Promise<void> {
  if (devProjectEnsured) return;
  await prisma.project.upsert({
    where: { id: DEV_PROJECT_ID },
    update: {},
    create: {
      id: DEV_PROJECT_ID,
      name: 'Local Dev',
      apiKey: process.env.DEV_API_KEY || 'dev-api-key',
      apiKeyHash: 'dev',
      tier: 'free',
    },
  });
  devProjectEnsured = true;
}

export async function apiKeyAuth(
  req: ProjectRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const apiKey = req.headers['x-api-key'] as string | undefined;

  if (!apiKey) {
    res.status(401).json({ message: 'Missing API key' });
    return;
  }

  // Dev bypass — auto-creates the project row on first call so user FKs resolve.
  if (apiKey === (process.env.DEV_API_KEY || 'dev-api-key')) {
    try {
      await ensureDevProject();
    } catch (err) {
      logger.error('Failed to seed dev project', { err });
      res.status(500).json({ message: 'Failed to initialise dev project' });
      return;
    }
    req.projectId = DEV_PROJECT_ID;
    req.projectTier = 'free';
    next();
    return;
  }

  try {
    // 1. Legacy: exact-match against Project.apiKey (cleartext, indexed).
    const legacyProject = await projectRepo.findByApiKey(apiKey);
    if (legacyProject) {
      req.projectId = legacyProject.id;
      req.projectTier = legacyProject.tier;
      next();
      return;
    }

    // 2. New: prefix lookup in ApiKey, then bcrypt-compare the full key.
    if (apiKey.startsWith('pk_')) {
      const prefix = prefixOf(apiKey);
      const candidate = await apiKeyRepo.findActiveByPrefix(prefix);
      if (candidate && (await verifyApiKey(apiKey, candidate.hash))) {
        // Fire-and-forget — we don't want lastUsed updates to slow the request.
        void apiKeyRepo.touchLastUsed(candidate.id);
        req.projectId = candidate.projectId;
        req.projectTier = candidate.project.tier;
        next();
        return;
      }
    }

    logger.warn(`Invalid API key attempt: ${apiKey.slice(0, 12)}...`);
    res.status(401).json({ message: 'Invalid API key' });
  } catch (err) {
    logger.error('API key lookup failed', { err });
    res.status(500).json({ message: 'Internal error' });
  }
}
