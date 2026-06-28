/**
 * WalletButton — drop-in pill that opens the auth modal when signed out,
 * and the RabitDashboard drawer when signed in.
 *
 * Replaces the old dropdown — every dashboard feature now lives inside
 * <RabitDashboard /> for a more cohesive UX.
 */

import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { useWallet } from '../hooks/useWallet.js';
import { AuthModal } from './AuthModal.js';
import { RabitDashboard } from './RabitDashboard.js';
import { useTheme } from '../theme.js';

export interface WalletButtonProps {
  /** Label when not connected. */
  label?: string;
  /** Show user's address instead of name when connected. Default: prefer name. */
  showAddress?: boolean;
}

export function WalletButton({ label = 'Sign in', showAddress = false }: WalletButtonProps) {
  const theme = useTheme();
  const { isAuthenticated, user } = useAuth();
  const { activeAccount } = useWallet();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);

  if (!isAuthenticated) {
    return (
      <>
        <button onClick={() => setShowAuthModal(true)} style={connectBtn(theme)}>
          {label}
        </button>
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onAuthenticated={() => setShowAuthModal(false)}
        />
      </>
    );
  }

  const addr = activeAccount?.address;
  const primaryLabel =
    showAddress
      ? truncateAddress(addr ?? '')
      : user?.displayName?.trim() || truncateAddress(addr ?? '') || 'Wallet';

  return (
    <>
      <button
        onClick={() => setShowDashboard(true)}
        style={connectedBtn(theme)}
        aria-label="Open wallet"
      >
        <Avatar name={primaryLabel} theme={theme} />
        <span style={{ fontSize: 13, fontWeight: 500 }}>{primaryLabel}</span>
        <Chevron color={theme.colors.textSecondary} />
      </button>

      <RabitDashboard
        isOpen={showDashboard}
        onClose={() => setShowDashboard(false)}
      />
    </>
  );
}

function Avatar({ name, theme }: { name: string; theme: ReturnType<typeof useTheme> }) {
  const initial = name?.[0]?.toUpperCase() ?? '?';
  return (
    <span
      style={{
        width: 22,
        height: 22,
        borderRadius: 999,
        background: theme.colors.primary,
        color: theme.colors.primaryText,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      {initial}
    </span>
  );
}

function Chevron({ color }: { color: string }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <path d="M2 4l3 3 3-3" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function truncateAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function connectBtn(theme: ReturnType<typeof useTheme>): React.CSSProperties {
  return {
    padding: '10px 18px',
    background: theme.colors.primary,
    color: theme.colors.primaryText,
    border: 'none',
    borderRadius: theme.radius.md,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: theme.fonts.body,
  };
}

function connectedBtn(theme: ReturnType<typeof useTheme>): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 12px 6px 6px',
    background: theme.colors.surface,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: 999,
    color: theme.colors.text,
    cursor: 'pointer',
    fontFamily: theme.fonts.body,
  };
}
