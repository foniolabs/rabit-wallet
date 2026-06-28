/**
 * SmartAccountPanel — clean smart-account demo.
 * Shows the counterfactual address, deployment status, and three actions:
 *   • Check on-chain     → does this contract exist yet?
 *   • Deploy             → submit a no-op userOp to deploy it
 *   • Send no-op userOp  → exercise the bundler/paymaster path
 */

import { useEffect, useMemo, useState } from 'react';
import { useAuth, useWallet, useRabitContext } from '@rabit/react';
import { createSmartAccount, getChain, type RabitSmartAccount } from '@rabit/evm';
import type { SmartAccountType } from '@rabit/types';

const BUNDLER_URL = import.meta.env.VITE_BUNDLER_URL;
const PAYMASTER_URL = import.meta.env.VITE_PAYMASTER_URL;
const SMART_ACCOUNT_TYPE =
  (import.meta.env.VITE_SMART_ACCOUNT_TYPE as SmartAccountType | undefined) ?? 'kernel';

type ActionState =
  | { kind: 'idle' }
  | { kind: 'busy'; label: string }
  | { kind: 'success'; message: string }
  | { kind: 'error'; message: string };

export function SmartAccountPanel() {
  const { core } = useRabitContext();
  const { isAuthenticated } = useAuth();
  const { accounts, activeChainId } = useWallet();

  const smartAccountEntry = useMemo(
    () => accounts.find((a) => a.type === 'smart_account'),
    [accounts]
  );

  const [state, setState] = useState<ActionState>({ kind: 'idle' });
  const [accountInstance, setAccountInstance] = useState<RabitSmartAccount | null>(null);
  const [deployedOnChain, setDeployedOnChain] = useState<boolean | null>(null);

  const loadAccount = async (): Promise<RabitSmartAccount> => {
    if (accountInstance) return accountInstance;
    const pk = core.getEvmPrivateKey();
    if (!pk) throw new Error('Wallet not unlocked');
    const chainId = activeChainId ?? 11155111;
    const chain = getChain(chainId);
    if (!chain) throw new Error(`Unsupported chain ${chainId}`);
    const sa = await createSmartAccount({
      type: SMART_ACCOUNT_TYPE,
      ownerPrivateKey: pk,
      chain,
      rpcUrl: chain.rpcUrls.default.http[0],
      bundlerUrl: BUNDLER_URL!,
      paymasterUrl: PAYMASTER_URL || undefined,
    });
    setAccountInstance(sa);
    return sa;
  };

  const run = async (label: string, fn: () => Promise<string>) => {
    setState({ kind: 'busy', label });
    try {
      const message = await fn();
      setState({ kind: 'success', message });
    } catch (e) {
      setState({ kind: 'error', message: e instanceof Error ? e.message : 'Operation failed' });
    }
  };

  // Auto-check deploy status on first load.
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancel = false;
    (async () => {
      try {
        const sa = await loadAccount();
        const ok = await sa.isDeployed();
        if (!cancel) setDeployedOnChain(ok);
      } catch {/* user can retry from button */}
    })();
    return () => { cancel = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, activeChainId]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <p style={{ margin: 0, fontSize: 13, color: '#666', lineHeight: 1.5 }}>
        Your smart account is a contract wallet that can batch transactions and
        be sponsored by a paymaster. Same address across every EVM chain.
      </p>

      {/* Address card */}
      <div
        style={{
          padding: 14,
          background: '#fafafa',
          border: '1px solid #eee',
          borderRadius: 12,
          display: 'grid',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {SMART_ACCOUNT_TYPE} smart account
          </div>
          <StatusPill deployed={deployedOnChain} />
        </div>
        <div
          style={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: 13,
            color: '#111',
            wordBreak: 'break-all',
          }}
        >
          {smartAccountEntry?.address || 'Resolving…'}
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        <button
          onClick={() =>
            run('Checking on-chain…', async () => {
              const sa = await loadAccount();
              const ok = await sa.isDeployed();
              setDeployedOnChain(ok);
              return ok ? 'Account is deployed on-chain.' : 'Not yet deployed.';
            })
          }
          disabled={state.kind === 'busy'}
          style={secondaryBtn}
        >
          Check
        </button>
        <button
          onClick={() =>
            run('Deploying…', async () => {
              const sa = await loadAccount();
              const r = await sa.deploy();
              setDeployedOnChain(true);
              return `Deployed ✓ ${shortHash(r.userOpHash)}`;
            })
          }
          disabled={state.kind === 'busy' || deployedOnChain === true}
          style={primaryBtn}
        >
          Deploy
        </button>
        <button
          onClick={() =>
            run('Sending userOp…', async () => {
              const sa = await loadAccount();
              const r = await sa.execute({ to: sa.address, value: 0n, data: '0x' });
              return `Sent ✓ ${shortHash(r.userOpHash)}`;
            })
          }
          disabled={state.kind === 'busy'}
          style={secondaryBtn}
        >
          Send userOp
        </button>
      </div>

      {/* Status banner */}
      {state.kind === 'busy' && (
        <div style={{ ...banner, background: '#f4f4f5', color: '#444' }}>
          {state.label}
        </div>
      )}
      {state.kind === 'success' && (
        <div style={{ ...banner, background: '#f0fdf4', borderColor: '#bbf7d0', color: '#166534' }}>
          {state.message}
        </div>
      )}
      {state.kind === 'error' && (
        <div style={{ ...banner, background: '#fef2f2', borderColor: '#fecaca', color: '#991b1b' }}>
          {state.message}
        </div>
      )}
    </div>
  );
}

function StatusPill({ deployed }: { deployed: boolean | null }) {
  if (deployed === null) {
    return (
      <span style={{ ...pill, color: '#888' }}>
        <Dot color="#bbb" /> Checking
      </span>
    );
  }
  return (
    <span
      style={{
        ...pill,
        color: deployed ? '#166534' : '#854d0e',
        background: deployed ? '#f0fdf4' : '#fef9c3',
        border: `1px solid ${deployed ? '#bbf7d0' : '#fde68a'}`,
      }}
    >
      <Dot color={deployed ? '#16a34a' : '#ca8a04'} />
      {deployed ? 'Deployed' : 'Not deployed'}
    </span>
  );
}

function Dot({ color }: { color: string }) {
  return (
    <span
      style={{
        width: 6,
        height: 6,
        borderRadius: 999,
        background: color,
        display: 'inline-block',
      }}
    />
  );
}

function shortHash(s: string): string {
  return `${s.slice(0, 8)}…${s.slice(-6)}`;
}

const primaryBtn: React.CSSProperties = {
  padding: '10px 12px',
  border: 'none',
  borderRadius: 10,
  background: '#111',
  color: '#fff',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
};

const secondaryBtn: React.CSSProperties = {
  padding: '10px 12px',
  border: '1px solid #e5e5e5',
  borderRadius: 10,
  background: '#fff',
  color: '#111',
  fontSize: 13,
  cursor: 'pointer',
};

const pill: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '4px 10px',
  borderRadius: 999,
  fontSize: 11,
  fontWeight: 500,
  background: 'transparent',
  border: '1px solid transparent',
};

const banner: React.CSSProperties = {
  padding: 12,
  borderRadius: 10,
  border: '1px solid transparent',
  fontSize: 12,
  wordBreak: 'break-all',
};
