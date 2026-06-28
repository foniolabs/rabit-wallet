/**
 * Thin repository layer wrapping Prisma queries.
 * Routes talk to repositories instead of Prisma directly so we can swap
 * persistence later without churning route code.
 */

import { prisma } from './prisma.js';

// ---------- Users ----------

export const userRepo = {
  async findByEmail(projectId: string, email: string) {
    return prisma.user.findUnique({
      where: { projectId_email: { projectId, email: email.toLowerCase() } },
    });
  },

  async findByGoogleId(googleId: string) {
    return prisma.user.findUnique({ where: { googleId } });
  },

  async findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },

  async create(data: {
    projectId: string;
    email: string;
    authMethod: string;
    displayName?: string;
    profileImage?: string;
    googleId?: string;
  }) {
    return prisma.user.create({
      data: {
        projectId: data.projectId,
        email: data.email.toLowerCase(),
        authMethod: data.authMethod,
        displayName: data.displayName,
        profileImage: data.profileImage,
        googleId: data.googleId,
      },
    });
  },

  async touchLastLogin(id: string) {
    return prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  },

  async updateProfile(
    id: string,
    patch: { displayName?: string; profileImage?: string }
  ) {
    const data: Record<string, string> = {};
    if (patch.displayName !== undefined) data.displayName = patch.displayName;
    if (patch.profileImage !== undefined) data.profileImage = patch.profileImage;
    return prisma.user.update({ where: { id }, data });
  },
};

// ---------- OTP Codes ----------

export const otpRepo = {
  async create(email: string, code: string, expiresAt: Date) {
    return prisma.otpCode.create({
      data: { email: email.toLowerCase(), code, expiresAt },
    });
  },

  async findLatestValid(email: string) {
    return prisma.otpCode.findFirst({
      where: {
        email: email.toLowerCase(),
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  async markUsed(id: string) {
    return prisma.otpCode.update({
      where: { id },
      data: { usedAt: new Date() },
    });
  },

  async incrementAttempts(id: string) {
    return prisma.otpCode.update({
      where: { id },
      data: { attempts: { increment: 1 } },
    });
  },

  async deleteExpired() {
    return prisma.otpCode.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  },
};

// ---------- Key Shares ----------

export const keyShareRepo = {
  async upsert(userId: string, shareData: string, shareIndex: number) {
    return prisma.keyShare.upsert({
      where: { userId },
      create: { userId, shareData, shareIndex },
      update: { shareData, shareIndex },
    });
  },

  async get(userId: string) {
    return prisma.keyShare.findUnique({ where: { userId } });
  },

  async delete(userId: string) {
    return prisma.keyShare.delete({ where: { userId } }).catch(() => null);
  },
};

// ---------- Sessions ----------

export const sessionRepo = {
  async create(data: {
    userId: string;
    refreshToken: string;
    expiresAt: Date;
    userAgent?: string;
    ipAddress?: string;
  }) {
    return prisma.session.create({ data });
  },

  async findByRefreshToken(refreshToken: string) {
    return prisma.session.findUnique({ where: { refreshToken } });
  },

  async revoke(refreshToken: string) {
    return prisma.session
      .update({
        where: { refreshToken },
        data: { revokedAt: new Date() },
      })
      .catch(() => null);
  },
};

// ---------- On-ramp Orders ----------

export const onRampOrderRepo = {
  async create(data: any) {
    return prisma.onRampOrder.create({ data });
  },

  async findById(id: string) {
    return prisma.onRampOrder.findUnique({ where: { id } });
  },

  async listForUser(userId: string, limit = 50) {
    return prisma.onRampOrder.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },

  async updateStatus(id: string, status: string, patch: Record<string, unknown> = {}) {
    return prisma.onRampOrder.update({
      where: { id },
      data: {
        status,
        ...patch,
        completedAt:
          status === 'completed' || status === 'failed' || status === 'cancelled'
            ? new Date()
            : undefined,
      },
    });
  },
};

// ---------- Off-ramp Orders ----------

export const offRampOrderRepo = {
  async create(data: any) {
    return prisma.offRampOrder.create({ data });
  },

  async findById(id: string) {
    return prisma.offRampOrder.findUnique({ where: { id } });
  },

  async listForUser(userId: string, limit = 50) {
    return prisma.offRampOrder.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },

  async updateStatus(id: string, status: string, patch: Record<string, unknown> = {}) {
    return prisma.offRampOrder.update({
      where: { id },
      data: {
        status,
        ...patch,
        completedAt:
          status === 'completed' || status === 'failed' || status === 'cancelled'
            ? new Date()
            : undefined,
      },
    });
  },
};

// ---------- Projects ----------

export const projectRepo = {
  async findByApiKey(apiKey: string) {
    return prisma.project.findUnique({ where: { apiKey } });
  },

  async findById(id: string) {
    return prisma.project.findUnique({ where: { id } });
  },

  async listForOwner(ownerId: string) {
    return prisma.project.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { users: true, apiKeys: { where: { revokedAt: null } } } },
      },
    });
  },

  async createForOwner(data: {
    ownerId: string;
    name: string;
    apiKey: string;
    apiKeyHash: string;
  }) {
    return prisma.project.create({
      data: {
        ownerId: data.ownerId,
        name: data.name,
        apiKey: data.apiKey,
        apiKeyHash: data.apiKeyHash,
      },
    });
  },

  async findByIdForOwner(id: string, ownerId: string) {
    return prisma.project.findFirst({ where: { id, ownerId } });
  },

  async deleteForOwner(id: string, ownerId: string) {
    return prisma.project
      .delete({ where: { id, ownerId } })
      .catch(() => null);
  },

  async countForOwner(ownerId: string) {
    return prisma.project.count({ where: { ownerId } });
  },
};

