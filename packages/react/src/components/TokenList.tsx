/**
 * TokenList — shows the active chain's tokens with live balances and a Send
 * button per row. Send opens <SendModal />.
 */

import { useState } from 'react';
import { useBalances, type UnifiedBalance } from '../hooks/useBalances.js';
import { useChains } from '../hooks/useChains.js';
import { useSolanaChains } from '../hooks/useSolanaChains.js';
import { useCustomTokens } from '../hooks/useCustomTokens.js';
import { useRabitContext } from '../provider.js';
import { useTheme } from '../theme.js';
import { SendModal } from './SendModal.js';

export interface TokenListProps {
  /** Hide tokens whose balance is 0. Default false. */
  hideZeroBalances?: boolean;
}

export function TokenList({ hideZeroBalances = false }: TokenListProps) {
  const theme = useTheme();
  const { balances, isLoading, error, refresh, ecosystem } = useBalances();
  const { activeChain: activeEvm } = useChains();
  const { activeChain: activeSol } = useSolanaChains();
  const [sendingToken, setSendingToken] = useState<UnifiedBalance | null>(null);

  const activeChainName =
    ecosystem === 'evm'
      ? activeEvm?.name
      : ecosystem === 'solana'
        ? activeSol?.name
        : null;

  if (!ecosystem) {
    return (
      <div style={{ color: theme.colors.textMuted, fontSize: 13 }}>
        Sign in to see your tokens.
      </div>
    );
  }

  const visible = hideZeroBalances ? balances.filter((b) => b.raw > 0n) : balances;

  return (
    <div style={{ display: 'grid', gap: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 0 8px' }}>
        <span style={{ fontSize: 12, color: theme.colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {ecosystem === 'evm' ? 'EVM tokens' : 'Solana tokens'}
          {activeChainName && (
            <span style={{ marginLeft: 8, color: theme.colors.text, textTransform: 'none', letterSpacing: 0 }}>
              · {activeChainName}
            </span>
          )}
        </span>

      </div>

      {error && (
        <div style={{ color: theme.colors.error, fontSize: 12, padding: '8px 0' }}>{error.message}</div>
      )}

      {visible.length === 0 && !isLoading && !error && (
        <div style={{ color: theme.colors.textMuted, fontSize: 13, padding: '12px 0' }}>
          No tokens to display{hideZeroBalances ? ' (all zero balances hidden)' : ''}.
        </div>
      )}

      {visible.map((b, i) => (
        <div
          key={`${b.ecosystem}-${b.address ?? 'native'}-${b.symbol}`}
          onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = theme.colors.surfaceMuted; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
          onClick={() => setSendingToken(b)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 8px',
            borderBottom: i < visible.length - 1 ? `1px solid ${theme.colors.border}` : 'none',
            background: 'transparent',
            cursor: 'pointer',
            transition: 'background 0.15s ease',
            borderRadius: theme.radius.sm,
          }}
        >
          {/* Token Icon */}
          <div style={{
            width: 36, height: 36, borderRadius: 999,
            background: `${theme.colors.primary}25`,
            color: theme.colors.primary,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 700, flexShrink: 0,
          }}>
            {b.symbol?.[0]?.toUpperCase() ?? '?'}
          </div>
          {/* Name/Symbol */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: theme.colors.text }}>
              {b.symbol}
              {b.address === null && (
                <span
                  style={{
                    marginLeft: 8,
                    fontSize: 9,
                    padding: '2px 6px',
                    borderRadius: 999,
                    background: theme.colors.surfaceMuted,
                    color: theme.colors.textSecondary,
                    fontWeight: 500,
                  }}
                >
                  NATIVE
                </span>
              )}
            </div>
            <div style={{ fontSize: 12, color: theme.colors.textSecondary }}>{b.name}</div>
          </div>
          {/* Balance */}
          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                fontFamily: theme.fonts.monospace,
                fontSize: 14,
                color: theme.colors.text,
                fontWeight: 500,
              }}
            >
              {formatAmount(b.formatted)}
            </div>
          </div>
        </div>
      ))}

      <ImportTokenForm onImported={refresh} />

      <SendModal
        isOpen={!!sendingToken}
        token={sendingToken}
        onClose={() => setSendingToken(null)}
        onSent={() => {
          setSendingToken(null);
          refresh();
        }}
      />
    </div>
  );
}

