/**
 * API key generation + hashing.
 * Format: `pk_<env>_<32 url-safe chars>` — e.g. `pk_live_4f3a92c01a8e3b27d…`
 * The first 16 chars after the env prefix are the public "prefix" (safe to store
 * cleartext for display); the full key is bcrypt-hashed before persistence.
 */

import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const ENV_PREFIXES = { production: 'live', staging: 'test', development: 'dev' } as const;
type Environment = keyof typeof ENV_PREFIXES;

export function generateApiKey(environment: Environment = 'production'): {
  fullKey: string;
  prefix: string;
} {
  // 24 bytes → ~32 url-safe chars after base64url encoding
  const random = crypto.randomBytes(24).toString('base64url');
  const fullKey = `pk_${ENV_PREFIXES[environment]}_${random}`;
  // Public prefix for display: first 16 chars of the random portion.
  const prefix = `pk_${ENV_PREFIXES[environment]}_${random.slice(0, 8)}`;
  return { fullKey, prefix };
}

export async function hashApiKey(fullKey: string): Promise<string> {
  return bcrypt.hash(fullKey, 10);
}

export async function verifyApiKey(fullKey: string, hash: string): Promise<boolean> {
  return bcrypt.compare(fullKey, hash);
}

/**
 * Compute the public prefix from a full key without re-running RNG.
 * Used by the apiKeyAuth middleware to do a fast prefix lookup before
 * the more expensive bcrypt compare.
 */
export function prefixOf(fullKey: string): string {
  // pk_<env>_<random>  — return first `pk_<env>_` + first 8 chars of random.
  const parts = fullKey.split('_');
  if (parts.length < 3) return fullKey.slice(0, 16);
  const [pk, env, random] = parts;
  return `${pk}_${env}_${(random || '').slice(0, 8)}`;
}
