/**
 * NetworkSwitcher — EVM/Solana tabs, mainnet/testnet toggle, chain picker,
 * custom-chain form.
 *
 * Reads the chain list from the SDK (whatever the developer registered via
 * `RabitConfig.evmChains` / `solanaChains` or the `addChain()` runtime APIs).
 */

import { useMemo, useState } from 'react';
import type { EvmChain, SolanaChain, SolanaCluster } from '@rabit/types';
import { useChains } from '../hooks/useChains.js';
import { useSolanaChains } from '../hooks/useSolanaChains.js';
import { useWallet } from '../hooks/useWallet.js';
import { useTheme } from '../theme.js';

export interface NetworkSwitcherProps {
  /** Show the "add custom chain" form. Defaults to true. */
  allowAddChain?: boolean;
  /** Restrict visible EVM chains to a subset. Defaults to all registered. */
  evmChains?: EvmChain[];
  /** Restrict visible Solana chains to a subset. Defaults to all registered. */
  solanaChains?: SolanaChain[];
  /** Which ecosystem tabs to show. Defaults to whichever has registered chains. */
  ecosystems?: Array<'evm' | 'solana'>;
}

type Mode = 'mainnet' | 'testnet';

export function NetworkSwitcher({
  allowAddChain = true,
  evmChains: overrideEvm,
  solanaChains: overrideSolana,
  ecosystems,
}: NetworkSwitcherProps) {
  const evm = useChains();
  const solana = useSolanaChains();
  const { activeAccount } = useWallet();
  const currentEcosystem = activeAccount?.ecosystem;

  const evmAvailable = (overrideEvm ?? evm.chains).length > 0;
  const solanaAvailable = (overrideSolana ?? solana.chains).length > 0;

  const tabs = useMemo<Array<'evm' | 'solana'>>(() => {
    if (ecosystems && ecosystems.length > 0) return ecosystems;
    const list: Array<'evm' | 'solana'> = [];
    if (evmAvailable) list.push('evm');
    if (solanaAvailable) list.push('solana');
    return list;
  }, [ecosystems, evmAvailable, solanaAvailable]);

  const [tab, setTab] = useState<'evm' | 'solana'>(tabs[0] ?? 'evm');
  const theme = useTheme();

  if (tabs.length === 0) {
    return (
      <div style={{ fontSize: 13, color: theme.colors.textMuted ?? theme.colors.textSecondary }}>
        No chains registered. Pass <code>evmChains</code> or <code>solanaChains</code> to RabitProvider.
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {tabs.length > 1 && (
        <div style={{ display: 'inline-flex', borderRadius: 999, background: theme.colors.surfaceMuted, padding: 4 }}>
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                if (t === 'evm' && currentEcosystem !== 'evm') {
                  const id = evm.activeChainId ?? evm.chains[0]?.id;
                  if (id) evm.switchChain(id);
                } else if (t === 'solana' && currentEcosystem !== 'solana') {
                  const slug = solana.activeSlug ?? solana.chains[0]?.slug;
                  if (slug) solana.switchChain(slug);
                }
              }}
              style={{
                border: 'none',
                borderRadius: 999,
                padding: '8px 18px',
                fontSize: 14,
                cursor: 'pointer',
                fontWeight: 600,
                background: tab === t ? theme.colors.primary : 'transparent',
                color: tab === t ? theme.colors.primaryText : theme.colors.textSecondary,
                transition: 'all 0.15s ease',
              }}
            >
              {t === 'evm' ? 'EVM' : 'Solana'}
            </button>
          ))}
        </div>
      )}

      {tab === 'evm' && (
        <EvmSection
          chains={overrideEvm ?? evm.chains}
          activeChainId={evm.activeChainId}
          switchChain={evm.switchChain}
          addChain={evm.addChain}
          allowAddChain={allowAddChain}
        />
      )}

      {tab === 'solana' && (
        <SolanaSection
          chains={overrideSolana ?? solana.chains}
          activeSlug={solana.activeSlug}
          switchChain={solana.switchChain}
          addChain={solana.addChain}
          allowAddChain={allowAddChain}
        />
      )}
    </div>
  );
}

// ───────── EVM section ─────────

