/**
 * RecoveryUnlock — shown when this device is missing the device share.
 *
 * The user pastes their recovery share JSON (the one we showed them at signup).
 * We call `core.recoverWallet(...)`, which Shamir-reconstructs the seed using
 * recovery + auth shares and re-stores a new device share locally.
 *
 * Also offers a "Reset and start fresh" path for users who lost their recovery
 * share — that wipes their server-side auth share and lets them sign up again
 * (any prior on-chain funds become unrecoverable).
 */

import { useState } from 'react';
import { useRabitContext } from '../provider.js';
import { useTheme } from '../theme.js';
import type { KeyShare } from '@rabit/types';

export interface RecoveryUnlockProps {
  /** Called after successful recovery. */
  onRecovered?: () => void;
  /** Called after a wallet reset. */
  onReset?: () => void;
  /** Hide the reset escape hatch (e.g. for production where it's destructive). */
  showReset?: boolean;
}

export function RecoveryUnlock({
  onRecovered,
  onReset,
  showReset = true,
}: RecoveryUnlockProps) {
  const { core } = useRabitContext();
  const theme = useTheme();
  const [share, setShare] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const parsed = parseShare(share.trim());
      await core.recoverWallet(parsed);
      onRecovered?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Recovery failed');
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    setBusy(true);
    setError(null);
    try {
      // resetWallet wipes both the server-side auth share AND local state,
      // so the next sign-in is treated as a brand-new signup. Plain logout
      // would loop back here because the server share would still exist.
      await core.resetWallet();
      onReset?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Reset failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: 16, fontFamily: theme.fonts.body }}>
      <div style={{ textAlign: 'center', display: 'grid', gap: 6 }}>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: theme.colors.text }}>
          New device detected
        </h3>
        <p style={{ margin: 0, fontSize: 13, color: theme.colors.textSecondary, lineHeight: 1.5 }}>
          We can't find your local key on this device. Paste the recovery share
          you saved when you first signed up to restore your wallet.
        </p>
      </div>

      <textarea
        value={share}
        onChange={(e) => setShare(e.target.value)}
        placeholder='{"index":3,"type":"recovery","data":"..."}'
        style={{
          width: '100%',
          minHeight: 90,
          padding: 10,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.radius.md,
          background: theme.colors.surface,
          color: theme.colors.text,
          fontFamily: theme.fonts.monospace,
          fontSize: 12,
          boxSizing: 'border-box',
          resize: 'vertical',
        }}
      />

      {error && (
        <div style={{ color: theme.colors.error, fontSize: 13 }}>{error}</div>
      )}

      <button
        onClick={submit}
        disabled={busy || !share.trim()}
        style={{
          padding: '12px 16px',
          border: 'none',
          borderRadius: theme.radius.md,
          background: theme.colors.primary,
          color: theme.colors.primaryText,
          fontSize: 14,
          fontWeight: 500,
          cursor: busy ? 'not-allowed' : 'pointer',
          opacity: busy || !share.trim() ? 0.6 : 1,
        }}
      >
        {busy ? 'Recovering…' : 'Recover wallet'}
      </button>

      {showReset && (
        <div
          style={{
            borderTop: `1px solid ${theme.colors.border}`,
            paddingTop: 12,
            display: 'grid',
            gap: 8,
          }}
        >
          <p style={{ margin: 0, fontSize: 12, color: theme.colors.textMuted, lineHeight: 1.5 }}>
            Lost your recovery share? You can reset this account, but any
            on-chain assets in the previous wallet become unrecoverable.
          </p>
          {confirmReset ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={reset}
                disabled={busy}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  border: 'none',
                  borderRadius: theme.radius.md,
                  background: theme.colors.error,
                  color: '#fff',
                  fontSize: 13,
                  cursor: busy ? 'not-allowed' : 'pointer',
                }}
              >
                Yes, reset and start over
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                disabled={busy}
                style={{
                  padding: '10px 14px',
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.radius.md,
                  background: theme.colors.surface,
                  color: theme.colors.text,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmReset(true)}
              style={{
                background: 'transparent',
                border: 'none',
                color: theme.colors.textSecondary,
                fontSize: 12,
                textDecoration: 'underline',
                cursor: 'pointer',
                padding: 4,
              }}
            >
              Reset and create a new wallet instead
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Parse a recovery share. Accepts either:
 *   - the JSON object string we showed at signup
 *   - the inner data hex string (we'll wrap it)
 */
function parseShare(input: string): KeyShare {
  // Most likely the user pasted the JSON object.
  try {
    const parsed = JSON.parse(input);
    if (
      parsed &&
      typeof parsed === 'object' &&
      typeof parsed.index === 'number' &&
      typeof parsed.data === 'string'
    ) {
      return {
        index: parsed.index,
        type: 'recovery',
        data: parsed.data,
        createdAt: parsed.createdAt ?? Date.now(),
      };
    }
  } catch {/* not JSON, fall through */}

  throw new Error(
    'That doesn\'t look like a valid recovery share. Paste the full JSON object you saved at signup.'
  );
}
