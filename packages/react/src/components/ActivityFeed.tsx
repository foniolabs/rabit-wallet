/**
 * ActivityFeed — drop-in component listing your recent transactions.
 * Uses useActivity() under the hood.
 */

import { useActivity, type ActivityEntry } from '../hooks/useActivity.js';
import { useTheme } from '../theme.js';

export interface ActivityFeedProps {
  /** Filter by ecosystem. Defaults to all. */
  ecosystem?: 'evm' | 'solana';
  /** How many entries to show. Default 10. */
  limit?: number;
  /** Show the "Clear" link. Default false (footgun on prod). */
  showClear?: boolean;
}

export function ActivityFeed({ ecosystem, limit = 10, showClear = false }: ActivityFeedProps) {
  const theme = useTheme();
  const { entries, isLoading, refresh, clear } = useActivity();

  const filtered = ecosystem
    ? entries.filter((e) => e.ecosystem === ecosystem)
    : entries;
  const visible = filtered.slice(0, limit);

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span
          style={{
            fontSize: 12,
            color: theme.colors.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          Activity
        </span>
        <div style={{ display: 'flex', gap: 12 }}>

          {showClear && entries.length > 0 && (
            <button onClick={clear} style={linkBtn(theme)}>Clear</button>
          )}
        </div>
      </div>

      {visible.length === 0 ? (
        <p style={{ fontSize: 13, color: theme.colors.textMuted, margin: 0 }}>
          No activity yet. Send a token, sign a memo, or run an approval to populate this list.
        </p>
      ) : (
        <div style={{ display: 'grid', gap: 4 }}>
          {visible.map((e) => (
            <Row key={e.id} entry={e} />
          ))}
        </div>
      )}
    </div>
  );
}

function Row({ entry }: { entry: ActivityEntry }) {
  const theme = useTheme();
  const Wrapper: React.ElementType = entry.explorerUrl ? 'a' : 'div';

  return (
    <Wrapper
      {...(entry.explorerUrl
        ? { href: entry.explorerUrl, target: '_blank', rel: 'noreferrer' }
        : {})}
      onMouseEnter={(e: React.MouseEvent) => { (e.currentTarget as HTMLElement).style.background = theme.colors.surfaceMuted; }}
      onMouseLeave={(e: React.MouseEvent) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 8,
        padding: '10px 8px',
        borderBottom: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.sm,
        background: 'transparent',
        textDecoration: 'none',
        color: theme.colors.text,
        transition: 'background 0.15s ease',
        cursor: entry.explorerUrl ? 'pointer' : 'default',
      }}
    >
      <div style={{ display: 'grid', gap: 2, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={kindBadge(entry.kind, theme)}>{kindLabel(entry.kind)}</span>
          <span style={{ fontSize: 13, fontWeight: 500, color: theme.colors.text }}>
            {entry.title}
          </span>
        </div>
        {entry.subtitle && (
          <span style={{ fontSize: 11, color: theme.colors.textSecondary }}>{entry.subtitle}</span>
        )}
      </div>
      <div style={{ textAlign: 'right', fontSize: 11, color: theme.colors.textMuted, whiteSpace: 'nowrap' }}>
        <div>{relativeTime(entry.timestamp)}</div>
        <div style={{ textTransform: 'uppercase' }}>{entry.ecosystem}</div>
      </div>
    </Wrapper>
  );
}

function kindLabel(kind: string): string {
  return (
    {
      send_native: 'send',
      send_token: 'send',
      approve: 'approve',
      swap: 'swap',
      memo: 'memo',
      contract_call: 'call',
      sign_message: 'sign',
      on_chain: 'on-chain',
    } as Record<string, string>
  )[kind] ?? kind;
}

function kindBadge(kind: string, theme: ReturnType<typeof useTheme>): React.CSSProperties {
  const color =
    kind === 'swap'
      ? theme.colors.accent
      : kind === 'approve'
        ? theme.colors.warning
        : theme.colors.textMuted;
  return {
    fontSize: 9,
    fontWeight: 600,
    padding: '2px 6px',
    borderRadius: 999,
    border: `1px solid ${color}`,
    color,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  };
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(ts).toLocaleDateString();
}

function linkBtn(theme: ReturnType<typeof useTheme>): React.CSSProperties {
  return {
    background: 'transparent',
    border: 'none',
    color: theme.colors.textSecondary,
    fontSize: 12,
    cursor: 'pointer',
    textDecoration: 'underline',
  };
}
