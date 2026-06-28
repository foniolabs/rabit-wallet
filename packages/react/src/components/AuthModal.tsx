/**
 * AuthModal — web2-feel sign-in modal for the embedded wallet.
 *
 * Steps:
 *   email → otp → recovery_backup → pin_setup → done
 *
 * Themed via `RabitConfig.theme.colors` (see useTheme()).
 * Devs override copy with the `title`, `subtitle`, `appName` props.
 */

import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { useTheme } from '../theme.js';
import { PinSetup } from './PinSetup.js';
import { useRabitContext } from '../provider.js';

export interface AuthModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Called after successful auth + (optional) PIN setup */
  onAuthenticated?: () => void;
  /** Top-of-modal heading. */
  title?: string;
  /** Subtitle below the heading. */
  subtitle?: string;
  /** App name used in the footer. */
  appName?: string;
  /** Logo URL shown above the title (optional). */
  logoUrl?: string;
  /** Show "Powered by Rabit" footer. Defaults to true. */
  showFooter?: boolean;
  /** Whether to prompt the user to set a PIN after first signup. Defaults to true. */
  promptPin?: boolean;
}

// New flow: email → otp → (only for new users with no name) name → recovery_backup → pin_setup
type AuthStep = 'email' | 'otp' | 'name' | 'recovery_backup' | 'pin_setup';