function ImportTokenForm({ onImported }: { onImported: () => void }) {
  const theme = useTheme();
  const { wallet } = useRabitContext();
  const { activeChain: activeEvm } = useChains();
  const { activeChain: activeSol } = useSolanaChains();
  const { importEvm, importSolana } = useCustomTokens();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ecosystem = wallet.activeAccount?.ecosystem;
  if (!ecosystem) return null;

  const placeholder =
    ecosystem === 'evm' ? 'Token contract address (0x...)' : 'Token mint address';

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      if (ecosystem === 'evm') {
        if (!activeEvm) throw new Error('No active EVM chain');
        if (!/^0x[0-9a-fA-F]{40}$/.test(value.trim())) {
          throw new Error('That doesn\'t look like a valid EVM address');
        }
        await importEvm({
          chainId: activeEvm.id,
          address: value.trim() as `0x${string}`,
        });
      } else {
        if (!activeSol) throw new Error('No active Solana chain');
        if (value.trim().length < 32 || value.trim().length > 44) {
          throw new Error('That doesn\'t look like a valid Solana mint');
        }
        await importSolana({
          cluster: activeSol.cluster,
          mint: value.trim(),
          rpcUrl: activeSol.rpcUrl,
        });
      }
      setValue('');
      setOpen(false);
      onImported();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed');
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          width: '100%',
          padding: '14px 16px',
          border: 'none',
          borderRadius: theme.radius.md,
          background: 'transparent',
          color: theme.colors.primary,
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          fontFamily: theme.fonts.body,
          transition: 'background 0.15s ease',
          marginTop: 4,
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = theme.colors.surfaceMuted; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Import token
      </button>
    );
  }

  return (
    <div
      style={{
        padding: 16,
        borderRadius: theme.radius.md,
        background: theme.colors.surfaceMuted,
        display: 'grid',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: theme.colors.text }}>Import token</span>
        <button
          onClick={() => { setOpen(false); setValue(''); setError(null); }}
          disabled={busy}
          style={{
            border: 'none',
            background: 'transparent',
            color: theme.colors.textSecondary,
            cursor: 'pointer',
            padding: 4,
            fontSize: 18,
            lineHeight: 1,
            fontFamily: theme.fonts.body,
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ position: 'relative' }}>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme.colors.textMuted}
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          style={{
            width: '100%',
            padding: '12px 12px 12px 38px',
            border: `1.5px solid ${theme.colors.border}`,
            borderRadius: theme.radius.md,
            fontSize: 13,
            fontFamily: theme.fonts.monospace,
            background: theme.colors.surface,
            color: theme.colors.text,
            boxSizing: 'border-box',
            outline: 'none',
            transition: 'border-color 0.15s ease',
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = theme.colors.primary; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = theme.colors.border; }}
        />
      </div>

      {error && <div style={{ color: theme.colors.error, fontSize: 12, padding: '0 4px' }}>{error}</div>}

      <button
        onClick={submit}
        disabled={busy || !value.trim()}
        style={{
          width: '100%',
          padding: '12px 16px',
          border: 'none',
          borderRadius: theme.radius.md,
          background: busy || !value.trim() ? theme.colors.surfaceMuted : theme.colors.primary,
          color: busy || !value.trim() ? theme.colors.textMuted : theme.colors.primaryText,
          fontSize: 14,
          fontWeight: 600,
          cursor: busy ? 'not-allowed' : 'pointer',
          fontFamily: theme.fonts.body,
          transition: 'background 0.15s ease, opacity 0.15s ease',
        }}
      >
        {busy ? 'Importing…' : 'Import'}
      </button>
    </div>
  );
}

function formatAmount(s: string): string {
  const n = parseFloat(s);
  if (Number.isNaN(n)) return s;
  if (n === 0) return '0';
  if (n < 0.0001) return n.toExponential(2);
  return n.toLocaleString(undefined, { maximumFractionDigits: 6 });
}
