/**
 * RabitDashboard — opinionated wallet drawer modeled on MetaMask / Phantom.
 *
 * Layout:
 *   ┌──────────────────────────────────────┐
 *   │ [Network ▾]  [Avatar] 0xabc..  [⋮ ×]│   header
 *   ├──────────────────────────────────────┤
 *   │            $1,234.56                 │
 *   │         on Ethereum                  │   hero
 *   │   [Send] [Swap] [Buy] [Sell]         │
 *   ├──────────────────────────────────────┤
 *   │  Tokens   ·   Activity               │   tab strip
 *   ├──────────────────────────────────────┤
 *   │  • ETH                       0       │
 *   │  • USDC                     20       │   tab body
 *   │  + Import token                      │
 *   └──────────────────────────────────────┘
 *
 * Buy / Sell / Swap / Networks / Settings / Security are sub-views the user
 * navigates into; the back arrow returns to the home view.
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { useWallet } from '../hooks/useWallet.js';
import { useTheme } from '../theme.js';
import { useRabitContext } from '../provider.js';
import { useOnRamp } from '../hooks/useOnRamp.js';
import { usePortfolioTotal } from '../hooks/usePortfolioTotal.js';
import { useChains } from '../hooks/useChains.js';
import { useSolanaChains } from '../hooks/useSolanaChains.js';
import { TokenList } from './TokenList.js';
import { NetworkSwitcher } from './NetworkSwitcher.js';
import { ActivityFeed } from './ActivityFeed.js';
import { PrivateKeyExport } from './PrivateKeyExport.js';
import { SwapPanel } from './SwapPanel.js';
import { useBalances, type UnifiedBalance } from '../hooks/useBalances.js';
import { SendModal } from './SendModal.js';

export interface RabitDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

type View =
  | 'home'        // tabs: tokens / activity (default)
  | 'send'        // pick a token → send
  | 'swap'
  | 'buy'
  | 'sell'
  | 'networks'
  | 'settings'
  | 'security';

export function RabitDashboard({ isOpen, onClose }: RabitDashboardProps) {
  const theme = useTheme();
  const { user, logout, updateProfile } = useAuth();
  const { isReady, isLocked, hasPin, lock, activeAccount } = useWallet();
  const [view, setView] = useState<View>('home');
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Reset view when drawer closes/opens.
  useEffect(() => {
    if (!isOpen) {
      setView('home');
      setMenuOpen(false);
      setSidebarOpen(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div style={overlay()} onClick={onClose}>
      <aside
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          height: '100vh',
          width: 'min(440px, 100vw)',
          background: theme.colors.background,
          color: theme.colors.text,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-12px 0 40px rgba(0,0,0,0.5)',
          fontFamily: theme.fonts.body,
        }}
      >
        <Header
          theme={theme}
          user={user}
          activeAddress={activeAccount?.address ?? ''}
          showBack={view !== 'home'}
          onBack={() => setView('home')}
          onClose={onClose}
          menuOpen={menuOpen}
          setMenuOpen={setMenuOpen}
          onMenuItem={(action) => {
            setMenuOpen(false);
            if (action === 'networks') setView('networks');
            else if (action === 'settings') setView('settings');
            else if (action === 'security') setView('security');
            else if (action === 'import-account') {
              alert('Import Account logic is typically injected by your app layer or provider. UI placeholder is set up!');
            }
            else if (action === 'lock') {
              if (hasPin) {
                lock();
                onClose();
              } else {
                alert('Set a PIN in Security to lock.');
                setView('security');
              }
            } else if (action === 'logout') {
              logout().then(onClose);
            }
          }}
          onAvatarClick={() => setSidebarOpen(true)}
        />

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {!isReady ? (
            <div style={{ padding: 28, fontSize: 14, color: theme.colors.textMuted, textAlign: 'center' }}>
              {isLocked ? 'Wallet locked. Unlock to continue.' : 'Loading wallet…'}
            </div>
          ) : view === 'home' ? (
            <HomeView onAction={setView} />
          ) : view === 'send' ? (
            <SendView onBack={() => setView('home')} />
          ) : view === 'swap' ? (
            <SubView title="Swap"><SwapPanel /></SubView>
          ) : view === 'buy' ? (
            <SubView title="Buy crypto"><BuyView /></SubView>
          ) : view === 'sell' ? (
            <SubView title="Sell crypto"><SellView /></SubView>
          ) : view === 'networks' ? (
            <SubView title="Networks"><NetworkSwitcher /></SubView>
          ) : view === 'settings' ? (
            <SubView title="Settings">
              <SettingsView updateProfile={updateProfile} initialName={user?.displayName ?? ''} />
            </SubView>
          ) : view === 'security' ? (
            <SubView title="Security">
              <SecurityView hasPin={hasPin} />
            </SubView>
          ) : null}
        </div>

        {sidebarOpen && (
          <div
            style={{
              position: 'absolute', top: 0, left: 0, bottom: 0, right: 0,
              background: 'rgba(0,0,0,0.6)', zIndex: 60,
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              animation: 'fadeIn 0.2s',
            }}
            onClick={() => setSidebarOpen(false)}
          >
            <div
              style={{
                width: '64px', height: '100%', background: theme.colors.background,
                position: 'absolute', top: 0, left: 0,
                boxShadow: '4px 0 30px rgba(0,0,0,0.5)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center',
                animation: 'slideInLeft 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)',
                borderRight: `1px solid ${theme.colors.border}`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <div style={{ padding: '14px 0 10px', width: '100%', display: 'flex', justifyContent: 'center' }}>
                <button onClick={() => setSidebarOpen(false)} style={iconBtn(theme)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={theme.colors.textSecondary} strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
                </button>
              </div>

              {/* Account Avatars */}
              <div style={{ flex: 1, padding: '8px 0', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center', width: '100%' }}>
                {/* Active Account */}
                <button style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  padding: '8px 4px', width: '100%',
                  background: theme.colors.surfaceMuted,
                  border: 'none', borderLeft: `3px solid ${theme.colors.primary}`,
                  cursor: 'pointer',
                }} title={user?.displayName ?? 'Account 1'}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 999,
                    border: `2px solid ${theme.colors.primary}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: `${theme.colors.primary}25`, color: theme.colors.primary,
                    fontSize: 14, fontWeight: 700,
                  }}>
                    {(user?.displayName ?? user?.email ?? '?')[0]?.toUpperCase()}
                  </div>
                  <span style={{ fontSize: 9, color: theme.colors.text, fontWeight: 600, maxWidth: 56, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' }}>
                    {user?.displayName ?? 'Account 1'}
                  </span>
                </button>
              </div>

              {/* Bottom utility icons */}
              <div style={{ padding: '12px 0 16px', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', borderTop: `1px solid ${theme.colors.border}`, width: '100%' }}>
                <button
                  onClick={() => {}}
                  title="Create new wallet"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 34, height: 34, borderRadius: 999,
                    background: 'transparent', border: `1px solid ${theme.colors.border}`,
                    cursor: 'pointer', color: theme.colors.primary, padding: 0,
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                </button>
                <button
                  onClick={() => alert('Import Account logic is typically injected by your app layer. UI placeholder ready!')}
                  title="Import wallet"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 34, height: 34, borderRadius: 999,
                    background: 'transparent', border: `1px solid ${theme.colors.border}`,
                    cursor: 'pointer', color: theme.colors.primary, padding: 0,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}

// ─── Header ───

interface HeaderProps {
  theme: ReturnType<typeof useTheme>;
  user: { displayName?: string; email?: string } | null | undefined;
  activeAddress: string;
  showBack: boolean;
  onBack: () => void;
  onClose: () => void;
  menuOpen: boolean;
  setMenuOpen: (b: boolean) => void;
  onMenuItem: (action: 'networks' | 'settings' | 'security' | 'lock' | 'logout' | 'import-account') => void;
  onAvatarClick: () => void;
}

function Header({ theme, user, activeAddress, showBack, onBack, onClose, menuOpen, setMenuOpen, onMenuItem, onAvatarClick }: HeaderProps) {
  const { activeChain: evmChain } = useChains();
  const { activeChain: solChain } = useSolanaChains();
  const { activeAccount } = useWallet();

  const networkLabel =
    activeAccount?.ecosystem === 'solana'
      ? solChain?.name
      : evmChain?.name ?? '—';

  const [copied, setCopied] = useState(false);
  const copyAddress = async () => {
    if (!activeAddress) return;
    try {
      await navigator.clipboard.writeText(activeAddress);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {/* clipboard denied */}
  };

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '14px 14px',
        borderBottom: `1px solid ${theme.colors.border}`,
        background: theme.colors.surface,
      }}
    >
      {showBack ? (
        <button onClick={onBack} aria-label="Back" style={iconBtn(theme)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      ) : (
        <button onClick={onAvatarClick} style={{ border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', borderRadius: '50%' }}>
          <Avatar name={user?.displayName ?? user?.email ?? '?'} theme={theme} />
        </button>
      )}

      {!showBack && (
        <button
          onClick={() => onMenuItem('networks')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 10px',
            background: theme.colors.surfaceMuted,
            border: 'none',
            borderRadius: 999,
            fontSize: 12,
            color: theme.colors.text,
            cursor: 'pointer',
            fontFamily: theme.fonts.body,
          }}
          title="Switch network"
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: 999,
              background: theme.colors.success,
            }}
          />
          {networkLabel}
          <ChevronDown color={theme.colors.textSecondary} />
        </button>
      )}

      {!showBack && (
        <button
          onClick={copyAddress}
          style={{
            flex: 1,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 10px',
            background: 'transparent',
            border: 'none',
            borderRadius: theme.radius.sm,
            fontSize: 13,
            color: theme.colors.text,
            cursor: 'pointer',
            fontFamily: theme.fonts.monospace,
            justifyContent: 'center',
          }}
          title={`Copy ${activeAddress}`}
        >
          {truncate(activeAddress)}
          {copied ? (
            <span style={{ fontSize: 11, color: theme.colors.success }}>copied</span>
          ) : (
            <CopyIcon color={theme.colors.textSecondary} />
          )}
        </button>
      )}

      {showBack && <div style={{ flex: 1 }} />}

      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="More"
          style={iconBtn(theme)}
        >
          <KebabIcon color={theme.colors.textSecondary} />
        </button>
        {menuOpen && (
          <Menu theme={theme} onItem={onMenuItem} onDismiss={() => setMenuOpen(false)} />
        )}
      </div>
      <button onClick={onClose} aria-label="Close" style={iconBtn(theme)}>
        <CloseIcon color={theme.colors.textSecondary} />
      </button>
    </header>
  );
}

function Menu({
  theme,
  onItem,
  onDismiss,
}: {
  theme: ReturnType<typeof useTheme>;
  onItem: (a: 'networks' | 'settings' | 'security' | 'lock' | 'logout' | 'import-account') => void;
  onDismiss: () => void;
}) {
  // Click-outside dismiss.
  useEffect(() => {
    const handler = () => onDismiss();
    setTimeout(() => window.addEventListener('click', handler, { once: true }), 0);
    return () => window.removeEventListener('click', handler);
  }, [onDismiss]);

  const items: { id: Parameters<typeof onItem>[0]; label: string; danger?: boolean }[] = [
    { id: 'networks', label: 'Networks' },
    { id: 'import-account', label: 'Import account' },
    { id: 'settings', label: 'Settings' },
    { id: 'security', label: 'Security' },
    { id: 'lock', label: 'Lock wallet' },
    { id: 'logout', label: 'Sign out', danger: true },
  ];
  return (
    <div
      style={{
        position: 'absolute',
        top: 'calc(100% + 6px)',
        right: 0,
        minWidth: 180,
        background: theme.colors.surface,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.radius.md,
        boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
        overflow: 'hidden',
        zIndex: 5,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((it) => (
        <button
          key={it.id}
          onClick={() => onItem(it.id)}
          onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = theme.colors.surfaceMuted; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          style={{
            display: 'block',
            width: '100%',
            padding: '10px 14px',
            border: 'none',
            background: 'transparent',
            textAlign: 'left',
            fontSize: 13,
            color: it.danger ? theme.colors.error : theme.colors.text,
            cursor: 'pointer',
            fontFamily: theme.fonts.body,
            transition: 'background 0.15s ease',
          }}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

// ─── Home view (balance + actions + tab strip) ───

function HomeView({ onAction }: { onAction: (v: View) => void }) {
  const theme = useTheme();
  const { totalUsd } = usePortfolioTotal();
  const { activeChain: evmChain } = useChains();
  const { activeChain: solChain } = useSolanaChains();
  const { activeAccount } = useWallet();
  const [tab, setTab] = useState<'tokens' | 'activity'>('tokens');

  const chainLabel =
    activeAccount?.ecosystem === 'solana' ? solChain?.name : evmChain?.name;

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Balance */}
      <div style={{ padding: '32px 20px 20px', textAlign: 'center' }}>
        <div
          style={{
            fontSize: 42,
            fontWeight: 700,
            color: theme.colors.text,
            letterSpacing: '-0.04em',
            lineHeight: 1.1,
          }}
        >
          {totalUsd != null ? formatUsd(totalUsd) : '—'}
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          marginTop: 8, padding: '4px 12px',
          borderRadius: 999, background: theme.colors.surfaceMuted,
          fontSize: 12, color: theme.colors.textSecondary,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: theme.colors.primary }} />
          {chainLabel ?? 'Total balance'}
        </div>
      </div>

      {/* Action row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 8,
          padding: '4px 16px 24px',
        }}
      >
        <ActionButton icon={<SendIcon />} label="Send" onClick={() => onAction('send')} theme={theme} />
        <ActionButton icon={<SwapIcon />} label="Swap" onClick={() => onAction('swap')} theme={theme} />
        <ActionButton icon={<PlusIcon />} label="Buy" onClick={() => onAction('buy')} theme={theme} />
        <ActionButton icon={<MinusIcon />} label="Sell" onClick={() => onAction('sell')} theme={theme} />
      </div>

      {/* Tab strip */}
      <div
        style={{
          display: 'flex',
          gap: 28,
          padding: '0 20px',
          borderBottom: `1px solid ${theme.colors.border}`,
        }}
      >
        {(['tokens', 'activity'] as const).map((id) => {
          const active = tab === id;
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                padding: '12px 0',
                background: 'transparent',
                border: 'none',
                fontSize: 14,
                fontWeight: 600,
                color: active ? theme.colors.text : theme.colors.textSecondary,
                cursor: 'pointer',
                fontFamily: theme.fonts.body,
                borderBottom: `3px solid ${active ? theme.colors.primary : 'transparent'}`,
                marginBottom: -1,
                transition: 'color 0.15s ease, border-color 0.15s ease',
              }}
            >
              {id === 'tokens' ? 'Tokens' : 'Activity'}
            </button>
          );
        })}
      </div>

      {/* Tab body */}
      <div style={{ padding: 16 }}>
        {tab === 'tokens' ? <TokenList /> : <ActivityFeed showClear />}
      </div>
    </div>
  );
}

// ─── Send view (token picker → SendModal) ───

function SendView({ onBack }: { onBack: () => void }) {
  const theme = useTheme();
  const { balances } = useBalances();
  const [picked, setPicked] = useState<UnifiedBalance | null>(null);

  return (
    <SubView title="Send">
      <p style={{ margin: '0 0 12px', fontSize: 13, color: theme.colors.textSecondary }}>
        Pick the token you want to send.
      </p>
      <div style={{ display: 'grid', gap: 8 }}>
        {balances.map((b) => (
          <button
            key={`${b.symbol}-${b.address ?? 'native'}`}
            onClick={() => setPicked(b)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 14px',
              border: `1px solid ${theme.colors.border}`,
              borderRadius: theme.radius.md,
              background: theme.colors.surface,
              fontFamily: theme.fonts.body,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{b.symbol}</div>
              <div style={{ fontSize: 12, color: theme.colors.textSecondary }}>{b.name}</div>
            </div>
            <div style={{ fontFamily: theme.fonts.monospace, fontSize: 13 }}>{b.formatted}</div>
          </button>
        ))}
      </div>
      <SendModal
        isOpen={!!picked}
        token={picked}
        onClose={() => setPicked(null)}
        onSent={() => { setPicked(null); onBack(); }}
      />
    </SubView>
  );
}

// ─── Buy / Sell sub-views ───

function CustomSelect({
  value,
  options,
  onChange,
  theme,
  style,
  fullWidth,
}: {
  value: string;
  options: { label: string; value: string }[] | string[];
  onChange: (v: string) => void;
  theme: ReturnType<typeof useTheme>;
  style?: React.CSSProperties;
  fullWidth?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handler = () => setIsOpen(false);
    const timer = setTimeout(() => window.addEventListener('click', handler, { once: true }), 0);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('click', handler);
    };
  }, [isOpen]);

  const normalizeOptions = options.map(o => typeof o === 'string' ? { label: o, value: o } : o);
  const selectedLabel = normalizeOptions.find(o => o.value === value)?.label ?? value;

  return (
    <div style={{ position: 'relative', width: fullWidth ? '100%' : 'auto' }}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        style={{
          border: 'none',
          background: 'transparent',
          fontSize: 16,
          fontWeight: 600,
          cursor: 'pointer',
          color: theme.colors.text,
          fontFamily: 'inherit',
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 6,
          width: '100%',
          ...style
        }}
      >
        <span>{selectedLabel}</span>
        <ChevronDown color={theme.colors.text} />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            ...(fullWidth ? { left: 0, right: 0 } : { right: 0, minWidth: 140 }),
            background: theme.colors.surface,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.radius.md,
            boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
            overflow: 'hidden',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {normalizeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                background: opt.value === value ? theme.colors.surfaceMuted : 'transparent',
                textAlign: 'left',
                fontSize: 14,
                fontWeight: opt.value === value ? 600 : 400,
                color: theme.colors.text,
                cursor: 'pointer',
                fontFamily: theme.fonts.body,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function BuyView() {
  const theme = useTheme();
  const { isAuthenticated } = useAuth();
  const { activeAccount } = useWallet();
  const { quote, isLoading, error, getQuote, buyWithQuote, clearQuote, activeOrder } = useOnRamp();
  const [fiatAmount, setFiatAmount] = useState('100');
  const [fiatCurrency, setFiatCurrency] = useState<'USD' | 'NGN' | 'GHS' | 'KES' | 'EUR' | 'GBP'>('USD');
  const [cryptoAsset, setCryptoAsset] = useState<'ETH' | 'BTC' | 'SOL' | 'USDC' | 'USDT'>('USDC');
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'card' | 'mobile_money'>('bank_transfer');
  const chain = activeAccount?.ecosystem ?? 'evm';

  useEffect(() => {
    const handler = setTimeout(() => {
      if (fiatAmount && parseFloat(fiatAmount) > 0) {
        getQuote({ fiatAmount, fiatCurrency, cryptoAsset, chain, paymentMethod }).catch(() => {});
      } else {
        clearQuote();
      }
    }, 600);
    return () => clearTimeout(handler);
  }, [fiatAmount, fiatCurrency, cryptoAsset, chain, paymentMethod, getQuote, clearQuote]);

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <p style={{ margin: 0, fontSize: 13, color: theme.colors.textSecondary, textAlign: 'center' }}>
        Live rates from CoinGecko. Pay with bank, card, or mobile money.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ ...inputBox(theme), position: 'relative' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 12, color: theme.colors.textSecondary, marginBottom: 8, fontWeight: 500 }}>You pay</span>
            <input 
              type="number" 
              value={fiatAmount} 
              onChange={(e) => { setFiatAmount(e.target.value); clearQuote(); }} 
              style={{ ...unstyledInput, fontSize: 32, fontWeight: 600, color: theme.colors.text }} 
            />
          </div>
          <div style={currencySelectorStyles(theme)}>
            <CustomSelect
              theme={theme}
              value={fiatCurrency}
              options={['USD', 'NGN', 'GHS', 'KES', 'EUR', 'GBP']}
              onChange={(v) => { setFiatCurrency(v as any); clearQuote(); }}
            />
          </div>
        </div>

        <div style={{ height: 16, display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '-12px 0', zIndex: 1, position: 'relative' }}>
          <div style={{ background: theme.colors.surface, border: `1px solid ${theme.colors.border}`, borderRadius: '50%', padding: 6, display: 'flex' }}>
            <ChevronDown color={theme.colors.textSecondary} />
          </div>
        </div>

        <div style={inputBox(theme)}>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <span style={{ fontSize: 12, color: theme.colors.textSecondary, marginBottom: 8, fontWeight: 500 }}>You receive</span>
            <div style={{ fontSize: 32, fontWeight: 600, color: quote ? theme.colors.text : theme.colors.textMuted }}>
              {isLoading && !quote ? <span style={{fontSize: 24}}>Calculating...</span> : (quote ? quote.cryptoAmount : '—')}
            </div>
          </div>
          <div style={currencySelectorStyles(theme)}>
            <CustomSelect
              theme={theme}
              value={cryptoAsset}
              options={['USDC', 'USDT', 'ETH', 'BTC', 'SOL']}
              onChange={(v) => { setCryptoAsset(v as any); clearQuote(); }}
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontSize: 12, color: theme.colors.textSecondary, fontWeight: 500 }}>Pay with</span>
        <div style={{ ...inputBox(theme), padding: '12px 16px', background: theme.colors.surface }}>
          <CustomSelect
            theme={theme}
            value={paymentMethod}
            options={[
              { label: 'Bank Transfer', value: 'bank_transfer' },
              { label: 'Credit/Debit Card', value: 'card' },
              { label: 'Mobile Money', value: 'mobile_money' }
            ]}
            onChange={(v) => { setPaymentMethod(v as any); clearQuote(); }}
            fullWidth
          />
        </div>
      </div>

      {error && <Banner kind="error" theme={theme}>{error.message}</Banner>}
      {activeOrder && 'destinationAddress' in activeOrder && (
        <Banner kind="success" theme={theme}>Order created: {activeOrder.id}</Banner>
      )}

      {quote && (
        <div style={{ padding: '0 8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ color: theme.colors.textSecondary, fontSize: 13 }}>Exchange Rate</span>
            <span style={{ color: theme.colors.text, fontSize: 13 }}>{quote.exchangeRate} {quote.fiatCurrency}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: theme.colors.textSecondary, fontSize: 13 }}>Total Fee</span>
            <span style={{ color: theme.colors.text, fontSize: 13 }}>{quote.fees.totalFee} {quote.fees.feeCurrency}</span>
          </div>
        </div>
      )}

      <button 
        onClick={() => quote ? buyWithQuote({ quoteId: quote.id }).catch(() => {}) : getQuote({ fiatAmount, fiatCurrency, cryptoAsset, chain, paymentMethod }).catch(() => {})} 
        disabled={Boolean(isLoading || !fiatAmount || (quote && !isAuthenticated))} 
        style={{ ...primaryBtn(theme), marginTop: 8, padding: 14, fontSize: 16 }}
      >
        {isLoading ? 'Fetching rate…' : (quote ? 'Confirm Order' : 'Review order')}
      </button>
    </div>
  );
}

function SellView() {
  const theme = useTheme();
  const { isAuthenticated } = useAuth();
  const { activeAccount } = useWallet();
  const { offRampQuote, isLoading, error, getOffRampQuote, sellWithQuote, clearQuote, activeOrder } = useOnRamp();
  const [cryptoAmount, setCryptoAmount] = useState('0.05');
  const [cryptoAsset, setCryptoAsset] = useState<'ETH' | 'BTC' | 'SOL' | 'USDC' | 'USDT'>('ETH');
  const [fiatCurrency, setFiatCurrency] = useState<'USD' | 'NGN' | 'GHS' | 'KES' | 'EUR' | 'GBP'>('USD');
  const [payoutMethod, setPayoutMethod] = useState<'bank_transfer' | 'mobile_money'>('bank_transfer');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const chain = activeAccount?.ecosystem ?? 'evm';

  useEffect(() => {
    const handler = setTimeout(() => {
      if (cryptoAmount && parseFloat(cryptoAmount) > 0) {
        getOffRampQuote({ cryptoAmount, cryptoAsset, chain, fiatCurrency, payoutMethod }).catch(() => {});
      } else {
        clearQuote();
      }
    }, 600);
    return () => clearTimeout(handler);
  }, [cryptoAmount, cryptoAsset, chain, fiatCurrency, payoutMethod, getOffRampQuote, clearQuote]);

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <p style={{ margin: 0, fontSize: 13, color: theme.colors.textSecondary, textAlign: 'center' }}>
        Cash out to bank or mobile money.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={inputBox(theme)}>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <span style={{ fontSize: 12, color: theme.colors.textSecondary, marginBottom: 8, fontWeight: 500 }}>You sell</span>
            <input 
              type="number" 
              value={cryptoAmount} 
              onChange={(e) => { setCryptoAmount(e.target.value); clearQuote(); }} 
              style={{ ...unstyledInput, fontSize: 32, fontWeight: 600, color: theme.colors.text }} 
            />
          </div>
          <div style={currencySelectorStyles(theme)}>
            <CustomSelect
              theme={theme}
              value={cryptoAsset}
              options={['ETH', 'BTC', 'SOL', 'USDC', 'USDT']}
              onChange={(v) => { setCryptoAsset(v as any); clearQuote(); }}
            />
          </div>
        </div>

        <div style={{ height: 16, display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '-12px 0', zIndex: 1, position: 'relative' }}>
          <div style={{ background: theme.colors.surface, border: `1px solid ${theme.colors.border}`, borderRadius: '50%', padding: 6, display: 'flex' }}>
            <ChevronDown color={theme.colors.textSecondary} />
          </div>
        </div>

        <div style={inputBox(theme)}>
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <span style={{ fontSize: 12, color: theme.colors.textSecondary, marginBottom: 8, fontWeight: 500 }}>You receive</span>
            <div style={{ fontSize: 32, fontWeight: 600, color: offRampQuote ? theme.colors.text : theme.colors.textMuted }}>
              {isLoading && !offRampQuote ? <span style={{fontSize: 24}}>Calculating...</span> : (offRampQuote ? offRampQuote.fiatAmount : '—')}
            </div>
          </div>
          <div style={currencySelectorStyles(theme)}>
            <CustomSelect
              theme={theme}
              value={fiatCurrency}
              options={['USD', 'NGN', 'GHS', 'KES', 'EUR', 'GBP']}
              onChange={(v) => { setFiatCurrency(v as any); clearQuote(); }}
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontSize: 12, color: theme.colors.textSecondary, fontWeight: 500 }}>Payout Method</span>
        <div style={{ ...inputBox(theme), padding: '12px 16px', background: theme.colors.surface }}>
          <CustomSelect
            theme={theme}
            value={payoutMethod}
            options={[
              { label: 'Bank Transfer', value: 'bank_transfer' },
              { label: 'Mobile Money', value: 'mobile_money' }
            ]}
            onChange={(v) => { setPayoutMethod(v as any); clearQuote(); }}
            fullWidth
          />
        </div>
      </div>

      {error && <Banner kind="error" theme={theme}>{error.message}</Banner>}
      {activeOrder && 'payoutMethod' in activeOrder && (
        <Banner kind="success" theme={theme}>Payout created: {activeOrder.id}</Banner>
      )}

      {offRampQuote && (
        <div style={{ padding: '0 8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ color: theme.colors.textSecondary, fontSize: 13 }}>Exchange Rate</span>
            <span style={{ color: theme.colors.text, fontSize: 13 }}>{offRampQuote.exchangeRate} {offRampQuote.fiatCurrency}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: theme.colors.textSecondary, fontSize: 13 }}>Total Fee</span>
            <span style={{ color: theme.colors.text, fontSize: 13 }}>{offRampQuote.fees.totalFee} {offRampQuote.fees.feeCurrency}</span>
          </div>

          <div style={{ display: 'grid', gap: 8, marginTop: 16 }}>
            <Field theme={theme} label="Account name"><input value={accountName} onChange={(e) => setAccountName(e.target.value)} style={input(theme)} /></Field>
            <Field theme={theme} label="Account number"><input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} style={input(theme)} /></Field>
            <Field theme={theme} label="Bank name"><input value={bankName} onChange={(e) => setBankName(e.target.value)} style={input(theme)} /></Field>
          </div>
        </div>
      )}

      <button
        onClick={() => offRampQuote ? sellWithQuote({ quoteId: offRampQuote.id, payoutDetails: { accountName, accountNumber, bankName, currency: fiatCurrency } as any }).catch(() => {}) : getOffRampQuote({ cryptoAmount, cryptoAsset, chain, fiatCurrency, payoutMethod }).catch(() => {})}
        disabled={Boolean(isLoading || !cryptoAmount || (offRampQuote ? (!isAuthenticated || !accountName || !accountNumber || !bankName) : false))}
        style={{ ...primaryBtn(theme), marginTop: 8, padding: 14, fontSize: 16 }}
      >
        {isLoading ? 'Fetching rate…' : (offRampQuote ? 'Confirm payout' : 'Review order')}
      </button>
    </div>
  );
}

// ─── Settings & Security ───

function SettingsView({
  updateProfile,
  initialName,
}: {
  updateProfile: (p: { displayName?: string }) => Promise<unknown>;
  initialName: string;
}) {
  const theme = useTheme();
  const [name, setName] = useState(initialName);
  const [busy, setBusy] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const save = async () => {
    setBusy(true);
    try {
      await updateProfile({ displayName: name.trim() });
      setSavedAt(Date.now());
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <Field theme={theme} label="Display name">
        <input value={name} onChange={(e) => setName(e.target.value)} style={input(theme)} />
      </Field>
      <button onClick={save} disabled={busy || !name.trim()} style={primaryBtn(theme)}>
        {busy ? 'Saving…' : 'Save'}
      </button>
      {savedAt && (
        <span style={{ fontSize: 12, color: theme.colors.success }}>Saved.</span>
      )}
    </div>
  );
}

function SecurityView({ hasPin }: { hasPin: boolean }) {
  const theme = useTheme();
  const [showExport, setShowExport] = useState(false);
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div
        style={{
          padding: 14,
          background: theme.colors.surfaceMuted,
          borderRadius: theme.radius.md,
          fontSize: 13,
          color: theme.colors.textSecondary,
          lineHeight: 1.5,
        }}
      >
        {hasPin
          ? '✓ Wallet protected by a PIN. You\'ll need it to unlock after closing the app.'
          : 'No PIN set. Add one to lock your wallet behind a 4-digit code.'}
      </div>

      <div style={{ display: 'grid', gap: 8 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: theme.colors.text }}>
          <input type="checkbox" checked={showExport} onChange={(e) => setShowExport(e.target.checked)} />
          Show private-key export
        </label>
        {showExport && <PrivateKeyExport />}
      </div>
    </div>
  );
}

// ─── Action button (round icon + label) ───

function ActionButton({
  icon,
  label,
  onClick,
  theme,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'transparent',
        border: 'none',
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
        cursor: 'pointer',
        fontFamily: theme.fonts.body,
      }}
    >
      <span
        style={{
          width: 52,
          height: 52,
          borderRadius: 999,
          background: theme.colors.primary,
          color: theme.colors.primaryText,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          boxShadow: `0 4px 16px ${theme.colors.primary}33`,
        }}
        onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.93)')}
        onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = `0 4px 16px ${theme.colors.primary}33`; }}
        onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 6px 24px ${theme.colors.primary}55`; }}
      >
        {icon}
      </span>
      <span style={{ fontSize: 11, color: theme.colors.textSecondary, fontWeight: 500 }}>
        {label}
      </span>
    </button>
  );
}