export function AuthModal({
  isOpen,
  onClose,
  onAuthenticated,
  title,
  subtitle,
  appName = 'this app',
  logoUrl,
  showFooter = true,
  promptPin = true,
}: AuthModalProps) {
  const theme = useTheme();
  const { core } = useRabitContext();
  const { sendOTP, verifyOTP, updateProfile, isLoading, error } = useAuth();
  const [step, setStep] = useState<AuthStep>('email');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [otp, setOtp] = useState('');
  const [recoveryKey, setRecoveryKey] = useState<string | null>(null);
  const [recoveryAck, setRecoveryAck] = useState(false);
  const lastSubmittedOtp = useRef<string | null>(null);

  const finish = () => {
    onAuthenticated?.();
    onClose();
    setStep('email');
    setEmail('');
    setDisplayName('');
    setOtp('');
    setRecoveryKey(null);
    setRecoveryAck(false);
  };

  /** Decide what to do after the OTP comes back. */
  const afterOtpVerify = async (result: {
    isNewUser: boolean;
    recoveryShare?: { data: string } | null;
  }) => {
    // If the user typed a name on the login screen and is new (or has no
    // displayName yet), persist it now via updateProfile.
    const trimmedName = displayName.trim();
    if (trimmedName && !core.auth.user?.displayName) {
      try {
        await updateProfile({ displayName: trimmedName });
      } catch {/* non-fatal */}
    }

    if (result.isNewUser) {
      setRecoveryKey(result.recoveryShare ? JSON.stringify(result.recoveryShare) : null);
      // Only fall back to a separate name step if they didn't type one above
      // and we still don't have a displayName.
      if (!trimmedName && !core.auth.user?.displayName) {
        setStep('name');
      } else if (result.recoveryShare) {
        setStep('recovery_backup');
      } else {
        finish();
      }
      return;
    }

    if (!trimmedName && !core.auth.user?.displayName) {
      setStep('name');
      return;
    }

    finish();
  };

  // Auto-submit when 6 digits are entered, but only fire once per code.
  // NOTE: this hook must run before the `if (!isOpen) return null` early-return
  // below — React requires hook order to be stable across renders.
  useEffect(() => {
    if (step !== 'otp') {
      lastSubmittedOtp.current = null;
      return;
    }
    if (otp.length === 6 && !isLoading && lastSubmittedOtp.current !== otp) {
      lastSubmittedOtp.current = otp;
      void verifyOTP(email, otp)
        .then(afterOtpVerify)
        .catch(() => {/* error surfaced via useAuth().error */});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp, step, isLoading]);

  if (!isOpen) return null;

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await sendOTP(email);
      setStep('otp');
    } catch {/* shown via error */}
  };

  const handleSubmitName = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = displayName.trim();
    if (!trimmed) return;
    try {
      await updateProfile({ displayName: trimmed });
      // After name is saved, branch on whether this was a new signup.
      if (recoveryKey) {
        setStep('recovery_backup');
      } else {
        finish();
      }
    } catch {/* shown via error */}
  };

  const handleVerifyOTP = async (e?: React.FormEvent) => {
    e?.preventDefault();
    try {
      const result = await verifyOTP(email, otp);
      afterOtpVerify(result);
    } catch {/* shown via error */}
  };

  const handleRecoveryDone = () => {
    if (promptPin) setStep('pin_setup');
    else finish();
  };

  return (
    <div style={overlay()}>
      <div
        style={{
          background: theme.colors.background,
          borderRadius: theme.radius.lg,
          padding: 32,
          width: 400,
          maxWidth: '92vw',
          boxShadow: theme.shadow,
          fontFamily: theme.fonts.body,
          color: theme.colors.text,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} aria-label="Close" style={closeBtn(theme)}>
            ×
          </button>
        </div>

        {step === 'email' && (
          <Form
            onSubmit={handleSendOTP}
            heading={
              <Heading
                logoUrl={logoUrl}
                title={title ?? `Welcome to ${appName}`}
                subtitle={subtitle ?? 'Sign in to create your wallet — no extension required.'}
              />
            }
          >
            <Input
              type="text"
              autoFocus
              maxLength={80}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              aria-label="Display name"
            />
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              aria-label="Email"
            />
            <PrimaryButton type="submit" disabled={isLoading || !email}>
              {isLoading ? 'Sending code…' : 'Sign in'}
            </PrimaryButton>
            <p
              style={{
                margin: '4px 0 0',
                fontSize: 11,
                color: theme.colors.textMuted,
                textAlign: 'center',
                lineHeight: 1.5,
              }}
            >
              By continuing you agree to {appName}'s terms.
              Your wallet is non-custodial and works with EVM and Solana.
            </p>
          </Form>
        )}

        {step === 'otp' && (
          <Form
            onSubmit={handleVerifyOTP}
            heading={
              <Heading
                logoUrl={logoUrl}
                title="Check your email"
                subtitle={`We sent a 6-digit code to ${email}.`}
              />
            }
          >
            <Input
              type="text"
              autoFocus
              required
              maxLength={6}
              inputMode="numeric"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              style={{ textAlign: 'center', letterSpacing: '0.4em', fontFamily: theme.fonts.monospace, fontSize: 18 }}
            />
            <PrimaryButton type="submit" disabled={isLoading || otp.length < 6}>
              {isLoading ? 'Verifying…' : 'Verify'}
            </PrimaryButton>
            <GhostButton type="button" onClick={() => setStep('email')}>
              Use a different email
            </GhostButton>
          </Form>
        )}

        {step === 'name' && (
          <Form
            onSubmit={handleSubmitName}
            heading={
              <Heading
                logoUrl={logoUrl}
                title="What should we call you?"
                subtitle="Pick a display name. You can change it later."
              />
            }
          >
            <Input
              type="text"
              autoFocus
              required
              maxLength={80}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
            />
            <PrimaryButton type="submit" disabled={isLoading || !displayName.trim()}>
              {isLoading ? 'Saving…' : 'Continue'}
            </PrimaryButton>
          </Form>
        )}

        {step === 'recovery_backup' && recoveryKey && (
          <div>
            <Heading
              logoUrl={logoUrl}
              title="Save your recovery key"
              subtitle="If you lose your device, this is the only way back into your wallet. Store it somewhere safe."
            />
            <div
              style={{
                background: theme.colors.surfaceMuted,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.radius.md,
                padding: 12,
                fontFamily: theme.fonts.monospace,
                fontSize: 12,
                wordBreak: 'break-all',
                marginBottom: 12,
                maxHeight: 120,
                overflow: 'auto',
              }}
            >
              {recoveryKey}
            </div>
            <SecondaryButton
              type="button"
              onClick={() => navigator.clipboard?.writeText(recoveryKey)}
            >
              Copy to clipboard
            </SecondaryButton>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13,
                color: theme.colors.textSecondary,
                margin: '12px 0 8px',
              }}
            >
              <input
                type="checkbox"
                checked={recoveryAck}
                onChange={(e) => setRecoveryAck(e.target.checked)}
              />
              I've saved my recovery key.
            </label>
            <PrimaryButton type="button" onClick={handleRecoveryDone} disabled={!recoveryAck}>
              Continue
            </PrimaryButton>
          </div>
        )}

        {step === 'pin_setup' && (
          <PinSetup
            onComplete={finish}
            onSkip={finish}
            title="Add a PIN"
            subtitle="Lock your wallet behind a 4-digit PIN. You'll enter it whenever you reopen the app."
          />
        )}

        {error && (
          <p style={{ color: theme.colors.error, fontSize: 13, textAlign: 'center', marginTop: 12 }}>
            {error.message}
          </p>
        )}

        {showFooter && (
          <p
            style={{
              textAlign: 'center',
              color: theme.colors.textMuted,
              fontSize: 11,
              letterSpacing: '0.04em',
              marginTop: 24,
              marginBottom: 0,
              textTransform: 'uppercase',
            }}
          >
            Powered by Rabit
          </p>
        )}
      </div>
    </div>
  );
}

