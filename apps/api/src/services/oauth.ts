/**
 * OAuth provider verification.
 * Currently supports Google. Apple/Twitter are stubbed.
 */

import { OAuth2Client } from 'google-auth-library';
import { logger } from '../utils/logger.js';

export interface VerifiedOAuthProfile {
  email: string;
  emailVerified: boolean;
  providerUserId: string;
  displayName?: string;
  profileImage?: string;
}

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClient = googleClientId ? new OAuth2Client(googleClientId) : null;

export async function verifyGoogleIdToken(idToken: string): Promise<VerifiedOAuthProfile> {
  if (!googleClient || !googleClientId) {
    throw new Error('GOOGLE_CLIENT_ID is not configured');
  }

  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: googleClientId,
  });

  const payload = ticket.getPayload();
  if (!payload) {
    throw new Error('Google token missing payload');
  }

  if (!payload.email) {
    throw new Error('Google token missing email');
  }

  return {
    email: payload.email,
    emailVerified: payload.email_verified === true,
    providerUserId: payload.sub,
    displayName: payload.name,
    profileImage: payload.picture,
  };
}

export async function verifyOAuthToken(
  provider: 'google' | 'apple' | 'twitter',
  idToken: string
): Promise<VerifiedOAuthProfile> {
  switch (provider) {
    case 'google':
      return verifyGoogleIdToken(idToken);
    case 'apple':
    case 'twitter':
      logger.warn(`${provider} OAuth not yet implemented`);
      throw new Error(`OAuth provider '${provider}' not implemented`);
  }
}
