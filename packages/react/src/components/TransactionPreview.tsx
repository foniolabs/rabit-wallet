/**
 * TransactionPreview — the human-friendly approval sheet.
 *
 * Renders a clean summary card (title, description, parameter list, fee
 * estimate, network badge) and a single "Confirm" button. No raw hex, no
 * jargon — devs supply structured fields and the SDK presents them in the
 * same Stripe-checkout / Apple-Pay style across both EVM and Solana.
 */

import { useEffect, useState } from 'react';
import { useTheme } from '../theme.js';

export interface PreviewParam {
  /** Plain-English label e.g. "Spender", "Amount", "Recipient" */
  label: string;
  /** The value the user is authorizing. Will be displayed verbatim. */
  value: string;
  /** Optional secondary text (e.g. unit, subtitle). */
  hint?: string;
  /** Render in monospace (addresses, hashes). */
  mono?: boolean;
}

export interface FeeEstimate {
  /** Native-currency display, e.g. "0.0021 ETH" or "0.000005 SOL" */
  native: string;
  /** Optional fiat estimate, e.g. "≈ $4.21" */
  fiat?: string;
  /** Optional gas-units detail, e.g. "21,000 × 32 gwei" */
  detail?: string;
}

export interface TransactionPreviewProps {
  /** Modal open flag. */
  isOpen: boolean;
  /** Title — the action verb. e.g. "Approve", "Send", "Mint". */
  title: string;
  /** One-sentence plain-English summary. */
  description: string;
  /** Structured params shown as label/value rows. */
  params?: PreviewParam[];
  /** Network name to display (e.g. "Sepolia"). */
  network?: string;
  /** Optional gas/fee estimate row appended below params. */
  fee?: FeeEstimate | null;
  /** Optional warnings shown inline before the buttons. */
  warnings?: string[];
  /** Cancel callback. */
  onCancel: () => void;
  /** Confirm callback — the dev runs the actual signing here. */
  onConfirm: () => Promise<void>;
  /** Custom confirm-button label. Default "Confirm". */
  confirmLabel?: string;
  /** Surface the dev-supplied error after confirm fails. */
  errorOverride?: string | null;
  /**
   * Optional success view payload — when set, the sheet flips to a success
   * card with a hash and explorer link instead of the form.
   */
  result?: { hash: string; explorerUrl?: string } | null;
  /** Reset/clear after success → done. */
  onDone?: () => void;
}