// ───────── small primitives ─────────

function Heading({
  logoUrl,
  title,
  subtitle,
}: {
  logoUrl?: string;
  title: string;
  subtitle?: string;
}) {
  const theme = useTheme();
  return (
    <div style={{ textAlign: 'center', display: 'grid', gap: 8, marginBottom: 20 }}>
      {logoUrl && (
        <img
          src={logoUrl}
          alt=""
          style={{ width: 48, height: 48, margin: '0 auto', borderRadius: theme.radius.md }}
        />
      )}
      <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: theme.colors.text }}>
        {title}
      </h2>
      {subtitle && (
        <p style={{ margin: 0, fontSize: 14, color: theme.colors.textSecondary, lineHeight: 1.5 }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

function Form({
  onSubmit,
  heading,
  children,
}: {
  onSubmit: (e: React.FormEvent) => void;
  heading: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
      {heading}
      {children}
    </form>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const theme = useTheme();
  return (
    <input
      {...props}
      style={{
        width: '100%',
        padding: '12px 14px',
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.md,
        fontSize: 15,
        outline: 'none',
        boxSizing: 'border-box',
        background: theme.colors.surface,
        color: theme.colors.text,
        fontFamily: theme.fonts.body,
        ...(props.style ?? {}),
      }}
    />
  );
}

function PrimaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const theme = useTheme();
  return (
    <button
      {...props}
      style={{
        width: '100%',
        padding: '12px 16px',
        background: theme.colors.primary,
        color: theme.colors.primaryText,
        border: 'none',
        borderRadius: theme.radius.md,
        fontSize: 15,
        fontWeight: 500,
        cursor: props.disabled ? 'not-allowed' : 'pointer',
        opacity: props.disabled ? 0.6 : 1,
        ...(props.style ?? {}),
      }}
    >
      {props.children}
    </button>
  );
}

function SecondaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const theme = useTheme();
  return (
    <button
      {...props}
      style={{
        width: '100%',
        padding: '12px 16px',
        background: theme.colors.surfaceMuted,
        color: theme.colors.text,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.md,
        fontSize: 14,
        cursor: 'pointer',
        ...(props.style ?? {}),
      }}
    >
      {props.children}
    </button>
  );
}

function GhostButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const theme = useTheme();
  return (
    <button
      {...props}
      style={{
        background: 'transparent',
        border: 'none',
        color: theme.colors.textSecondary,
        fontSize: 13,
        cursor: 'pointer',
        textDecoration: 'underline',
        padding: '8px 0',
        ...(props.style ?? {}),
      }}
    >
      {props.children}
    </button>
  );
}

function closeBtn(theme: ReturnType<typeof useTheme>): React.CSSProperties {
  return {
    background: 'none',
    border: 'none',
    color: theme.colors.textMuted,
    cursor: 'pointer',
    fontSize: 22,
    lineHeight: 1,
    padding: 4,
  };
}

function overlay(): React.CSSProperties {
  return {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
  };
}