function EvmSection({
  chains,
  activeChainId,
  switchChain,
  addChain,
  allowAddChain,
}: {
  chains: EvmChain[];
  activeChainId: number | null;
  switchChain: (id: number) => void;
  addChain: (c: EvmChain) => void;
  allowAddChain: boolean;
}) {
  const { activeAccount } = useWallet();
  const currentEcosystem = activeAccount?.ecosystem;

  const theme = useTheme();

  const activeChain = useMemo(
    () => chains.find((c) => c.id === activeChainId) ?? null,
    [chains, activeChainId]
  );

  const [mode, setMode] = useState<Mode>(() => (activeChain?.testnet ? 'testnet' : 'mainnet'));

  const visible = useMemo(
    () => chains.filter((c) => (mode === 'testnet' ? c.testnet === true : c.testnet !== true)),
    [chains, mode]
  );

  const handleSwitch = (id: number) => {
    try {
      switchChain(id);
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : 'Failed to switch chain');
    }
  };

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <ModeToggle mode={mode} onChange={setMode} theme={theme} />
      <div style={{ display: 'grid', gap: 6 }}>
        {visible.length === 0 && (
          <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>
            No {mode} EVM chains registered.{allowAddChain ? ' Add one below.' : ''}
          </div>
        )}
        {visible.map((chain) => {
          const isActive = chain.id === activeChainId && currentEcosystem === 'evm';
          return (
            <button
              key={chain.id}
              onClick={() => handleSwitch(chain.id)}
              disabled={isActive}
              onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = theme.colors.surfaceMuted; }}
              onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = theme.colors.surface; }}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 14px', border: `1px solid ${isActive ? theme.colors.primary + '40' : theme.colors.border}`,
                borderRadius: 12, fontSize: 14, textAlign: 'left' as const,
                background: theme.colors.surface,
                cursor: isActive ? 'default' : 'pointer',
                fontWeight: isActive ? 600 : 400,
                color: theme.colors.text,
                transition: 'background 0.15s ease, border-color 0.15s ease',
              }}
              title={`Chain ID ${chain.id}`}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {isActive && <span style={{ width: 8, height: 8, borderRadius: 999, background: theme.colors.success }} />}
                <span>{chain.name}</span>
              </div>
              <span style={{ fontSize: 11, color: theme.colors.textSecondary }}>#{chain.id}</span>
            </button>
          );
        })}
      </div>

      {allowAddChain && <AddEvmChainForm onAdd={addChain} theme={theme} />}
    </div>
  );
}

