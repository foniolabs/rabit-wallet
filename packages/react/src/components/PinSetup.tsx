/**
 * PinSetup — choose & confirm a 4-digit PIN. Calls `core.setPin()` on confirm.
 *
 * Shown:
 *   - inline as a step inside <AuthModal /> after wallet generation
 *   - standalone when a developer wants the user to add a PIN later
 */

import { useState } from 'react';
import { useRabitContext } from '../provider.js';
import { useTheme } from '../theme.js';
import { PinPad } from './PinPad.js';

export interface PinSetupProps {
  /** PIN length. Defaults to 4. */
  length?: number;
  /** Called once the PIN is set successfully. */
  onComplete?: () => void;
  /** Called if the user wants to skip. If omitted, the skip button is hidden. */
  onSkip?: () => void;
  /** Title text — defaults to "Create a PIN". */
  title?: string;
  /** Subtitle text. */
  subtitle?: string;
}

type Step = 'choose' | 'confirm';

export function PinSetup({
  length = 4,
  onComplete,
  onSkip,
  title = 'Create a PIN',
  subtitle = `Add a ${4}-digit PIN to keep your wallet locked when not in use.`,
}: PinSetupProps) {
  const { core } = useRabitContext();
  const theme = useTheme();
  const [step, setStep] = useState<Step>('choose');
  const [first, setFirst] = useState('');
  const [second, setSecond] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setStep('choose');
    setFirst('');
    setSecond('');
    setError(null);
  };

  const confirm = async (entered: string) => {
    if (entered !== first) {
      setError("PINs don't match. Try again.");
      reset();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await core.setPin(entered);
      onComplete?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to set PIN');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: 20, fontFamily: theme.fonts.body }}>
      <div style={{ textAlign: 'center', display: 'grid', gap: 6 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: theme.colors.text }}>
          {step === 'choose' ? title : 'Confirm your PIN'}
        </h3>
        <p style={{ margin: 0, fontSize: 13, color: theme.colors.textSecondary }}>
          {step === 'choose' ? subtitle : 'Enter the same PIN again.'}
        </p>
      </div>

      {step === 'choose' ? (
        <PinPad
          length={length}
          autoFocus
          disabled={busy}
          onComplete={(pin) => {
            setFirst(pin);
            setSecond('');
            setStep('confirm');
            setError(null);
          }}
        />
      ) : (
        <PinPad
          length={length}
          autoFocus
          disabled={busy}
          value={second}
          onChange={setSecond}
          onComplete={confirm}
        />
      )}

      {error && (
        <div style={{ color: theme.colors.error, fontSize: 13, textAlign: 'center' }}>{error}</div>
      )}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        {step === 'confirm' && (
          <button
            onClick={reset}
            disabled={busy}
            style={ghostButton(theme)}
          >
            Back
          </button>
        )}
        {onSkip && step === 'choose' && (
          <button onClick={onSkip} style={ghostButton(theme)}>
            Skip for now
          </button>
        )}
      </div>
    </div>
  );
}

function ghostButton(theme: ReturnType<typeof useTheme>): React.CSSProperties {
  return {
    background: 'transparent',
    border: 'none',
    color: theme.colors.textSecondary,
    fontSize: 13,
    padding: '6px 10px',
    cursor: 'pointer',
    textDecoration: 'underline',
  };
}
