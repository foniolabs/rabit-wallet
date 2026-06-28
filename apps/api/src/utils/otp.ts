/**
 * OTP generation and verification (DB-backed).
 */

import { randomBytes } from 'crypto';
import { otpRepo } from '../db/repositories.js';

const OTP_LENGTH = 6;
const OTP_EXPIRY_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

/**
 * Generate and persist an OTP for an email.
 */
export async function generateOTP(email: string): Promise<string> {
  const bytes = new Uint8Array(randomBytes(4));
  const num = ((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]) >>> 0;
  const code = (num % 1_000_000).toString().padStart(OTP_LENGTH, '0');

  await otpRepo.create(email, code, new Date(Date.now() + OTP_EXPIRY_MS));
  return code;
}

/**
 * Constant-time string compare (to avoid timing leaks on code equality).
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

/**
 * Verify an OTP for an email. Consumes the code on success.
 */
export async function verifyOTP(email: string, code: string): Promise<boolean> {
  const record = await otpRepo.findLatestValid(email);
  if (!record) return false;

  if (record.attempts >= MAX_ATTEMPTS) {
    return false;
  }

  if (!timingSafeEqual(record.code, code)) {
    await otpRepo.incrementAttempts(record.id);
    return false;
  }

  await otpRepo.markUsed(record.id);
  return true;
}
