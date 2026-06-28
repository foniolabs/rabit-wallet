/**
 * Auth routes — email OTP, OAuth, session management (Prisma-backed).
 */

import { Router, type Router as ExpressRouter } from 'express';
import { z } from 'zod';
import { generateOTP, verifyOTP } from '../utils/otp.js';
import { generateTokens, verifyRefreshToken } from '../utils/jwt.js';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';
import type { ProjectRequest } from '../middleware/api-key.js';
import { sendOTPEmail } from '../services/email.js';
import { verifyOAuthToken } from '../services/oauth.js';
import { userRepo, keyShareRepo, sessionRepo, projectRepo, apiKeyRepo } from '../db/repositories.js';
import { asyncHandler } from '../utils/async-handler.js';
import { logger } from '../utils/logger.js';
import { generateApiKey, hashApiKey } from '../utils/api-keys.js';

export const authRouter: ExpressRouter = Router();

// --- Schemas ---

const sendOTPSchema = z.object({
  email: z.string().email(),
});

const verifyOTPSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  displayName: z.string().trim().min(1).max(80).optional(),
});

const updateProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(80).optional(),
  profileImage: z.string().url().max(500).optional(),
});

const oauthSchema = z.object({
  provider: z.enum(['google', 'apple', 'twitter']),
  idToken: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

// --- Helpers ---

async function issueSession(
  userId: string,
  email: string,
  req: AuthRequest
): Promise<{ token: string; refreshToken: string; expiresAt: number }> {
  const tokens = generateTokens({ userId, email });
  await sessionRepo.create({
    userId,
    refreshToken: tokens.refreshToken,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    userAgent: req.headers['user-agent'] as string | undefined,
    ipAddress: req.ip,
  });
  return tokens;
}

/**
 * On first sign-in, give the new dashboard user a starter Project +
 * API key so they have something to ship against immediately.
 */
async function ensureDefaultProject(userId: string, email: string): Promise<void> {
  const count = await projectRepo.countForOwner(userId);
  if (count > 0) return;

  const { fullKey, prefix } = generateApiKey('production');
  const hash = await hashApiKey(fullKey);
  const projectName = `${email.split('@')[0]}'s project`;

  const project = await projectRepo.createForOwner({
    ownerId: userId,
    name: projectName,
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
}

async function buildUserResponse(userId: string) {
  const user = await userRepo.findById(userId);
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    authMethod: user.authMethod,
    displayName: user.displayName ?? undefined,
    profileImage: user.profileImage ?? undefined,
    createdAt: user.createdAt.getTime(),
    lastLoginAt: user.lastLoginAt.getTime(),
  };
}

// --- Routes ---

/**
 * POST /auth/otp/send
 */
authRouter.post('/otp/send', asyncHandler(async (req, res) => {
  try {
    const { email } = sendOTPSchema.parse(req.body);
    const code = await generateOTP(email);

    const result = await sendOTPEmail(email, code);

    // Email failed to send — surface the real reason so the modal can show it.
    if (!result.ok) {
      logger.error(`Failed to send OTP to ${email}: ${result.reason}`);

      // Dev escape hatch: if RETURN_OTP_IN_DEV=true, hand the code back in the
      // response so devs can finish the flow without a verified domain.
      const includeOtp = process.env.RETURN_OTP_IN_DEV === 'true';
      res.status(502).json({
        message: 'Failed to send OTP email',
        reason: result.reason,
        ...(includeOtp ? { devOtp: code } : {}),
      });
      return;
    }

    // Even on success, the dev escape hatch is useful while iterating.
    const includeOtp =
      process.env.RETURN_OTP_IN_DEV === 'true' && !process.env.RESEND_API_KEY;
    res.json({
      message: 'OTP sent',
      email,
      ...(includeOtp ? { devOtp: code } : {}),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Invalid email', errors: error.errors });
      return;
    }
    throw error;
  }
}));

/**
 * POST /auth/otp/verify
 */
authRouter.post('/otp/verify', asyncHandler(async (req: ProjectRequest, res) => {
  try {
    const { email, code, displayName } = verifyOTPSchema.parse(req.body);
    const projectId = req.projectId!;

    const isValid = await verifyOTP(email, code);
    if (!isValid) {
      res.status(401).json({ message: 'Invalid or expired OTP' });
      return;
    }

    let user = await userRepo.findByEmail(projectId, email);
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      user = await userRepo.create({
        projectId,
        email,
        authMethod: 'email',
        displayName,
      });
    } else {
      await userRepo.touchLastLogin(user.id);
    }

    await ensureDefaultProject(user.id, user.email);

    const tokens = await issueSession(user.id, user.email, req as AuthRequest);

    const share = !isNewUser ? await keyShareRepo.get(user.id) : null;
    const authShare = share
      ? {
          index: share.shareIndex,
          type: 'auth' as const,
          data: share.shareData,
          createdAt: share.createdAt.getTime(),
        }
      : null;

    res.json({
      ...tokens,
      user: await buildUserResponse(user.id),
      authShare,
      isNewUser,
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
 * POST /auth/oauth
 */
authRouter.post('/oauth', asyncHandler(async (req: ProjectRequest, res) => {
  try {
    const { provider, idToken } = oauthSchema.parse(req.body);
    const projectId = req.projectId!;

    let profile;
    try {
      profile = await verifyOAuthToken(provider, idToken);
    } catch (err) {
      logger.warn(`OAuth verification failed for ${provider}`, { err });
      res.status(401).json({ message: 'Invalid OAuth token' });
      return;
    }

    if (!profile.emailVerified) {
      res.status(403).json({ message: 'Email not verified by OAuth provider' });
      return;
    }

    let user = await userRepo.findByEmail(projectId, profile.email);
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      user = await userRepo.create({
        projectId,
        email: profile.email,
        authMethod: provider,
        displayName: profile.displayName,
        profileImage: profile.profileImage,
        googleId: provider === 'google' ? profile.providerUserId : undefined,
      });
    } else {
      await userRepo.touchLastLogin(user.id);
    }

    await ensureDefaultProject(user.id, user.email);

    const tokens = await issueSession(user.id, user.email, req as AuthRequest);

    const share = !isNewUser ? await keyShareRepo.get(user.id) : null;
    const authShare = share
      ? {
          index: share.shareIndex,
          type: 'auth' as const,
          data: share.shareData,
          createdAt: share.createdAt.getTime(),
        }
      : null;

    res.json({
      ...tokens,
      user: await buildUserResponse(user.id),
      authShare,
      isNewUser,
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
 * POST /auth/refresh
 */
authRouter.post('/refresh', asyncHandler(async (req, res) => {
  try {
    const { refreshToken } = refreshSchema.parse(req.body);
    const payload = verifyRefreshToken(refreshToken);

    const stored = await sessionRepo.findByRefreshToken(refreshToken);
    if (!stored || stored.revokedAt || stored.expiresAt.getTime() < Date.now()) {
      res.status(401).json({ message: 'Invalid refresh token' });
      return;
    }

    const tokens = generateTokens({ userId: payload.userId, email: payload.email });
    await sessionRepo.revoke(refreshToken);
    await sessionRepo.create({
      userId: payload.userId,
      refreshToken: tokens.refreshToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    res.json(tokens);
  } catch {
    res.status(401).json({ message: 'Invalid refresh token' });
  }
}));

/**
 * POST /auth/logout
 */
authRouter.post('/logout', requireAuth, asyncHandler(async (req: AuthRequest, res) => {
  const bodyRefresh = (req.body?.refreshToken as string | undefined) ?? null;
  if (bodyRefresh) await sessionRepo.revoke(bodyRefresh);
  res.json({ message: 'Logged out' });
}));

/**
 * PATCH /auth/me — update profile fields (displayName, profileImage).
 */
authRouter.patch('/me', requireAuth, asyncHandler(async (req: AuthRequest, res) => {
  try {
    const patch = updateProfileSchema.parse(req.body);
    const updated = await userRepo.updateProfile(req.userId!, patch);
    res.json({
      user: {
        id: updated.id,
        email: updated.email,
        authMethod: updated.authMethod,
        displayName: updated.displayName ?? undefined,
        profileImage: updated.profileImage ?? undefined,
        createdAt: updated.createdAt.getTime(),
        lastLoginAt: updated.lastLoginAt.getTime(),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Invalid request', errors: error.errors });
      return;
    }
    throw error;
  }
}));
