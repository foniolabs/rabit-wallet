import { useState, useRef } from 'react';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import {
  RabitProvider,
  RabitDashboard,
  useAuth,
  useWallet,
  PinUnlock,
  RecoveryUnlock,
  useRabitContext,
} from '@rabit/react';
import { createSmartAccountResolver, PRESET_EVM_CHAINS, ETHEREUM_SEPOLIA } from '@rabit/evm';
import { PRESET_SOLANA_CHAINS } from '@rabit/solana';
import type { SmartAccountType } from '@rabit/types';

const PROJECT_ID = import.meta.env.VITE_RABIT_PROJECT_ID ?? 'dev-project';
const API_KEY = import.meta.env.VITE_RABIT_API_KEY ?? 'dev-api-key';
const API_BASE_URL = import.meta.env.VITE_RABIT_API_BASE_URL ?? 'http://localhost:3001';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const BUNDLER_URL = import.meta.env.VITE_BUNDLER_URL;
const PAYMASTER_URL = import.meta.env.VITE_PAYMASTER_URL;
const SMART_ACCOUNT_TYPE =
  (import.meta.env.VITE_SMART_ACCOUNT_TYPE as SmartAccountType | undefined) ?? 'kernel';

const smartAccountEnabled = Boolean(BUNDLER_URL);

const presetRpcByChainId = Object.fromEntries(
  PRESET_EVM_CHAINS.map((c) => [c.id, c.rpcUrls.default[0].url])
);

const smartAccountResolver = smartAccountEnabled
  ? createSmartAccountResolver({
      type: SMART_ACCOUNT_TYPE,
      bundlerUrl: BUNDLER_URL!,
      paymasterUrl: PAYMASTER_URL || undefined,
      rpcUrls: presetRpcByChainId,
    })
  : undefined;

function Shell() {
  return (
    <RabitProvider
      config={{
        projectId: PROJECT_ID,
        apiKey: API_KEY,
        apiBaseUrl: API_BASE_URL,
        app: { name: 'Rabit Wallet' },
        evmChains: PRESET_EVM_CHAINS,
        defaultEvmChainId: ETHEREUM_SEPOLIA.id,
        solanaChains: PRESET_SOLANA_CHAINS,
        defaultSolanaCluster: 'devnet',
        authMethods: ['email', 'google'],
        smartAccountType: smartAccountEnabled ? SMART_ACCOUNT_TYPE : undefined,
        bundlerUrl: BUNDLER_URL,
        paymasterUrl: PAYMASTER_URL,
        smartAccountResolver,
      }}
    >
      <AppContent />
    </RabitProvider>
  );
}

export function App() {
  if (GOOGLE_CLIENT_ID) {
    return (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <Shell />
      </GoogleOAuthProvider>
    );
  }
  return <Shell />;
}

// ─── Core application logic ───