function AddEvmChainForm({ onAdd, theme }: { onAdd: (chain: EvmChain) => void; theme: any }) {
  const [open, setOpen] = useState(false);
  const [chainId, setChainId] = useState('');
  const [name, setName] = useState('');
  const [rpcUrl, setRpcUrl] = useState('');
  const [symbol, setSymbol] = useState('ETH');
  const [explorer, setExplorer] = useState('');
  const [testnet, setTestnet] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputStyle: React.CSSProperties = { padding: '8px 10px', border: `1px solid ${theme.colors.border}`, borderRadius: 6, fontSize: 14, background: theme.colors.surface, color: theme.colors.text };

  if (!open) {
    return (
      <button style={{ padding: '8px 12px', border: `1px dashed ${theme.colors.border}`, borderRadius: 8, background: theme.colors.surface, color: theme.colors.textSecondary, fontSize: 13, cursor: 'pointer', textAlign: 'center' }} onClick={() => setOpen(true)}>
        + Add custom EVM chain
      </button>
    );
  }

  const submit = () => {
    setError(null);
    const id = parseInt(chainId, 10);
    if (!id || Number.isNaN(id)) return setError('Chain ID must be a number');
    if (!name.trim() || !rpcUrl.trim()) return setError('Name and RPC URL are required');

    onAdd({
      ecosystem: 'evm',
      id,
      name: name.trim(),
      slug: name.trim().toLowerCase().replace(/\s+/g, '-'),
      nativeCurrency: { name: symbol, symbol, decimals: 18 },
      rpcUrls: { default: [{ url: rpcUrl.trim() }] },
      blockExplorers: explorer.trim()
        ? { default: { name: 'Explorer', url: explorer.trim() } }
        : undefined,
      testnet,
    });

    setOpen(false);
    setChainId(''); setName(''); setRpcUrl(''); setSymbol('ETH'); setExplorer(''); setTestnet(false);
  };

  return (
    <div style={{ marginTop: 4, padding: 12, border: `1px solid ${theme.colors.border}`, borderRadius: 8, background: theme.colors.surfaceMuted }}>
      <div style={{ display: 'grid', gap: 8 }}>
        <Field label="Chain ID" theme={theme}>
          <input value={chainId} onChange={(e) => setChainId(e.target.value)} placeholder="e.g. 56" style={inputStyle} />
        </Field>
        <Field label="Name" theme={theme}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. BNB Smart Chain" style={inputStyle} />
        </Field>
        <Field label="RPC URL" theme={theme}>
          <input value={rpcUrl} onChange={(e) => setRpcUrl(e.target.value)} placeholder="https://…" style={inputStyle} />
        </Field>
        <Field label="Native symbol" theme={theme}>
          <input value={symbol} onChange={(e) => setSymbol(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Block explorer (optional)" theme={theme}>
          <input value={explorer} onChange={(e) => setExplorer(e.target.value)} placeholder="https://…" style={inputStyle} />
        </Field>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: theme.colors.text }}>
          <input type="checkbox" checked={testnet} onChange={(e) => setTestnet(e.target.checked)} />
          This is a testnet
        </label>
        {error && <div style={{ color: theme.colors.error ?? '#c00', fontSize: 12 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={submit} style={{ padding: '8px 14px', border: 'none', borderRadius: 6, background: theme.colors.primary, color: theme.colors.primaryText ?? '#fff', cursor: 'pointer', fontSize: 13 }}>Add chain</button>
          <button onClick={() => setOpen(false)} style={{ padding: '8px 14px', border: `1px solid ${theme.colors.border}`, borderRadius: 6, background: theme.colors.surface, color: theme.colors.text, cursor: 'pointer', fontSize: 13 }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ───────── Solana section ─────────

function SolanaSection({
  chains,
  activeSlug,
  switchChain,
  addChain,
  allowAddChain,
}: {
  chains: SolanaChain[];
  activeSlug: string | null;
  switchChain: (slug: string) => void;
  addChain: (c: SolanaChain) => void;
  allowAddChain: boolean;
}) {
  const { activeAccount } = useWallet();
  const currentEcosystem = activeAccount?.ecosystem;

  const theme = useTheme();

  const activeChain = useMemo(
    () => chains.find((c) => c.slug === activeSlug) ?? null,
    [chains, activeSlug]
  );

  const [mode, setMode] = useState<Mode>(() =>
    activeChain && activeChain.cluster !== 'mainnet-beta' ? 'testnet' : 'mainnet'
  );

  const visible = useMemo(
    () =>
      chains.filter((c) =>
        mode === 'testnet' ? c.cluster !== 'mainnet-beta' : c.cluster === 'mainnet-beta'
      ),
    [chains, mode]
  );

  const handleSwitch = (slug: string) => {
    try {
      switchChain(slug);
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : 'Failed to switch chain');
    }
  };

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <ModeToggle mode={mode} onChange={setMode} theme={theme} />
      <div style={{ display: 'grid', gap: 6 }}>
        {visible.length === 0 && (
          <div style={{ fontSize: 13, color: theme.colors.textSecondary }}>
            No {mode} Solana chains registered.{allowAddChain ? ' Add one below.' : ''}
          </div>
        )}
        {visible.map((chain) => {
          const isActive = chain.slug === activeSlug && currentEcosystem === 'solana';
          return (
            <button
              key={chain.slug}
              onClick={() => handleSwitch(chain.slug)}
              disabled={isActive}
              onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = theme.colors.surfaceMuted; }}
              onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = theme.colors.surface; }}
              style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 14px', border: `1px solid ${isActive ? theme.colors.primary + '40' : theme.colors.border}`,
                borderRadius: 12, fontSize: 14, textAlign: 'left' as const,
                background: theme.colors.surface,
                cursor: isActive ? 'default' : 'pointer',
                fontWeight: isActive ? 600 : 400,
                color: theme.colors.text,
                transition: 'background 0.15s ease, border-color 0.15s ease',
              }}
              title={`Cluster: ${chain.cluster}`}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {isActive && <span style={{ width: 8, height: 8, borderRadius: 999, background: theme.colors.success }} />}
                <span>{chain.name}</span>
              </div>
              <span style={{ fontSize: 11, color: theme.colors.textSecondary }}>{chain.cluster}</span>
            </button>
          );
        })}
      </div>

      {allowAddChain && <AddSolanaChainForm onAdd={addChain} theme={theme} />}
    </div>
  );
}

