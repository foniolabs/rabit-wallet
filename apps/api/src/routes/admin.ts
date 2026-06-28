/**
 * Admin / Dashboard routes — operate on the authenticated user's owned
 * Projects and ApiKeys. Requires a valid user JWT (NOT an X-API-Key).
 */

import { Router, type Router as ExpressRouter } from 'express';
import { z } from 'zod';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';
import { apiKeyRepo, projectRepo, usageRepo } from '../db/repositories.js';
import { generateApiKey, hashApiKey } from '../utils/api-keys.js';
import { asyncHandler } from '../utils/async-handler.js';

export const adminRouter: ExpressRouter = Router();

// All admin routes require a user JWT.
adminRouter.use(requireAuth);

// --- Schemas ---

const createProjectSchema = z.object({
  name: z.string().trim().min(1).max(80),
});

const createKeySchema = z.object({
  name: z.string().trim().min(1).max(80),
  environment: z.enum(['production', 'staging', 'development']).default('production'),
});

// --- Helpers ---

function serializeProject(p: any) {
  return {
    id: p.id,
    name: p.name,
    tier: p.tier,
    createdAt: p.createdAt.getTime(),
    updatedAt: p.updatedAt.getTime(),
    userCount: p._count?.users ?? 0,
    keyCount: p._count?.apiKeys ?? 0,
  };
}

function serializeKey(k: any, opts: { fullKey?: string } = {}) {
  return {
    id: k.id,
    name: k.name,
    prefix: k.prefix,
    environment: k.environment,
    createdAt: k.createdAt.getTime(),
    lastUsedAt: k.lastUsedAt?.getTime() ?? null,
    revokedAt: k.revokedAt?.getTime() ?? null,
    fullKey: opts.fullKey, // only present on creation response
  };
}

// --- Projects ---

/** GET /admin/projects */
adminRouter.get('/projects', asyncHandler(async (req: AuthRequest, res) => {
  const projects = await projectRepo.listForOwner(req.userId!);
  res.json({ projects: projects.map(serializeProject) });
}));

/** POST /admin/projects */
adminRouter.post('/projects', asyncHandler(async (req: AuthRequest, res) => {
  const parsed = createProjectSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid request', errors: parsed.error.errors });
    return;
  }

  // Mint a starter key alongside the project so the user can ship immediately.
  const { fullKey, prefix } = generateApiKey('production');
  const hash = await hashApiKey(fullKey);

  const project = await projectRepo.createForOwner({
    ownerId: req.userId!,
    name: parsed.data.name,
    apiKey: fullKey,
    apiKeyHash: hash,
  });

  await apiKeyRepo.create({
    projectId: project.id,
    name: 'Default key',
    prefix,
    hash,
    environment: 'production',
  });

  res.status(201).json({
    project: serializeProject({ ...project, _count: { users: 0, apiKeys: 1 } }),
    apiKey: { fullKey, prefix, environment: 'production', name: 'Default key' },
  });
}));

/** DELETE /admin/projects/:id */
adminRouter.delete('/projects/:id', asyncHandler(async (req: AuthRequest, res) => {
  const result = await projectRepo.deleteForOwner(req.params.id!, req.userId!);
  if (!result) {
    res.status(404).json({ message: 'Project not found' });
    return;
  }
  res.json({ message: 'Project deleted' });
}));

// --- API Keys ---

/** GET /admin/projects/:id/keys */
adminRouter.get('/projects/:id/keys', asyncHandler(async (req: AuthRequest, res) => {
  const project = await projectRepo.findByIdForOwner(req.params.id!, req.userId!);
  if (!project) {
    res.status(404).json({ message: 'Project not found' });
    return;
  }
  const keys = await apiKeyRepo.listForProject(project.id);
  res.json({ keys: keys.map((k) => serializeKey(k)) });
}));

/** POST /admin/projects/:id/keys — returns the full key ONCE in the response. */
adminRouter.post('/projects/:id/keys', asyncHandler(async (req: AuthRequest, res) => {
  const parsed = createKeySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ message: 'Invalid request', errors: parsed.error.errors });
    return;
  }

  const project = await projectRepo.findByIdForOwner(req.params.id!, req.userId!);
  if (!project) {
    res.status(404).json({ message: 'Project not found' });
    return;
  }

  const { fullKey, prefix } = generateApiKey(parsed.data.environment);
  const hash = await hashApiKey(fullKey);
  const created = await apiKeyRepo.create({
    projectId: project.id,
    name: parsed.data.name,
    prefix,
    hash,
    environment: parsed.data.environment,
  });

  res.status(201).json({ key: serializeKey(created, { fullKey }) });
}));

// --- Usage ---

const WINDOWS = {
  '24h': { ms: 24 * 60 * 60 * 1000, bucket: 'hour' as const },
  '7d':  { ms: 7  * 24 * 60 * 60 * 1000, bucket: 'day'  as const },
  '30d': { ms: 30 * 24 * 60 * 60 * 1000, bucket: 'day'  as const },
};

/** GET /admin/usage?window=24h|7d|30d */
adminRouter.get('/usage', asyncHandler(async (req: AuthRequest, res) => {
  const windowKey = (String(req.query.window || '7d') as keyof typeof WINDOWS);
  const win = WINDOWS[windowKey] ?? WINDOWS['7d'];
  const since = new Date(Date.now() - win.ms);

  const [series, totals, topRoutes] = await Promise.all([
    usageRepo.timeSeriesForOwner(req.userId!, { since, bucket: win.bucket }),
    usageRepo.totalsForOwner(req.userId!, since),
    usageRepo.topRoutesForOwner(req.userId!, since, 6),
  ]);

  res.json({
    window: windowKey,
    bucket: win.bucket,
    since: since.getTime(),
    totals,
    series,
    topRoutes,
  });
}));

/** DELETE /admin/projects/:id/keys/:keyId */
adminRouter.delete('/projects/:id/keys/:keyId', asyncHandler(async (req: AuthRequest, res) => {
  const project = await projectRepo.findByIdForOwner(req.params.id!, req.userId!);
  if (!project) {
    res.status(404).json({ message: 'Project not found' });
    return;
  }
  const result = await apiKeyRepo.revoke(req.params.keyId!, project.id);
  if (!result) {
    res.status(404).json({ message: 'API key not found' });
    return;
  }
  res.json({ key: serializeKey(result) });
}));