// ─── SubView wrapper ───

function SubView({ title, children }: { title: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ margin: '0 0 12px', fontSize: 18, fontWeight: 600, color: theme.colors.text }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

// ─── Layout primitives ───

function Avatar({ name, theme }: { name: string; theme: ReturnType<typeof useTheme> }) {
  const initial = name?.[0]?.toUpperCase() ?? '?';
  return (
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: 999,
        background: theme.colors.primary,
        color: theme.colors.primaryText,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 600,
        fontSize: 13,
      }}
    >
      {initial}
    </div>
  );
}

function Field({ theme, label, children }: { theme: ReturnType<typeof useTheme>; label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'grid', gap: 4, fontSize: 12, color: theme.colors.textSecondary }}>
      {label}
      {children}
    </label>
  );
}

function Row({
  theme,
  label,
  value,
  bold,
}: {
  theme: ReturnType<typeof useTheme>;
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
      <span style={{ color: theme.colors.textSecondary }}>{label}</span>
      <span style={{ fontWeight: bold ? 600 : 400, color: theme.colors.text }}>{value}</span>
    </div>
  );
}

function Banner({
  kind,
  theme,
  children,
}: {
  kind: 'error' | 'success';
  theme: ReturnType<typeof useTheme>;
  children: React.ReactNode;
}) {
  const isError = kind === 'error';
  return (
    <div
      style={{
        padding: 10,
        borderRadius: theme.radius.sm,
        background: isError ? `${theme.colors.error}15` : `${theme.colors.success}15`,
        border: `1px solid ${isError ? `${theme.colors.error}40` : `${theme.colors.success}40`}`,
        color: isError ? theme.colors.error : theme.colors.success,
        fontSize: 12,
      }}
    >
      {children}
    </div>
  );
}