function AddSolanaChainForm({ onAdd, theme }: { onAdd: (chain: SolanaChain) => void; theme: any }) {
  const [open, setOpen] = useState(false);
  const [cluster, setCluster] = useState<SolanaCluster>('mainnet-beta');
  const [name, setName] = useState('');
  const [rpcUrl, setRpcUrl] = useState('');
  const [explorer, setExplorer] = useState('');
  const [error, setError] = useState<string | null>(null);

  const inputStyle: React.CSSProperties = { padding: '8px 10px', border: `1px solid ${theme.colors.border}`, borderRadius: 6, fontSize: 14, background: theme.colors.surface, color: theme.colors.text };

  if (!open) {
    return (
      <button style={{ padding: '8px 12px', border: `1px dashed ${theme.colors.border}`, borderRadius: 8, background: theme.colors.surface, color: theme.colors.textSecondary, fontSize: 13, cursor: 'pointer', textAlign: 'center' }} onClick={() => setOpen(true)}>
        + Add custom Solana RPC
      </button>
    );
  }

  const submit = () => {
    setError(null);
    if (!name.trim() || !rpcUrl.trim()) return setError('Name and RPC URL are required');

    onAdd({
      ecosystem: 'solana',
      cluster,
      name: name.trim(),
      slug: name.trim().toLowerCase().replace(/\s+/g, '-'),
      nativeCurrency: { name: 'Solana', symbol: 'SOL', decimals: 9 },
      rpcUrl: rpcUrl.trim(),
      blockExplorer: explorer.trim()
        ? { name: 'Explorer', url: explorer.trim() }
        : undefined,
    });

    setOpen(false);
    setCluster('mainnet-beta'); setName(''); setRpcUrl(''); setExplorer('');
  };

  return (
    <div style={{ marginTop: 4, padding: 12, border: `1px solid ${theme.colors.border}`, borderRadius: 8, background: theme.colors.surfaceMuted }}>
      <div style={{ display: 'grid', gap: 8 }}>
        <Field label="Cluster" theme={theme}>
          <select value={cluster} onChange={(e) => setCluster(e.target.value as SolanaCluster)} style={inputStyle}>
            <option value="mainnet-beta">mainnet-beta</option>
            <option value="devnet">devnet</option>
            <option value="testnet">testnet</option>
          </select>
        </Field>
        <Field label="Name" theme={theme}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Helius Mainnet" style={inputStyle} />
        </Field>
        <Field label="RPC URL" theme={theme}>
          <input value={rpcUrl} onChange={(e) => setRpcUrl(e.target.value)} placeholder="https://…" style={inputStyle} />
        </Field>
        <Field label="Block explorer (optional)" theme={theme}>
          <input value={explorer} onChange={(e) => setExplorer(e.target.value)} placeholder="https://…" style={inputStyle} />
        </Field>
        {error && <div style={{ color: theme.colors.error ?? '#c00', fontSize: 12 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={submit} style={{ padding: '8px 14px', border: 'none', borderRadius: 6, background: theme.colors.primary, color: theme.colors.primaryText ?? '#fff', cursor: 'pointer', fontSize: 13 }}>Add chain</button>
          <button onClick={() => setOpen(false)} style={{ padding: '8px 14px', border: `1px solid ${theme.colors.border}`, borderRadius: 6, background: theme.colors.surface, color: theme.colors.text, cursor: 'pointer', fontSize: 13 }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ───────── Shared ─────────

function ModeToggle({ mode, onChange, theme }: { mode: Mode; onChange: (m: Mode) => void; theme: any }) {
  return (
    <div style={{ display: 'inline-flex', borderRadius: 999, background: theme.colors.surfaceMuted, padding: 4, width: 'fit-content' }}>
      {(['mainnet', 'testnet'] as const).map((m) => (
        <button
          key={m}
          onClick={() => onChange(m)}
          style={{
            border: 'none',
            borderRadius: 999,
            padding: '6px 14px',
            fontSize: 13,
            cursor: 'pointer',
            fontWeight: 500,
            background: mode === m ? theme.colors.primary : 'transparent',
            color: mode === m ? (theme.colors.primaryText ?? '#fff') : theme.colors.textSecondary,
            transition: 'all 0.15s ease',
          }}
        >
          {m === 'mainnet' ? 'Mainnet' : 'Testnet'}
        </button>
      ))}
    </div>
  );
}

function Field({ label, children, theme }: { label: string; children: React.ReactNode; theme: any }) {
  return (
    <label style={{ display: 'grid', gap: 4, fontSize: 12, color: theme.colors.textSecondary }}>
      {label}
      {children}
    </label>
  );
}