// ---------- API Keys ----------

export const apiKeyRepo = {
  async listForProject(projectId: string) {
    return prisma.apiKey.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' },
    });
  },

  async create(data: {
    projectId: string;
    name: string;
    prefix: string;
    hash: string;
    environment?: string;
  }) {
    return prisma.apiKey.create({
      data: {
        projectId: data.projectId,
        name: data.name,
        prefix: data.prefix,
        hash: data.hash,
        environment: data.environment ?? 'production',
      },
    });
  },

  async findActiveByPrefix(prefix: string) {
    return prisma.apiKey.findFirst({
      where: { prefix, revokedAt: null },
      include: { project: true },
    });
  },

  async revoke(id: string, projectId: string) {
    return prisma.apiKey
      .update({
        where: { id, projectId },
        data: { revokedAt: new Date() },
      })
      .catch(() => null);
  },

  async touchLastUsed(id: string) {
    return prisma.apiKey
      .update({ where: { id }, data: { lastUsedAt: new Date() } })
      .catch(() => null);
  },

  async countActiveForOwner(ownerId: string) {
    return prisma.apiKey.count({
      where: { revokedAt: null, project: { ownerId } },
    });
  },
};

// ---------- Usage Events ----------

export const usageRepo = {
  async record(data: {
    projectId: string;
    apiKeyId?: string | null;
    method: string;
    route: string;
    status: number;
    durationMs: number;
  }) {
    return prisma.usageEvent.create({
      data: {
        projectId: data.projectId,
        apiKeyId: data.apiKeyId ?? null,
        method: data.method.slice(0, 8),
        route: data.route.slice(0, 120),
        status: data.status,
        durationMs: data.durationMs,
      },
    });
  },

  /**
   * Time-series rollup grouped by hour/day. Returns one row per bucket
   * with total requests + error rate + p50/p95 duration.
   */
  async timeSeriesForOwner(
    ownerId: string,
    opts: { since: Date; bucket: 'hour' | 'day' }
  ) {
    const trunc = opts.bucket === 'hour' ? 'hour' : 'day';
    // Raw SQL — Prisma's `groupBy` doesn't support date_trunc.
    const rows = await prisma.$queryRawUnsafe<
      Array<{ bucket: Date; requests: bigint; errors: bigint; avg_ms: number }>
    >(
      `SELECT
         date_trunc('${trunc}', e."createdAt") AS bucket,
         COUNT(*)::bigint AS requests,
         COUNT(*) FILTER (WHERE e.status >= 400)::bigint AS errors,
         AVG(e."durationMs")::float AS avg_ms
       FROM "UsageEvent" e
       JOIN "Project" p ON p.id = e."projectId"
       WHERE p."ownerId" = $1 AND e."createdAt" >= $2
       GROUP BY bucket
       ORDER BY bucket ASC`,
      ownerId,
      opts.since
    );
    return rows.map((r) => ({
      bucket: r.bucket.getTime(),
      requests: Number(r.requests),
      errors: Number(r.errors),
      avgMs: Math.round(r.avg_ms ?? 0),
    }));
  },

  /** Rollup totals for the window. */
  async totalsForOwner(ownerId: string, since: Date) {
    const rows = await prisma.$queryRawUnsafe<
      Array<{ requests: bigint; errors: bigint; avg_ms: number }>
    >(
      `SELECT
         COUNT(*)::bigint AS requests,
         COUNT(*) FILTER (WHERE e.status >= 400)::bigint AS errors,
         AVG(e."durationMs")::float AS avg_ms
       FROM "UsageEvent" e
       JOIN "Project" p ON p.id = e."projectId"
       WHERE p."ownerId" = $1 AND e."createdAt" >= $2`,
      ownerId,
      since
    );
    const r = rows[0];
    return {
      requests: r ? Number(r.requests) : 0,
      errors: r ? Number(r.errors) : 0,
      avgMs: r ? Math.round(r.avg_ms ?? 0) : 0,
    };
  },

  /** Top-N routes by request count for the window. */
  async topRoutesForOwner(
    ownerId: string,
    since: Date,
    limit = 6
  ): Promise<Array<{ route: string; method: string; requests: number }>> {
    const rows = await prisma.$queryRawUnsafe<
      Array<{ route: string; method: string; requests: bigint }>
    >(
      `SELECT e.route, e.method, COUNT(*)::bigint AS requests
       FROM "UsageEvent" e
       JOIN "Project" p ON p.id = e."projectId"
       WHERE p."ownerId" = $1 AND e."createdAt" >= $2
       GROUP BY e.route, e.method
       ORDER BY requests DESC
       LIMIT $3`,
      ownerId,
      since,
      limit
    );
    return rows.map((r) => ({
      route: r.route,
      method: r.method,
      requests: Number(r.requests),
    }));
  },
};
