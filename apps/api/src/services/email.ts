/**
 * Email service using Resend
 *
 * Resend is a developer-first email API.
 * Free tier: 100 emails/day, 3000/month.
 *
 * Setup:
 * 1. Sign up at https://resend.com
 * 2. Add your domain (or use onboarding@resend.dev for testing)
 * 3. Get your API key
 * 4. Set RESEND_API_KEY in .env
 */

import { Resend } from 'resend';
import { logger } from '../utils/logger.js';

const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';
const APP_NAME = process.env.APP_NAME || 'Rabit';

// Lazy: Resend's constructor throws on empty/missing keys. We only want
// to instantiate it when there's a real key AND we actually need to send.
let _resend: Resend | null = null;
function getResend(): Resend | null {
  if (_resend) return _resend;
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  _resend = new Resend(key);
  return _resend;
}

export interface EmailSendResult {
  ok: boolean;
  /** When ok=false, a short, surfaceable reason. */
  reason?: string;
}

/**
 * Send OTP verification email. Returns `{ ok: false, reason }` on failure
 * so the calling route can surface the actual problem (e.g. unverified
 * domain) instead of silently lying to the client.
 */
export async function sendOTPEmail(to: string, code: string): Promise<EmailSendResult> {
  const resend = getResend();
  if (!resend) {
    logger.warn(`[DEV MODE] OTP for ${to}: ${code}`);
    return { ok: true };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL.includes('<') ? FROM_EMAIL : `${APP_NAME} <${FROM_EMAIL}>`,
      to: [to],
      subject: `${code} is your ${APP_NAME} verification code`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
          <h2 style="color: #111; margin-bottom: 8px;">${APP_NAME}</h2>
          <p style="color: #666; font-size: 15px; line-height: 1.6;">
            Enter this code to verify your email address:
          </p>
          <div style="background: #f5f5f5; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
            <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #111; font-family: monospace;">
              ${code}
            </span>
          </div>
          <p style="color: #999; font-size: 13px; line-height: 1.5;">
            This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    if (error) {
      logger.error('Failed to send OTP email', { error });
      return { ok: false, reason: error.message ?? 'Resend returned an error' };
    }

    logger.info(`OTP email sent to ${to}`, { id: data?.id });
    return { ok: true };
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'Unknown email service error';
    logger.error('Email service exception', { error });
    return { ok: false, reason };
  }
}
