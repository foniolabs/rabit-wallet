/**
 * PortfolioTotal — big USD total for the active account's tokens.
 * Drop-in component for the dashboard.
 */

import { usePortfolioTotal } from '../hooks/usePortfolioTotal.js';
import { useTheme } from '../theme.js';

export interface PortfolioTotalProps {
  /** Show the per-asset breakdown below the headline. Default true. */
  showBreakdown?: boolean;
}

export function PortfolioTotal({ showBreakdown = true }: PortfolioTotalProps) {
  const theme = useTheme();
  const { totalUsd, breakdown, isLoading } = usePortfolioTotal();

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <div
        style={{
          fontSize: 12,
          color: theme.colors.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        Total balance
      </div>
      <div
        style={{
          fontSize: 32,
          fontWeight: 700,
          color: theme.colors.text,
          fontFamily: theme.fonts.body,
          letterSpacing: '-0.02em',
        }}
      >
        {totalUsd == null ? (
          <span style={{ color: theme.colors.textMuted, fontSize: 18 }}>
            {isLoading ? 'Loading…' : '—'}
          </span>
        ) : (
          formatUsd(totalUsd)
        )}
      </div>

      {showBreakdown && breakdown.length > 0 && (
        <div style={{ display: 'grid', gap: 4, marginTop: 8 }}>
          {breakdown
            .filter((b) => b.amount > 0)
            .sort((a, b) => b.usd - a.usd)
            .map((b) => (
              <div
                key={b.symbol}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 12,
                  color: theme.colors.textSecondary,
                }}
              >
                <span>
                  {b.amount.toLocaleString(undefined, { maximumFractionDigits: 6 })} {b.symbol}
                </span>
                <span>{b.price > 0 ? formatUsd(b.usd) : '—'}</span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

function formatUsd(n: number): string {
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: n < 1 ? 4 : 2,
  });
}