function AppContent() {
  const { isAuthenticated, user } = useAuth();
  const { isLocked, needsRecovery } = useWallet();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Not logged in → show full-screen login
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // First-time onboarding — user has no display name set
  const needsOnboarding = !user?.displayName;
  if (needsOnboarding) {
    return <OnboardingScreen />;
  }

  // Recovery needed
  if (needsRecovery) {
    return (
      <CenteredCard>
        <h2 style={styles.cardTitle}>Recover your wallet</h2>
        <RecoveryUnlock />
      </CenteredCard>
    );
  }

  // Wallet locked → show pin screen
  if (isLocked) {
    return (
      <CenteredCard>
        <h2 style={styles.cardTitle}>Wallet locked</h2>
        <p style={styles.cardSub}>Enter your PIN to unlock.</p>
        <PinUnlock />
      </CenteredCard>
    );
  }

  // Main dashboard
  return (
    <div style={{ minHeight: '100vh', background: '#0C0C0F', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <header style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: '#19191C', borderBottom: '1px solid #2A2A32',
        padding: '12px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            width: 28, height: 28, borderRadius: 8,
            background: 'linear-gradient(135deg, #AB9FF2, #4E44CE)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            color: '#0C0C0F', fontWeight: 700, fontSize: 14,
          }}>R</span>
          <span style={{ fontWeight: 600, fontSize: 15, color: '#FFFFF0' }}>Rabit Wallet</span>
        </div>
        <button
          onClick={() => setDrawerOpen(true)}
          style={{
            padding: '8px 16px', border: 'none', borderRadius: 8,
            background: '#AB9FF2', color: '#0C0C0F', fontSize: 13, fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Open Wallet
        </button>
      </header>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 20px', textAlign: 'center' }}>
        <h1 style={{ margin: 0, fontSize: 28, letterSpacing: '-0.02em', color: '#FFFFF0' }}>
          Welcome back, {user?.displayName}
        </h1>
        <p style={{ margin: '12px 0 0', color: '#8A8A9A', fontSize: 15, lineHeight: 1.5 }}>
          Click <strong style={{color: '#FFFFF0'}}>"Open Wallet"</strong> to manage your assets, tokens, and transactions.
        </p>
      </div>

      <RabitDashboard isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}

// ─── Shared Components ───

function OtpInput({ length = 6, value, onChange, onComplete, disabled }: { length?: number; value: string; onChange: (v: string) => void; onComplete?: () => void; disabled?: boolean }) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>(Array(length).fill(null));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    if (!val) return;

    // Use only the last typed char
    const newChar = val.slice(-1);
    const newValue = value.slice(0, index) + newChar + value.slice(index + 1);
    const updated = newValue.slice(0, length);
    onChange(updated);

    if (index < length - 1 && newChar) {
      inputRefs.current[index + 1]?.focus();
    }
    
    if (updated.length === length && onComplete) {
      setTimeout(onComplete, 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const newValue = value.slice(0, index) + ' ' + value.slice(index + 1);
      onChange(newValue.trimEnd());
      if (index > 0) inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    } else if (e.key === 'Enter' && value.length === length && onComplete) {
      onComplete();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').replace(/[^0-9]/g, '').slice(0, length);
    if (pastedData) {
      onChange(pastedData);
      const nextIndex = Math.min(pastedData.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
      if (pastedData.length === length && onComplete) onComplete();
    }
  };

  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', margin: '8px 0' }}>
      {Array.from({ length }).map((_, index) => {
        const char = value[index] && value[index] !== ' ' ? value[index] : '';
        return (
          <input
            key={index}
            ref={(el) => (inputRefs.current[index] = el)}
            type="text"
            inputMode="numeric"
            value={char}
            onChange={(e) => handleChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onPaste={handlePaste}
            disabled={disabled}
            style={{
              width: 48,
              height: 56,
              textAlign: 'center',
              fontSize: 24,
              fontWeight: 600,
              borderRadius: 12,
              border: `1.5px solid ${char ? '#AB9FF2' : '#2A2A32'}`,
              background: '#19191C',
              color: '#FFFFF0',
              outline: 'none',
              boxShadow: char ? '0 0 0 3px rgba(171, 159, 242, 0.2)' : 'none',
              transition: 'all 0.15s ease',
            }}
          />
        );
      })}
    </div>
  );
}

// ─── Login Screen ───

function LoginScreen() {
  const { core } = useRabitContext();
  const { sendOTP, verifyOTP, isLoading, error: authError } = useAuth();

  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSendOTP = async () => {
    setError(null);
    try {
      await sendOTP(email);
      setStep('otp');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send verification code');
    }
  };

  const handleVerifyOTP = async () => {
    setError(null);
    try {
      await verifyOTP(email, otp);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid code, please try again');
    }
  };

  const handleGoogleSuccess = async (credential: string) => {
    setError(null);
    try {
      await core.authenticateOAuth('google', credential);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Google sign-in failed');
    }
  };

  const displayError = error || (authError?.message ?? null);

  return (
    <div style={styles.fullScreen}>
      <div style={styles.loginContainer}>
        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <span style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'linear-gradient(135deg, #CCCCFF, #A3A3FF)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            color: '#111', fontWeight: 700, fontSize: 28,
            boxShadow: '0 4px 16px rgba(204, 204, 255, 0.4)',
          }}>R</span>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#FFFFF0', letterSpacing: '-0.02em' }}>
            Rabit Wallet
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: '#8A8A9A', textAlign: 'center', lineHeight: 1.5 }}>
            Secure, seamless, and uniquely yours. <br /> Experience the next generation of Web3.
          </p>
        </div>

        {step === 'email' ? (
          <>
            {/* Email input */}
            <div style={{ display: 'grid', gap: 12 }}>
              <div>
                <label style={styles.label}>Email address</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && email && handleSendOTP()}
                  style={styles.input}
                />
              </div>
              <button
                onClick={handleSendOTP}
                disabled={isLoading || !email}
                style={{
                  ...styles.primaryBtn,
                  opacity: isLoading || !email ? 0.6 : 1,
                  cursor: isLoading || !email ? 'not-allowed' : 'pointer',
                }}
              >
                {isLoading ? 'Sending...' : 'Continue with Email'}
              </button>
            </div>

            {/* Divider */}
            <div style={styles.divider}>
              <span style={styles.dividerLine} />
              <span style={styles.dividerText}>or</span>
              <span style={styles.dividerLine} />
            </div>

            {/* Google */}
            {GOOGLE_CLIENT_ID && (
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <GoogleLogin
                  onSuccess={(res) => {
                    if (res.credential) handleGoogleSuccess(res.credential);
                    else setError('No credential returned from Google');
                  }}
                  onError={() => setError('Google sign-in failed')}
                  shape="pill"
                  size="large"
                  width={352}
                  theme="outline"
                  text="continue_with"
                />
              </div>
            )}
          </>
        ) : (
          <>
            {/* OTP verification */}
            <div style={{ display: 'grid', gap: 12 }}>
              <p style={{ margin: 0, fontSize: 14, color: '#8A8A9A', textAlign: 'center' }}>
                A secure verification code has been dispatched to <br /> <strong style={{ color: '#FFFFF0' }}>{email}</strong>
              </p>
              <div>
                <label style={styles.label}>Verification code</label>
                <OtpInput
                  length={6}
                  value={otp}
                  onChange={setOtp}
                  onComplete={handleVerifyOTP}
                  disabled={isLoading}
                />
              </div>
              <button
                onClick={handleVerifyOTP}
                disabled={isLoading || !otp}
                style={{
                  ...styles.primaryBtn,
                  opacity: isLoading || !otp ? 0.6 : 1,
                  cursor: isLoading || !otp ? 'not-allowed' : 'pointer',
                }}
              >
                {isLoading ? 'Verifying...' : 'Verify & Sign In'}
              </button>
              <button
                onClick={() => { setStep('email'); setOtp(''); setError(null); }}
                style={styles.ghostBtn}
              >
                ← Back to email
              </button>
            </div>
          </>
        )}

        {displayError && (
          <div style={styles.errorBox}>{displayError}</div>
        )}

        <p style={{ margin: 0, fontSize: 11, color: '#505060', textAlign: 'center', lineHeight: 1.5 }}>
          By continuing, you agree to Rabit's Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}

// ─── Onboarding Screen ───

function OnboardingScreen() {
  const { updateProfile, user } = useAuth();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await updateProfile({ displayName: name.trim() });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={styles.fullScreen}>
      <div style={styles.loginContainer}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <span style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'linear-gradient(135deg, #CCCCFF, #A3A3FF)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            color: '#111', fontWeight: 700, fontSize: 28,
            boxShadow: '0 4px 16px rgba(204, 204, 255, 0.4)',
          }}>R</span>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#111111', letterSpacing: '-0.02em' }}>
            Welcome to Rabit 🎉
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: '#666666', textAlign: 'center', lineHeight: 1.5 }}>
            Personalize your experience. <br /> Let's create your unique Web3 identity.
          </p>
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          <div>
            <label style={styles.label}>Display name</label>
            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && name.trim() && save()}
              autoFocus
              style={styles.input}
            />
          </div>
          <button
            onClick={save}
            disabled={busy || !name.trim()}
            style={{
              ...styles.primaryBtn,
              opacity: busy || !name.trim() ? 0.6 : 1,
              cursor: busy || !name.trim() ? 'not-allowed' : 'pointer',
            }}
          >
            {busy ? 'Saving...' : 'Continue'}
          </button>
          {error && <div style={styles.errorBox}>{error}</div>}
        </div>

        <p style={{ margin: 0, fontSize: 12, color: '#999', textAlign: 'center' }}>
          Signed in as {user?.email ?? 'unknown'}
        </p>
      </div>
    </div>
  );
}

