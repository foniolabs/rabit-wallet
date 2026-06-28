/**
 * ContractDemoCard — clean smart-contract demo.
 *
 *   EVM:    read USDC metadata + balance, approve a spender
 *   Solana: write a memo + list past memos
 */

import { useState, useMemo } from 'react';
import {
  useContractRead,
  useContractWrite,
  useSolanaMemo,
  useWallet,
  useChains,
  useSolanaChains,
  useEvmFeeEstimate,
  useSolanaFeeEstimate,
  evaluateSafety,
  TransactionPreview,
  type PreviewParam,
} from '@rabit/react';
import { ERC20_ABI, parseUnits, formatUnits, getEvmTokens } from '@rabit/evm';

function findUsdcOnChain(chainId: number): { address: `0x${string}` } | null {
  const tokens = getEvmTokens(chainId);
  const usdc = tokens.find((t) => t.symbol === 'USDC' && t.address);
  if (!usdc?.address) return null;
  return { address: usdc.address as `0x${string}` };
}

export function ContractDemoCard() {
  const { activeAccount } = useWallet();
  const ecosystem = activeAccount?.ecosystem ?? 'evm';
  return ecosystem === 'evm' ? <EvmDemo /> : <SolanaDemo />;
}

// ─── EVM ───

function EvmDemo() {
  const { activeAccount, activeChainId } = useWallet();
  const { activeChain } = useChains();
  const { write, isWriting, error: writeError } = useContractWrite();
  const { fee, estimate: estimateFee, reset: resetFee } = useEvmFeeEstimate();

  const usdc = activeChainId ? findUsdcOnChain(activeChainId) : null;
  const owner = activeAccount?.address as `0x${string}` | undefined;
  const enabled = !!usdc && !!activeChainId;
  const safeAddr = usdc?.address ?? ('0x0000000000000000000000000000000000000000' as `0x${string}`);

  const symbol = useContractRead<string>({ address: safeAddr, abi: ERC20_ABI, functionName: 'symbol', enabled });
  const decimals = useContractRead<number>({ address: safeAddr, abi: ERC20_ABI, functionName: 'decimals', enabled });
  const balance = useContractRead<bigint>({
    address: safeAddr,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: owner ? [owner] : undefined,
    enabled: enabled && !!owner,
  });

  const [spender, setSpender] = useState('0x0000000000000000000000000000000000000001');
  const [amount, setAmount] = useState('1');
  const [showPreview, setShowPreview] = useState(false);
  const [result, setResult] = useState<{ hash: string; explorerUrl?: string } | null>(null);

  const sym = symbol.data ?? 'USDC';
  const dec = decimals.data ?? 6;
  const bal = balance.data != null && decimals.data != null ? formatUnits(balance.data, decimals.data) : null;

  const previewParams: PreviewParam[] = useMemo(
    () => [
      { label: 'Token', value: sym, hint: usdc?.address, mono: !!usdc?.address },
      { label: 'Spender', value: spender, mono: true },
      { label: 'Amount', value: `${amount} ${sym}` },
    ],
    [sym, spender, amount, usdc?.address]
  );

  const handleConfirm = async () => {
    if (!usdc) throw new Error('No USDC on this chain');
    const r = await write({
      address: usdc.address,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [spender as `0x${string}`, parseUnits(amount, dec)],
    });
    setResult(r);
    balance.refresh();
  };

  if (!usdc) {
    return (
      <div style={hint}>
        <strong>Switch to a chain with USDC.</strong>
        <br />
        Try Sepolia, Base Sepolia, Arbitrum Sepolia, OP Sepolia, or any mainnet.
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <p style={{ margin: 0, fontSize: 13, color: '#666' }}>
        Read live data from the {sym} contract on {activeChain?.name}, then
        approve another address to spend your tokens.
      </p>

      {/* Live read panel */}
      <div style={dataPanel}>
        <div style={dataRow}>
          <span style={dataLabel}>Token</span>
          <span style={dataValue}>{sym}</span>
        </div>
        <div style={dataRow}>
          <span style={dataLabel}>Decimals</span>
          <span style={dataValue}>{decimals.data ?? '…'}</span>
        </div>
        <div style={dataRow}>
          <span style={dataLabel}>Your balance</span>
          <span style={dataValue}>
            {bal ? `${bal} ${sym}` : '…'}
          </span>
        </div>
      </div>

      {/* Approve form */}
      <div style={{ display: 'grid', gap: 10 }}>
        <label style={fieldLabel}>
          <span>Spender address</span>
          <input
            value={spender}
            onChange={(e) => setSpender(e.target.value)}
            placeholder="0x…"
            style={input}
          />
        </label>
        <label style={fieldLabel}>
          <span>Amount</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="number"
              step="any"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={{ ...input, flex: 1 }}
            />
            <span
              style={{
                padding: '10px 14px',
                background: '#f4f4f5',
                borderRadius: 8,
                fontSize: 13,
                color: '#555',
                fontWeight: 500,
              }}
            >
              {sym}
            </span>
          </div>
        </label>
        <button
          onClick={async () => {
            setResult(null);
            setShowPreview(true);
            if (usdc && decimals.data) {
              estimateFee({
                to: usdc.address,
                abi: ERC20_ABI,
                functionName: 'approve',
                callArgs: [spender as `0x${string}`, parseUnits(amount, decimals.data)],
              }).catch(() => {});
            }
          }}
          style={primaryBtn}
        >
          Review approval
        </button>
      </div>

      <TransactionPreview
        isOpen={showPreview}
        title={`Approve ${sym}`}
        description={`Allow another address to spend your ${sym}. You can revoke this anytime by approving 0.`}
        params={previewParams}
        fee={fee}
        warnings={evaluateSafety({
          kind: 'approve',
          approvalAmount: amount && decimals.data ? parseUnits(amount, decimals.data) : undefined,
        })}
        network={activeChain?.name}
        confirmLabel={isWriting ? 'Signing…' : 'Approve'}
        onCancel={() => { setShowPreview(false); resetFee(); }}
        onConfirm={handleConfirm}
        result={result}
        errorOverride={writeError?.message ?? null}
        onDone={() => { setShowPreview(false); setResult(null); resetFee(); }}
      />
    </div>
  );
}

// ─── Solana ───

function SolanaDemo() {
  const { activeChain } = useSolanaChains();
  const { send, memos, isLoadingMemos, error: memoError } = useSolanaMemo();
  const { fee, estimate: estimateFee } = useSolanaFeeEstimate();
  const [text, setText] = useState('Hello from Rabit!');
  const [showPreview, setShowPreview] = useState(false);
  const [result, setResult] = useState<{ hash: string; explorerUrl?: string } | null>(null);

  const handleConfirm = async () => {
    const r = await send(text);
    setResult({ hash: r.signature, explorerUrl: r.explorerUrl });
  };

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <p style={{ margin: 0, fontSize: 13, color: '#666' }}>
        Write a short message to the Solana Memo program. The transaction is
        signed by your wallet and recorded on-chain.
      </p>

      <label style={fieldLabel}>
        <span>Message</span>
        <input value={text} onChange={(e) => setText(e.target.value)} style={input} />
      </label>

      <button
        onClick={() => {
          setResult(null);
          setShowPreview(true);
          estimateFee().catch(() => {});
        }}
        disabled={!text.trim()}
        style={primaryBtn}
      >
        Sign & send
      </button>

      {/* Recent memos */}
      <div style={{ display: 'grid', gap: 4 }}>
        <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>
          Recent memos
        </div>
        {memoError && <div style={{ color: '#c00', fontSize: 12 }}>{memoError.message}</div>}
        {isLoadingMemos && <div style={{ fontSize: 12, color: '#888' }}>Loading…</div>}
        {!isLoadingMemos && memos.length === 0 && (
          <div style={{ fontSize: 12, color: '#aaa' }}>None yet — send one above.</div>
        )}
        {memos.slice(0, 5).map((m) => (
          <div
            key={m.signature}
            style={{
              padding: '8px 10px',
              background: '#fafafa',
              borderRadius: 8,
              fontSize: 12,
            }}
          >
            <div style={{ fontWeight: 500 }}>
              {m.memo ?? <span style={{ color: '#aaa', fontStyle: 'italic' }}>(no memo log)</span>}
            </div>
            <div style={{ fontFamily: 'ui-monospace, monospace', color: '#888', fontSize: 10, marginTop: 2 }}>
              {m.signature.slice(0, 16)}…{m.signature.slice(-6)}
            </div>
          </div>
        ))}
      </div>

      <TransactionPreview
        isOpen={showPreview}
        title="Sign memo"
        description="Write a short message to the Solana Memo program. Signed locally, broadcast to the network."
        params={[
          { label: 'Program', value: 'Memo Program' },
          { label: 'Message', value: text },
          { label: 'Cluster', value: activeChain?.name ?? '—' },
        ]}
        fee={fee}
        network={activeChain?.name ?? 'Solana'}
        confirmLabel="Sign & send"
        onCancel={() => setShowPreview(false)}
        onConfirm={handleConfirm}
        result={result}
        onDone={() => { setShowPreview(false); setResult(null); }}
      />
    </div>
  );
}

// ─── Styles ───

const hint: React.CSSProperties = {
  fontSize: 13,
  color: '#666',
  padding: 14,
  background: '#fafafa',
  borderRadius: 10,
  lineHeight: 1.5,
};

const dataPanel: React.CSSProperties = {
  display: 'grid',
  gap: 0,
  border: '1px solid #eee',
  borderRadius: 10,
};

const dataRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '10px 14px',
  borderTop: '1px solid #f3f3f3',
  fontSize: 13,
};

const dataLabel: React.CSSProperties = {
  color: '#777',
};

const dataValue: React.CSSProperties = {
  color: '#111',
  fontWeight: 500,
};

const fieldLabel: React.CSSProperties = {
  display: 'grid',
  gap: 6,
  fontSize: 12,
  color: '#555',
  fontWeight: 500,
};

const input: React.CSSProperties = {
  padding: '10px 12px',
  border: '1px solid #e5e5e5',
  borderRadius: 8,
  fontSize: 13,
  fontFamily: 'inherit',
  background: '#fff',
};

const primaryBtn: React.CSSProperties = {
  padding: '11px 16px',
  border: 'none',
  borderRadius: 10,
  background: '#111',
  color: '#fff',
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer',
};