export function TransactionPreview({
  isOpen,
  title,
  description,
  params,
  network,
  fee,
  warnings,
  onCancel,
  onConfirm,
  confirmLabel = 'Confirm',
  errorOverride,
  result,
  onDone,
}: TransactionPreviewProps) {
  const theme = useTheme();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setBusy(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Transaction failed');
    } finally {
      setBusy(false);
    }
  };

  const errMsg = errorOverride ?? error;

  return (
    <div style={overlay()}>
      <div
        style={{
          background: theme.colors.background,
          borderRadius: theme.radius.lg,
          padding: 28,
          width: 440,
          maxWidth: '92vw',
          boxShadow: theme.shadow,
          fontFamily: theme.fonts.body,
          color: theme.colors.text,
        }}
      >
        {/* Network badge */}
        {network && !result && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: 999,
              background: theme.colors.surfaceMuted,
              fontSize: 11,
              color: theme.colors.textSecondary,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: 12,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 999,
                background: theme.colors.success,
              }}
            />
            {network}
          </div>
        )}

        {result ? (
          <SuccessView result={result} onDone={onDone ?? onCancel} />
        ) : (
          <>
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>{title}</h3>
            <p
              style={{
                margin: '6px 0 18px',
                fontSize: 14,
                color: theme.colors.textSecondary,
                lineHeight: 1.5,
              }}
            >
              {description}
            </p>

            {params && params.length > 0 && (
              <div
                style={{
                  display: 'grid',
                  gap: 0,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.radius.md,
                  marginBottom: 16,
                }}
              >
                {params.map((p, i) => (
                  <div
                    key={`${p.label}-${i}`}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 12,
                      padding: '12px 14px',
                      borderTop: i === 0 ? 'none' : `1px solid ${theme.colors.border}`,
                    }}
                  >
                    <span style={{ fontSize: 12, color: theme.colors.textSecondary }}>{p.label}</span>
                    <div style={{ textAlign: 'right', display: 'grid', gap: 2 }}>
                      <span
                        style={{
                          fontSize: 13,
                          color: theme.colors.text,
                          fontFamily: p.mono ? theme.fonts.monospace : undefined,
                          wordBreak: 'break-all',
                        }}
                      >
                        {p.value}
                      </span>
                      {p.hint && (
                        <span style={{ fontSize: 11, color: theme.colors.textMuted }}>{p.hint}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {fee && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  marginBottom: 12,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.radius.md,
                  background: theme.colors.surfaceMuted,
                }}
              >
                <span style={{ fontSize: 12, color: theme.colors.textSecondary }}>
                  Estimated fee
                </span>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontFamily: theme.fonts.monospace, color: theme.colors.text }}>
                    {fee.native}
                  </div>
                  {fee.fiat && (
                    <div style={{ fontSize: 11, color: theme.colors.textMuted }}>{fee.fiat}</div>
                  )}
                  {fee.detail && (
                    <div style={{ fontSize: 10, color: theme.colors.textMuted }}>{fee.detail}</div>
                  )}
                </div>
              </div>
            )}

            {warnings && warnings.length > 0 && (
              <div style={{ display: 'grid', gap: 6, marginBottom: 12 }}>
                {warnings.map((w, i) => (
                  <div
                    key={i}
                    style={{
                      background: `${theme.colors.warning}15`,
                      border: `1px solid ${theme.colors.warning}40`,
                      borderRadius: theme.radius.sm,
                      padding: 10,
                      fontSize: 12,
                      color: theme.colors.warning,
                    }}
                  >
                    ⚠ {w}
                  </div>
                ))}
              </div>
            )}

            {errMsg && (
              <div
                style={{
                  background: `${theme.colors.error}15`,
                  border: `1px solid ${theme.colors.error}40`,
                  borderRadius: theme.radius.sm,
                  padding: 10,
                  fontSize: 12,
                  color: theme.colors.error,
                  marginBottom: 12,
                }}
              >
                {errMsg}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={onCancel}
                disabled={busy}
                style={{
                  flex: 1,
                  padding: '12px',
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: theme.radius.md,
                  background: theme.colors.surface,
                  color: theme.colors.text,
                  fontSize: 14,
                  cursor: busy ? 'not-allowed' : 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={busy}
                style={{
                  flex: 2,
                  padding: '12px',
                  border: 'none',
                  borderRadius: theme.radius.md,
                  background: theme.colors.primary,
                  color: theme.colors.primaryText,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: busy ? 'not-allowed' : 'pointer',
                  opacity: busy ? 0.7 : 1,
                }}
              >
                {busy ? 'Signing…' : confirmLabel}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SuccessView({
  result,
  onDone,
}: {
  result: { hash: string; explorerUrl?: string };
  onDone: () => void;
}) {
  const theme = useTheme();
  return (
    <div style={{ display: 'grid', gap: 16, textAlign: 'center' }}>
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 999,
          background: theme.colors.success,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 28,
          margin: '0 auto',
        }}
      >
        ✓
      </div>
      <div>
        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Transaction confirmed</h3>
        <p style={{ margin: '6px 0 0', fontSize: 13, color: theme.colors.textSecondary }}>
          The action you authorized has been submitted to the network.
        </p>
      </div>
      <div
        style={{
          background: theme.colors.surfaceMuted,
          padding: 10,
          borderRadius: theme.radius.sm,
          fontSize: 11,
          fontFamily: theme.fonts.monospace,
          wordBreak: 'break-all',
        }}
      >
        {result.hash}
      </div>
      {result.explorerUrl && (
        <a
          href={result.explorerUrl}
          target="_blank"
          rel="noreferrer"
          style={{
            padding: '10px 14px',
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radius.md,
            color: theme.colors.text,
            textDecoration: 'none',
            fontSize: 14,
          }}
        >
          View on explorer →
        </a>
      )}
      <button
        onClick={onDone}
        style={{
          padding: '12px',
          border: 'none',
          borderRadius: theme.radius.md,
          background: theme.colors.primary,
          color: theme.colors.primaryText,
          fontSize: 14,
          fontWeight: 500,
          cursor: 'pointer',
        }}
      >
        Done
      </button>
    </div>
  );
}

function overlay(): React.CSSProperties {
  return {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10002,
  };
}