// ─── Shared ───

function CenteredCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={styles.fullScreen}>
      <div style={{ ...styles.loginContainer, gap: 16 }}>
        {children}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  fullScreen: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0C0C0F',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    padding: 20,
  },
  loginContainer: {
    width: '100%',
    maxWidth: 400,
    background: '#19191C',
    borderRadius: 20,
    padding: 36,
    border: '1px solid #2A2A32',
    display: 'grid',
    gap: 24,
  },
  label: {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: '#8A8A9A',
    marginBottom: 6,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    border: '1.5px solid #2A2A32',
    borderRadius: 12,
    fontSize: 15,
    color: '#FFFFF0',
    background: '#222228',
    boxSizing: 'border-box' as const,
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'border-color 0.15s ease',
  },
  primaryBtn: {
    width: '100%',
    padding: '14px 20px',
    border: 'none',
    borderRadius: 12,
    background: '#AB9FF2',
    color: '#0C0C0F',
    fontSize: 15,
    fontWeight: 600,
    fontFamily: 'inherit',
    transition: 'background 0.15s ease',
  },
  ghostBtn: {
    width: '100%',
    padding: '10px 16px',
    border: 'none',
    borderRadius: 12,
    background: 'transparent',
    color: '#8A8A9A',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    background: '#2A2A32',
  },
  dividerText: {
    fontSize: 12,
    color: '#505060',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  errorBox: {
    background: '#FF6B6B15',
    border: '1px solid #FF6B6B40',
    color: '#FF6B6B',
    padding: '10px 14px',
    borderRadius: 10,
    fontSize: 13,
  },
  cardTitle: {
    margin: '0 0 8px',
    fontSize: 20,
    fontWeight: 700,
    color: '#FFFFF0',
    textAlign: 'center' as const,
  },
  cardSub: {
    margin: '0 0 16px',
    fontSize: 14,
    color: '#8A8A9A',
    textAlign: 'center' as const,
  },
};
