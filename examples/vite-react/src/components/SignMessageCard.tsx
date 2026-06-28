/**
 * SignMessageCard — clean, minimal "Sign in with Wallet" demo.
 */

import { useState } from 'react';
import { useSignMessage, useWallet, TransactionPreview, evaluateSafety } from '@rabit/react';

export function SignMessageCard() {
  const { activeAccount } = useWallet();
  const { signMessage, isSigning, error } = useSignMessage();
  const [text, setText] = useState(
    `I am signing in to MyApp.\n\nIssued: ${new Date().toISOString()}`
  );
  const [showPreview, setShowPreview] = useState(false);
  const [result, setResult] = useState<{ signature: string; address: string } | null>(null);

  if (!activeAccount) return null;

  const handleConfirm = async () => {
    const r = await signMessage(text);
    setResult({ signature: r.signature, address: r.address });
  };

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ fontSize: 13, color: '#666', lineHeight: 1.5 }}>
        Prove you control this wallet by signing a message. The signature is
        generated locally — nothing is broadcast on-chain.
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        style={{
          padding: 12,
          border: '1px solid #e5e5e5',
          borderRadius: 10,
          fontSize: 13,
          fontFamily: 'inherit',
          resize: 'vertical',
          background: '#fafafa',
        }}
      />

      <button
        onClick={() => {
          setResult(null);
          setShowPreview(true);
        }}
        disabled={!text.trim() || !activeAccount}
        style={{
          padding: '11px 16px',
          border: 'none',
          borderRadius: 10,
          background: '#111',
          color: '#fff',
          fontSize: 14,
          fontWeight: 500,
          cursor: 'pointer',
          alignSelf: 'flex-start',
        }}
      >
        Sign message
      </button>

      {result && (
        <div
          style={{
            padding: 14,
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: 10,
            display: 'grid',
            gap: 6,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, color: '#166534' }}>
            ✓ Signature created
          </div>
          <div
            style={{
              fontFamily: 'ui-monospace, monospace',
              fontSize: 11,
              color: '#444',
              wordBreak: 'break-all',
              maxHeight: 80,
              overflow: 'auto',
            }}
          >
            {result.signature}
          </div>
        </div>
      )}

      <TransactionPreview
        isOpen={showPreview}
        title="Sign message"
        description="A dApp is asking you to sign a message. This is just a signature — no transaction, no funds moved."
        params={[
          {
            label: 'Account',
            value: activeAccount.label || activeAccount.address,
            mono: !activeAccount.label,
          },
          { label: 'Message', value: text },
        ]}
        warnings={evaluateSafety({ kind: 'sign_message', messageText: text })}
        confirmLabel={isSigning ? 'Signing…' : 'Sign'}
        onCancel={() => setShowPreview(false)}
        onConfirm={handleConfirm}
        errorOverride={error?.message ?? null}
        result={result ? { hash: result.signature } : null}
        onDone={() => setShowPreview(false)}
      />
    </div>
  );
}
