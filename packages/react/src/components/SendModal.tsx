/**
 * SendModal — a focused modal for sending a single token.
 * Validates inputs, shows fee estimate, signs + broadcasts on confirm.
 */

import { useEffect, useMemo, useState } from 'react';
import { useTheme } from '../theme.js';
import { useSendToken } from '../hooks/useSendToken.js';
import { useAddressBook } from '../hooks/useAddressBook.js';
import type { UnifiedBalance } from '../hooks/useBalances.js';

export interface SendModalProps {
  isOpen: boolean;
  token: UnifiedBalance | null;
  onClose: () => void;
  onSent?: (result: { hash: string; explorerUrl?: string }) => void;
}

export function SendModal({ isOpen, token, onClose, onSent }: SendModalProps) {
  const theme = useTheme();
  const { send, isSending, error, reset } = useSendToken();
  const addressBook = useAddressBook();
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [result, setResult] = useState<{ hash: string; explorerUrl?: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTo('');
      setAmount('');
      setResult(null);
      reset();
    }
  }, [isOpen, reset]);

  const suggestions = useMemo(() => {
    if (!token || !to) return [];
    const lower = to.trim().toLowerCase();
    if (!lower) return [];
    return addressBook.entries
      .filter((e) => e.ecosystem === token.ecosystem)
      .filter((e) => {
        return (
          e.label.toLowerCase().includes(lower) ||
          e.address.toLowerCase().includes(lower)
        );
      })
      .slice(0, 5);
  }, [addressBook.entries, token, to]);

  if (!isOpen || !token) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      const r = await send({ token, to: to.trim(), amount });
      // Record this recipient in the address book on success.
      addressBook.touch({ address: to.trim(), ecosystem: token.ecosystem });
      setResult(r);
      onSent?.(r);
    } catch {/* error surfaced */}
  };

  const validRecipient =
    token.ecosystem === 'evm'
      ? /^0x[0-9a-fA-F]{40}$/.test(to.trim())
      : to.trim().length >= 32 && to.trim().length <= 44;
  const numericAmount = parseFloat(amount);
  const validAmount = !Number.isNaN(numericAmount) && numericAmount > 0;
  const exceedsBalance =
    validAmount && BigInt(Math.round(numericAmount * Math.pow(10, token.decimals))) > token.raw;

  return (
    <div style={overlay()}>
      <div
        style={{
          background: theme.colors.background,
          borderRadius: theme.radius.lg,
          padding: 28,
          width: 420,
          maxWidth: '92vw',
          boxShadow: theme.shadow,
          fontFamily: theme.fonts.body,
          color: theme.colors.text,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
            Send {token.symbol}
          </h3>
          <button onClick={onClose} aria-label="Close" style={closeBtn(theme)}>×</button>
        </div>

        <div
          style={{
            background: theme.colors.surfaceMuted,
            borderRadius: theme.radius.md,
            padding: 12,
            marginBottom: 16,
            fontSize: 13,
            color: theme.colors.textSecondary,
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <span>Available</span>
          <span style={{ fontFamily: theme.fonts.monospace, color: theme.colors.text }}>
            {token.formatted} {token.symbol}
          </span>
        </div>

        {result ? (
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ color: theme.colors.success, fontWeight: 600 }}>
              Transaction submitted ✓
            </div>
            <div
              style={{
                background: theme.colors.surfaceMuted,
                padding: 10,
                borderRadius: theme.radius.sm,
                fontSize: 12,
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
                  textAlign: 'center',
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
              onClick={onClose}
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
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 10 }}>
            <Field label="Recipient">
              <input
                type="text"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder={token.ecosystem === 'evm' ? '0x…' : 'Solana address'}
                style={input(theme)}
                spellCheck={false}
                autoFocus
              />
              {suggestions.length > 0 && (
                <div
                  style={{
                    marginTop: 4,
                    border: `1px solid ${theme.colors.border}`,
                    borderRadius: theme.radius.sm,
                    background: theme.colors.surface,
                    overflow: 'hidden',
                  }}
                >
                  {suggestions.map((s) => (
                    <button
                      key={s.address}
                      type="button"
                      onClick={() => setTo(s.address)}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start',
                        gap: 2,
                        padding: '8px 10px',
                        width: '100%',
                        textAlign: 'left',
                        border: 'none',
                        background: 'transparent',
                        cursor: 'pointer',
                        borderBottom: `1px solid ${theme.colors.border}`,
                      }}
                    >
                      <span style={{ fontSize: 13, color: theme.colors.text }}>
                        {s.label || (s.lastUsedAt > 0 ? 'Recent' : 'Saved')}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: theme.colors.textMuted,
                          fontFamily: theme.fonts.monospace,
                          wordBreak: 'break-all',
                        }}
                      >
                        {s.address}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </Field>
            <Field label={`Amount (${token.symbol})`}>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  style={{ ...input(theme), paddingRight: 56 }}
                />
                <button
                  type="button"
                  onClick={() => setAmount(token.formatted)}
                  style={{
                    position: 'absolute',
                    right: 6,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: theme.colors.surfaceMuted,
                    border: 'none',
                    borderRadius: theme.radius.sm,
                    padding: '4px 8px',
                    fontSize: 11,
                    color: theme.colors.textSecondary,
                    cursor: 'pointer',
                  }}
                >
                  MAX
                </button>
              </div>
            </Field>

            {exceedsBalance && (
              <div style={{ color: theme.colors.error, fontSize: 12 }}>
                Amount exceeds your balance.
              </div>
            )}

            {error && (
              <div style={{ color: theme.colors.error, fontSize: 12 }}>{error.message}</div>
            )}

            <button
              type="submit"
              disabled={
                isSending ||
                !validRecipient ||
                !validAmount ||
                exceedsBalance
              }
              style={{
                marginTop: 4,
                padding: '12px',
                border: 'none',
                borderRadius: theme.radius.md,
                background: theme.colors.primary,
                color: theme.colors.primaryText,
                fontSize: 14,
                fontWeight: 500,
                cursor: isSending ? 'not-allowed' : 'pointer',
                opacity: isSending || !validRecipient || !validAmount ? 0.6 : 1,
              }}
            >
              {isSending ? 'Sending…' : `Send ${token.symbol}`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <label style={{ display: 'grid', gap: 4, fontSize: 12, color: theme.colors.textSecondary }}>
      {label}
      {children}
    </label>
  );
}

function input(theme: ReturnType<typeof useTheme>): React.CSSProperties {
  return {
    width: '100%',
    padding: '10px 12px',
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.md,
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
    background: theme.colors.surface,
    color: theme.colors.text,
    fontFamily: theme.fonts.body,
  };
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
    zIndex: 10001,
  };
}
