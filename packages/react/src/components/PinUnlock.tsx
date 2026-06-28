/**
 * PinUnlock — enter a PIN to unlock a locked wallet.
 *
 * Calls `core.unlock(pin)`. On wrong PIN it shows the remaining attempts
 * (the vault wipes itself after 5 failures and forces recovery).
 */

import { useState } from 'react';
import { useRabitContext } from '../provider.js';
import { useTheme } from '../theme.js';
import { PinPad } from './PinPad.js';

export interface PinUnlockProps {
  length?: number;
  onUnlocked?: () => void;
  /** Called when the user clicks the recovery link (vault wiped). */
  onRecover?: () => void;
  title?: string;
  subtitle?: string;
}

export function PinUnlock({
  length = 4,
  onUnlocked,
  onRecover,
  title = 'Welcome back',
  subtitle = 'Enter your PIN to unlock your wallet.',
}: PinUnlockProps) {
  const { core } = useRabitContext();
  const theme = useTheme();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [vaultWiped, setVaultWiped] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (entered: string) => {
    setBusy(true);
    setError(null);
    try {
      await core.unlock(entered);
      onUnlocked?.();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to unlock';
      setError(msg);
      setPin('');
      if (msg.toLowerCase().includes('vault wiped')) {
        setVaultWiped(true);
      }
    } finally {
      setBusy(false);
    }
  };

  if (vaultWiped) {
    return (
      <div style={{ display: 'grid', gap: 16, textAlign: 'center', fontFamily: theme.fonts.body }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: theme.colors.text }}>
          Vault wiped
        </h3>
        <p style={{ margin: 0, fontSize: 13, color: theme.colors.textSecondary, lineHeight: 1.5 }}>
          Too many wrong PIN attempts. The encrypted device share has been
          deleted. To regain access, sign back in and use your recovery key.
        </p>
        {onRecover && (
          <button
            onClick={onRecover}
            style={{
              padding: '12px 16px',
              border: 'none',
              borderRadius: theme.radius.md,
              background: theme.colors.primary,
              color: theme.colors.primaryText,
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Recover wallet
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 20, fontFamily: theme.fonts.body }}>
      <div style={{ textAlign: 'center', display: 'grid', gap: 6 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: theme.colors.text }}>
          {title}
        </h3>
        <p style={{ margin: 0, fontSize: 13, color: theme.colors.textSecondary }}>
          {subtitle}
        </p>
      </div>

      <PinPad
        length={length}
        autoFocus
        disabled={busy}
        value={pin}
        onChange={setPin}
        onComplete={submit}
      />

      {error && (
        <div style={{ color: theme.colors.error, fontSize: 13, textAlign: 'center' }}>{error}</div>
      )}
    </div>
  );
}