// ─── Icons ───

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}
function SwapIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 16h13M3 16l4-4 4 4M17 8H4M21 8l-4-4-4 4" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
function MinusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
    </svg>
  );
}
function ChevronDown({ color }: { color: string }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <path d="M2 4l3 3 3-3" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function CopyIcon({ color }: { color: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  );
}
function KebabIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={color}>
      <circle cx="12" cy="5" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="12" cy="19" r="1.6" />
    </svg>
  );
}
function CloseIcon({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

// ─── Helpers / styles ───

function truncate(addr: string): string {
  if (!addr) return '';
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function formatUsd(n: number): string {
  return n.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: n < 1 ? 4 : 2,
  });
}

const overlay = (): React.CSSProperties => ({
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.45)',
  zIndex: 10003,
});

const iconBtn = (theme: ReturnType<typeof useTheme>): React.CSSProperties => ({
  width: 32,
  height: 32,
  border: 'none',
  background: 'transparent',
  color: theme.colors.textSecondary,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: theme.radius.sm,
});

const card = (theme: ReturnType<typeof useTheme>): React.CSSProperties => ({
  border: `1px solid ${theme.colors.border}`,
  borderRadius: theme.radius.md,
  padding: 12,
  background: theme.colors.surfaceMuted,
  display: 'grid',
  gap: 6,
});

