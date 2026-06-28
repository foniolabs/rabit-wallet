/**
 * PrivateKeyExport — reveal & copy the user's EVM EOA private key and the
 * Solana secret key, in formats other wallets can import.
 *
 * Defaults to hidden behind a confirmation tap, with a warning banner. The
 * SDK never persists these strings; they live only in component state while
 * revealed, and clear when the user clicks "Hide".
 */

import { useState } from 'react';
import { useRabitContext } from '../provider.js';
import { useWallet } from '../hooks/useWallet.js';
import { PinPad } from './PinPad.js';
import { useTheme, type ResolvedTheme } from '../theme.js';

export interface PrivateKeyExportProps {
  /** Show only EVM, only Solana, or both (default). */
  ecosystems?: Array<'evm' | 'solana'>;
}

type SolanaFormat = 'base58' | 'array';

export function PrivateKeyExport({ ecosystems = ['evm', 'solana'] }: PrivateKeyExportProps) {
  const { core } = useRabitContext();
  const { isReady, hasPin } = useWallet();
  const theme = useTheme();
  const [pinVerified, setPinVerified] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!isReady) {
    return (
      <div style={{ fontSize: 13, color: theme.colors.textMuted }}>
        Sign in to export your private keys.
      </div>
    );
  }

  // If the user has a PIN, require it before showing any keys.
  if (hasPin && !pinVerified) {
    const verify = async (entered: string) => {
      setBusy(true);
      setPinError(null);
      try {
        // Re-unlock validates the PIN against the vault without losing in-memory keys.
        await core.unlock(entered);
        setPinVerified(true);
      } catch (e) {
        setPinError(e instanceof Error ? e.message : 'Wrong PIN');
        setPin('');
      } finally {
        setBusy(false);
      }
    };

    return (
      <div style={{ display: 'grid', gap: 16 }}>
        <div style={{ fontSize: 13, color: theme.colors.textSecondary, textAlign: 'center' }}>
          Enter your PIN to reveal your private keys.
        </div>
        <PinPad value={pin} onChange={setPin} onComplete={verify} disabled={busy} />
        {pinError && (
          <div style={{ color: theme.colors.error, fontSize: 13, textAlign: 'center' }}>
            {pinError}
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={warningBanner(theme)}>
        <strong>Never share your private key.</strong>
        <span style={{ color: theme.colors.warning }}>
          Anyone with this string can drain your wallet. Don't paste it into websites,
          DMs, screenshots, or extensions you don't fully trust. Store it in a
          password manager.
        </span>
      </div>

      {ecosystems.includes('evm') && <EvmExportRow />}
      {ecosystems.includes('solana') && <SolanaExportRow />}
    </div>
  );
}

function EvmExportRow() {
  const { core } = useRabitContext();
  const [revealed, setRevealed] = useState(false);
  const [value, setValue] = useState<string | null>(null);

  const reveal = () => {
    const pk = core.exportEvmPrivateKey();
    if (!pk) return;
    setValue(pk);
    setRevealed(true);
  };

  const hide = () => {
    setValue(null);
    setRevealed(false);
  };

  return (
    <ExportRow
      title="EVM private key"
      subtitle="Hex format. Importable into MetaMask, Rabby, Frame."
      revealed={revealed}
      value={value}
      onReveal={reveal}
      onHide={hide}
    />
  );
}

function SolanaExportRow() {
  const { core } = useRabitContext();
  const theme = useTheme();
  const [revealed, setRevealed] = useState(false);
  const [value, setValue] = useState<string | null>(null);
  const [format, setFormat] = useState<SolanaFormat>('base58');

  const reveal = (fmt: SolanaFormat) => {
    setFormat(fmt);
    if (fmt === 'array') {
      const arr = core.exportSolanaPrivateKeyArray();
      if (!arr) return;
      setValue(JSON.stringify(arr));
    } else {
      const pk = core.exportSolanaPrivateKey();
      if (!pk) return;
      setValue(pk);
    }
    setRevealed(true);
  };

  const hide = () => {
    setValue(null);
    setRevealed(false);
  };

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <ExportRow
        title="Solana secret key"
        subtitle={
          format === 'base58'
            ? 'Base58 format. Importable into Phantom, Solflare, Backpack.'
            : 'JSON byte array (64 bytes). Solana CLI keypair format.'
        }
        revealed={revealed}
        value={value}
        onReveal={() => reveal(format)}
        onHide={hide}
      />
      {!revealed && (
        <div style={{ display: 'flex', gap: 8, fontSize: 12, color: theme.colors.textSecondary, alignItems: 'center' }}>
          <span>Format:</span>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <input type="radio" name="sol-fmt" checked={format === 'base58'} onChange={() => setFormat('base58')} />
            base58 (Phantom)
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <input type="radio" name="sol-fmt" checked={format === 'array'} onChange={() => setFormat('array')} />
            byte array (CLI)
          </label>
        </div>
      )}
    </div>
  );
}

function ExportRow({
  title,
  subtitle,
  revealed,
  value,
  onReveal,
  onHide,
}: {
  title: string;
  subtitle: string;
  revealed: boolean;
  value: string | null;
  onReveal: () => void;
  onHide: () => void;
}) {
  const theme = useTheme();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch (e) {
      console.error('Clipboard write failed', e);
    }
  };

  return (
    <div style={card(theme)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, color: theme.colors.text }}>{title}</div>
          <div style={{ fontSize: 12, color: theme.colors.textSecondary }}>{subtitle}</div>
        </div>
        {!revealed ? (
          <button onClick={onReveal} style={primaryButton(theme)}>Reveal</button>
        ) : (
          <button onClick={onHide} style={secondaryButton(theme)}>Hide</button>
        )}
      </div>

      {revealed && value && (
        <div style={{ marginTop: 12 }}>
          <textarea
            readOnly
            value={value}
            onFocus={(e) => e.currentTarget.select()}
            style={textArea(theme)}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6 }}>
            <button onClick={copy} style={secondaryButton(theme)}>
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ───────── Styles ─────────

function warningBanner(theme: ResolvedTheme): React.CSSProperties {
  return {
    display: 'grid',
    gap: 4,
    background: `${theme.colors.warning}15`,
    border: `1px solid ${theme.colors.warning}40`,
    padding: 12,
    borderRadius: 8,
    fontSize: 13,
    color: theme.colors.warning,
  };
}

function card(theme: ResolvedTheme): React.CSSProperties {
  return {
    border: `1px solid ${theme.colors.border}`,
    borderRadius: 8,
    padding: 12,
    background: theme.colors.surface,
  };
}

function primaryButton(theme: ResolvedTheme): React.CSSProperties {
  return {
    padding: '6px 12px',
    border: 'none',
    borderRadius: 6,
    background: theme.colors.primary,
    color: theme.colors.primaryText,
    cursor: 'pointer',
    fontSize: 12,
  };
}

function secondaryButton(theme: ResolvedTheme): React.CSSProperties {
  return {
    padding: '6px 12px',
    border: `1px solid ${theme.colors.border}`,
    borderRadius: 6,
    background: theme.colors.surface,
    color: theme.colors.text,
    cursor: 'pointer',
    fontSize: 12,
  };
}

function textArea(theme: ResolvedTheme): React.CSSProperties {
  return {
    width: '100%',
    minHeight: 70,
    padding: 8,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: 6,
    fontFamily: theme.fonts.monospace,
    fontSize: 12,
    wordBreak: 'break-all',
    resize: 'vertical',
    background: theme.colors.surfaceMuted,
    color: theme.colors.text,
  };
}
