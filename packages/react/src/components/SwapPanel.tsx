/**
 * SwapPanel — pick "from" and "to" tokens, see live quote, swap.
 *
 * Defaults source token to the active account's first token with non-zero
 * balance. EVM swaps go through LiFi (cross-chain capable); Solana swaps go
 * through Jupiter (mainnet-beta only — Jupiter doesn't support devnet).
 */

import { useEffect, useMemo, useState } from 'react';
import { useTheme } from '../theme.js';
import { useSwap, type SwapTokenSpec } from '../hooks/useSwap.js';
import { useBalances, type UnifiedBalance } from '../hooks/useBalances.js';
import { useChains } from '../hooks/useChains.js';
import { useSolanaChains } from '../hooks/useSolanaChains.js';

export function SwapPanel() {
  const theme = useTheme();
  const { balances, ecosystem } = useBalances();
  const { activeChain: evmChain } = useChains();
  const { activeChain: solanaChain } = useSolanaChains();
  const swap = useSwap();

  const [fromIdx, setFromIdx] = useState(0);
  const [toIdx, setToIdx] = useState(1);
  const [amount, setAmount] = useState('');
  const [result, setResult] = useState<{ hash: string; explorerUrl?: string } | null>(null);

  const tokens = balances;

  // Reset selections when ecosystem flips.
  useEffect(() => {
    setFromIdx(0);
    setToIdx(Math.min(1, Math.max(0, tokens.length - 1)));
    setAmount('');
    swap.reset();
    setResult(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ecosystem]);

  const fromTok = tokens[fromIdx];
  const toTok = tokens[toIdx];

  const handleQuote = async () => {
    if (!fromTok || !toTok || !amount) return;
    setResult(null);
    try {
      await swap.getQuote({
        from: balanceToSpec(fromTok),
        to: balanceToSpec(toTok),
        amount,
      });
    } catch {/* error surfaced */}
  };

  const handleSwap = async () => {
    try {
      const r = await swap.execute();
      setResult(r);
    } catch {/* error surfaced */}
  };

  // Solana caveat: Jupiter is mainnet-only.
  const onSolanaDevnet =
    ecosystem === 'solana' && solanaChain?.cluster !== 'mainnet-beta';

  if (!ecosystem) {
    return <p style={{ color: theme.colors.textMuted, fontSize: 13 }}>Sign in to swap.</p>;
  }
  if (tokens.length < 2) {
    return (
      <p style={{ color: theme.colors.textMuted, fontSize: 13 }}>
        Need at least 2 tokens with balances on this chain to swap.
      </p>
    );
  }
  if (onSolanaDevnet) {
    return (
      <p style={{ color: theme.colors.textMuted, fontSize: 13 }}>
        Jupiter only supports Solana mainnet. Switch to <strong>Solana</strong>{' '}
        in the Network card to use this panel.
      </p>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <Field label="From">
          <select value={fromIdx} onChange={(e) => setFromIdx(Number(e.target.value))} style={input(theme)}>
            {tokens.map((t, i) => (
              <option key={i} value={i}>
                {t.symbol} ({fmtAmount(t.formatted)})
              </option>
            ))}
          </select>
        </Field>
        <Field label="To">
          <select value={toIdx} onChange={(e) => setToIdx(Number(e.target.value))} style={input(theme)}>
            {tokens.map((t, i) => (
              <option key={i} value={i} disabled={i === fromIdx}>
                {t.symbol}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label={`Amount (${fromTok?.symbol ?? ''})`}>
        <div style={{ position: 'relative' }}>
          <input
            type="number"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            style={{ ...input(theme), paddingRight: 56 }}
          />
          {fromTok && (
            <button
              type="button"
              onClick={() => setAmount(fromTok.formatted)}
              style={maxBtn(theme)}
            >
              MAX
            </button>
          )}
        </div>
      </Field>

      <button
        onClick={handleQuote}
        disabled={!fromTok || !toTok || !amount || swap.isQuoting}
        style={primaryBtn(theme)}
      >
        {swap.isQuoting ? 'Getting quote…' : 'Get quote'}
      </button>

      {swap.error && (
        <div style={{ color: theme.colors.error, fontSize: 12 }}>{swap.error.message}</div>
      )}

      {swap.quote && !result && (
        <div
          style={{
            padding: 12,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radius.md,
            background: theme.colors.surfaceMuted,
            display: 'grid',
            gap: 6,
            fontSize: 13,
          }}
        >
          <Row label="You receive" value={`${swap.quote.toAmountFormatted} ${toTok?.symbol ?? ''}`} bold theme={theme} />
          <Row label="Min received" value={`${swap.quote.toAmountMinFormatted} ${toTok?.symbol ?? ''}`} theme={theme} />
          <Row label="Route" value={swap.quote.routeName} theme={theme} />
          {swap.quote.priceImpactPct != null && (
            <Row
              label="Price impact"
              value={`${swap.quote.priceImpactPct.toFixed(3)}%`}
              theme={theme}
            />
          )}
          {swap.quote.gasUsd && (
            <Row label="Est. gas" value={`$${swap.quote.gasUsd}`} theme={theme} />
          )}

          <button
            onClick={handleSwap}
            disabled={swap.isSwapping}
            style={{ ...primaryBtn(theme), marginTop: 6 }}
          >
            {swap.isSwapping ? 'Swapping…' : `Swap ${fromTok?.symbol} → ${toTok?.symbol}`}
          </button>
        </div>
      )}

      {result && (
        <div
          style={{
            padding: 12,
            border: `1px solid ${theme.colors.success}`,
            borderRadius: theme.radius.md,
            background: `${theme.colors.success}15`,
            display: 'grid',
            gap: 8,
            fontSize: 13,
          }}
        >
          <div style={{ color: theme.colors.success, fontWeight: 600 }}>
            ✓ Swap submitted
          </div>
          <div style={{ fontFamily: theme.fonts.monospace, fontSize: 11, wordBreak: 'break-all' }}>
            {result.hash}
          </div>
          {result.explorerUrl && (
            <a
              href={result.explorerUrl}
              target="_blank"
              rel="noreferrer"
              style={{ color: theme.colors.text, fontSize: 13 }}
            >
              View on explorer →
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Helpers ───

function balanceToSpec(b: UnifiedBalance): SwapTokenSpec {
  return {
    address: b.address,
    decimals: b.decimals,
    symbol: b.symbol,
  };
}

function fmtAmount(s: string): string {
  const n = parseFloat(s);
  if (Number.isNaN(n) || n === 0) return '0';
  if (n < 0.0001) return n.toExponential(2);
  return n.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

function Row({
  label,
  value,
  bold,
  theme,
}: {
  label: string;
  value: string;
  bold?: boolean;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ color: theme.colors.textSecondary }}>{label}</span>
      <span style={{ fontWeight: bold ? 600 : 400, color: theme.colors.text }}>{value}</span>
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
    padding: '10px 12px',
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.radius.md,
    fontSize: 14,
    fontFamily: theme.fonts.body,
    background: theme.colors.surface,
    color: theme.colors.text,
  };
}

function primaryBtn(theme: ReturnType<typeof useTheme>): React.CSSProperties {
  return {
    padding: '10px 14px',
    border: 'none',
    borderRadius: theme.radius.md,
    background: theme.colors.primary,
    color: theme.colors.primaryText,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
  };
}

function maxBtn(theme: ReturnType<typeof useTheme>): React.CSSProperties {
  return {
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
  };
}
