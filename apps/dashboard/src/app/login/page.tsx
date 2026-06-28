import { ArrowRight, Mail } from 'lucide-react'
import Link from 'next/link'
import { Logo } from '@/components/ui/Logo'
import {
  requestOtpAction,
  resendOtpAction,
  verifyOtpAction,
} from '@/app/auth-actions'

const ERRORS: Record<string, string> = {
  'invalid-email': 'Please enter a valid email.',
  'send-failed': 'We couldn’t send the code. Please try again.',
  'invalid-code': 'Enter the 6-digit code from your email.',
  'wrong-code': 'That code is incorrect or expired.',
  'verify-failed': 'We couldn’t verify the code. Please try again.',
}

export default function Login({
  searchParams,
}: {
  searchParams: {
    step?: string
    email?: string
    error?: string
    reason?: string
    next?: string
    resent?: string
    devOtp?: string
  }
}) {
  const step = searchParams.step === 'otp' ? 'otp' : 'email'
  const email = searchParams.email || ''
  const next = searchParams.next || '/'
  const errorKey = searchParams.error
  const reason = searchParams.reason
  const resent = searchParams.resent === '1'
  const devOtp = searchParams.devOtp

  return (
    <main className="grid min-h-screen place-items-center px-6">
      <div className="w-full max-w-sm">
        <Logo />

        {step === 'email' ? (
          <EmailStep next={next} errorKey={errorKey} reason={reason} />
        ) : (
          <OtpStep
            email={email}
            next={next}
            errorKey={errorKey}
            reason={reason}
            resent={resent}
            devOtp={devOtp}
          />
        )}

        <p className="mt-8 text-center text-xs text-fg-subtle">
          By continuing, you agree to our Terms and Privacy Policy.
        </p>
      </div>
    </main>
  )
}

function EmailStep({
  next,
  errorKey,
  reason,
}: {
  next: string
  errorKey?: string
  reason?: string
}) {
  return (
    <>
      <h1 className="mt-10 text-2xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-2 text-sm text-fg-muted">
        We&apos;ll email you a 6-digit code to sign in.
      </p>

      {errorKey && <ErrorBanner errorKey={errorKey} reason={reason} />}

      <form action={requestOtpAction} className="mt-8 space-y-4">
        <input type="hidden" name="next" value={next} />
        <Field label="Email" name="email" type="email" placeholder="you@company.com" required autoComplete="email" />
        <SubmitButton>
          Email me a code <ArrowRight size={14} />
        </SubmitButton>
      </form>
    </>
  )
}

function OtpStep({
  email,
  next,
  errorKey,
  reason,
  resent,
  devOtp,
}: {
  email: string
  next: string
  errorKey?: string
  reason?: string
  resent: boolean
  devOtp?: string
}) {
  return (
    <>
      <h1 className="mt-10 text-2xl font-semibold tracking-tight">Check your email</h1>
      <p className="mt-2 text-sm text-fg-muted">
        We sent a 6-digit code to <span className="text-fg">{email}</span>.
      </p>

      {resent && !errorKey && (
        <p className="mt-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-sm text-emerald-300">
          Code resent.
        </p>
      )}

      {errorKey && <ErrorBanner errorKey={errorKey} reason={reason} />}

      {devOtp && (
        <p className="mt-6 flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-sm text-amber-200">
          <Mail size={14} />
          Dev OTP: <code className="font-mono">{devOtp}</code>
        </p>
      )}

      <form action={verifyOtpAction} className="mt-8 space-y-4">
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="next" value={next} />
        <Field
          label="Verification code"
          name="code"
          inputMode="numeric"
          pattern="\d{6}"
          maxLength={6}
          autoComplete="one-time-code"
          placeholder="123456"
          required
          mono
        />
        <SubmitButton>
          Verify and continue <ArrowRight size={14} />
        </SubmitButton>
      </form>

      <div className="mt-4 flex items-center justify-between text-xs">
        <Link
          href={`/login?next=${encodeURIComponent(next)}`}
          className="text-fg-muted transition-colors hover:text-fg"
        >
          Use a different email
        </Link>
        <form action={resendOtpAction}>
          <input type="hidden" name="email" value={email} />
          <input type="hidden" name="next" value={next} />
          <button
            type="submit"
            className="text-fg-muted transition-colors hover:text-fg"
          >
            Resend code
          </button>
        </form>
      </div>
    </>
  )
}

function ErrorBanner({ errorKey, reason }: { errorKey: string; reason?: string }) {
  const message = ERRORS[errorKey] || 'Something went wrong.'
  return (
    <p
      role="alert"
      className="mt-6 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3.5 py-2 text-sm text-rose-300"
    >
      {message}
      {reason && <span className="mt-1 block text-xs text-rose-300/70">{reason}</span>}
    </p>
  )
}

function Field({
  label,
  name,
  mono,
  ...rest
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string; mono?: boolean }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-fg-subtle">
        {label}
      </span>
      <input
        name={name}
        className={`w-full rounded-lg border border-border bg-bg-subtle px-3.5 py-2.5 text-sm text-fg placeholder:text-fg-subtle focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/30 ${
          mono ? 'font-mono tracking-[0.4em]' : ''
        }`}
        {...rest}
      />
    </label>
  )
}

function SubmitButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="submit"
      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-accent text-sm font-medium text-white transition-colors hover:bg-accent-hover"
    >
      {children}
    </button>
  )
}
