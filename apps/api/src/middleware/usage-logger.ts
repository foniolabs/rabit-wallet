/**
 * Usage logger middleware
 *
 * Records one UsageEvent per inbound API call (after apiKeyAuth has set
 * req.projectId). Fire-and-forget — never blocks the response.
 *
 * To keep the log compact:
 *   - Skip the dev project (its rows would dominate dev DBs).
 *   - Skip /health and /admin/* (health checks + dashboard self-traffic).
 *   - Normalise routes: replace cuid-shaped path params with `:id`.
 */

import type { Response, NextFunction } from 'express';
import type { ProjectRequest } from './api-key.js';
import { usageRepo } from '../db/repositories.js';
import { logger } from '../utils/logger.js';

const DEV_PROJECT_ID = 'dev-project';
const SKIP_PREFIX = ['/health', '/admin'];
const CUID_LIKE = /^c[a-z0-9]{20,}$/i;

function normaliseRoute(originalUrl: string): string {
  // Drop query string + collapse cuid-like ids to ":id".
  const path = originalUrl.split('?')[0] ?? '/';
  return path
    .split('/')
    .map((seg) => (CUID_LIKE.test(seg) ? ':id' : seg))
    .join('/');
}

export function usageLogger(
  req: ProjectRequest,
  res: Response,
  next: NextFunction
): void {
  // Skip until we know the project (apiKeyAuth runs first).
  if (!req.projectId || req.projectId === DEV_PROJECT_ID) {
    next();
    return;
  }
  if (SKIP_PREFIX.some((p) => req.path.startsWith(p))) {
    next();
    return;
  }

  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    void usageRepo
      .record({
        projectId: req.projectId!,
        method: req.method,
        route: normaliseRoute(req.originalUrl),
        status: res.statusCode,
        durationMs: duration,
      })
      .catch((err) => {
        // Never crash a request on logging failure; emit one warn line.
        logger.warn('Failed to record usage event', {
          err: err instanceof Error ? err.message : err,
        });
      });
  });

  next();
}