const input = (theme: ReturnType<typeof useTheme>): React.CSSProperties => ({
  width: '100%',
  padding: '10px 12px',
  border: `1px solid ${theme.colors.border}`,
  borderRadius: theme.radius.md,
  fontSize: 14,
  fontFamily: theme.fonts.body,
  background: theme.colors.surface,
  color: theme.colors.text,
  boxSizing: 'border-box',
});

const primaryBtn = (theme: ReturnType<typeof useTheme>): React.CSSProperties => ({
  padding: '10px 14px',
  border: 'none',
  borderRadius: theme.radius.md,
  background: theme.colors.primary,
  color: theme.colors.primaryText,
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer',
});

const secondaryBtn = (theme: ReturnType<typeof useTheme>): React.CSSProperties => ({
  padding: '10px 14px',
  border: `1px solid ${theme.colors.border}`,
  borderRadius: theme.radius.md,
  background: theme.colors.surface,
  color: theme.colors.text,
  fontSize: 14,
  cursor: 'pointer',
});

const inputBox = (theme: ReturnType<typeof useTheme>): React.CSSProperties => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '16px',
  background: theme.colors.surfaceMuted,
  borderRadius: 16,
  border: `1px solid ${theme.colors.border}`,
});

const unstyledInput: React.CSSProperties = {
  border: 'none',
  background: 'transparent',
  outline: 'none',
  width: '100%',
  fontFamily: 'inherit',
  padding: 0,
};

const currencySelectorStyles = (theme: ReturnType<typeof useTheme>): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  padding: '8px 12px',
  background: theme.colors.surface,
  borderRadius: 999,
  border: `1px solid ${theme.colors.border}`,
  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
});

const unstyledSelect = (theme: ReturnType<typeof useTheme>): React.CSSProperties => ({
  border: 'none',
  background: 'transparent',
  outline: 'none',
  fontSize: 16,
  fontWeight: 600,
  cursor: 'pointer',
  WebkitAppearance: 'none',
  MozAppearance: 'none',
  color: theme.colors.text,
  fontFamily: 'inherit',
  padding: 0
});
