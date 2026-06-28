import { useState } from 'react';
import { useAuth, useOnRamp } from '@rabit/react';

const ASSETS = ['ETH', 'BTC', 'SOL', 'USDC', 'USDT'] as const;
const CHAINS = ['evm', 'solana'] as const;
const CURRENCIES = ['USD', 'NGN', 'GHS', 'KES', 'EUR', 'GBP'] as const;
const PAYOUTS = ['bank_transfer', 'mobile_money'] as const;

export function SellPanel() {
  const { isAuthenticated } = useAuth();
  const { offRampQuote, activeOrder, isLoading, error, getOffRampQuote, sellWithQuote, clearQuote } = useOnRamp();

  const [cryptoAmount, setCryptoAmount] = useState('0.05');
  const [cryptoAsset, setCryptoAsset] = useState<typeof ASSETS[number]>('ETH');
  const [chain, setChain] = useState<typeof CHAINS[number]>('evm');
  const [fiatCurrency, setFiatCurrency] = useState<typeof CURRENCIES[number]>('USD');
  const [payoutMethod, setPayoutMethod] = useState<typeof PAYOUTS[number]>('bank_transfer');

  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');

  const handleSell = async () => {
    if (!offRampQuote) return;
    try {
      await sellWithQuote({
        quoteId: offRampQuote.id,
        payoutDetails: {
          accountName,
          accountNumber,
          bankName,
          currency: fiatCurrency,
        } as any,
      });
    } catch {/* error already captured */}
  };

  return (
    <section
      style={{
        background: '#fff',
        border: '1px solid #eee',
        borderRadius: 12,
        padding: 20,
      }}
    >
      <h2 style={{ margin: '0 0 12px', fontSize: 16 }}>Sell crypto</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Crypto amount">
          <input
            type="number"
            value={cryptoAmount}
            onChange={(e) => setCryptoAmount(e.target.value)}
            style={inputStyle}
          />
        </Field>
        <Field label="Asset">
          <select value={cryptoAsset} onChange={(e) => setCryptoAsset(e.target.value as any)} style={inputStyle}>
            {ASSETS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </Field>
        <Field label="Chain">
          <select value={chain} onChange={(e) => setChain(e.target.value as any)} style={inputStyle}>
            {CHAINS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Payout currency">
          <select value={fiatCurrency} onChange={(e) => setFiatCurrency(e.target.value as any)} style={inputStyle}>
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Payout method">
          <select value={payoutMethod} onChange={(e) => setPayoutMethod(e.target.value as any)} style={inputStyle}>
            {PAYOUTS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </Field>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button
          style={primaryButton}
          disabled={isLoading}
          onClick={() =>
            getOffRampQuote({ cryptoAmount, cryptoAsset, chain, fiatCurrency, payoutMethod }).catch(() => {})
          }
        >
          {isLoading ? 'Loading…' : 'Get quote'}
        </button>
        {offRampQuote && (
          <button style={secondaryButton} onClick={clearQuote}>Clear</button>
        )}
      </div>

      {error && <div style={errorStyle}>{error.message}</div>}

      {offRampQuote && (
        <div style={{ marginTop: 16, borderTop: '1px solid #eee', paddingTop: 12, fontSize: 13 }}>
          <div>You receive <strong>{offRampQuote.fiatAmount}</strong> {offRampQuote.fiatCurrency}</div>
          <div style={{ color: '#666' }}>Rate: 1 {offRampQuote.cryptoAsset.symbol} = {offRampQuote.exchangeRate} {offRampQuote.fiatCurrency}</div>
          <div style={{ color: '#666' }}>
            Fees: {offRampQuote.fees.totalFee} {offRampQuote.fees.feeCurrency}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
            <Field label="Account name">
              <input value={accountName} onChange={(e) => setAccountName(e.target.value)} style={inputStyle} />
            </Field>
            <Field label="Account number">
              <input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} style={inputStyle} />
            </Field>
            <Field label="Bank name">
              <input value={bankName} onChange={(e) => setBankName(e.target.value)} style={inputStyle} />
            </Field>
          </div>

          <button
            style={{ ...primaryButton, marginTop: 12 }}
            disabled={isLoading || !isAuthenticated || !accountName || !accountNumber || !bankName}
            onClick={handleSell}
          >
            {isAuthenticated ? 'Confirm payout' : 'Sign in to confirm'}
          </button>
        </div>
      )}

      {activeOrder && 'payoutMethod' in activeOrder && (
        <div style={{ marginTop: 12, fontSize: 13 }}>
          <strong>Payout order:</strong> {activeOrder.id}
          <div style={{ color: '#666' }}>Status: {activeOrder.status}</div>
        </div>
      )}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'grid', gap: 4, fontSize: 12, color: '#555' }}>
      {label}
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '8px 10px',
  border: '1px solid #ddd',
  borderRadius: 6,
  fontSize: 14,
};

const primaryButton: React.CSSProperties = {
  padding: '10px 16px',
  border: 'none',
  borderRadius: 8,
  background: '#111',
  color: '#fff',
  cursor: 'pointer',
  fontSize: 14,
};

const secondaryButton: React.CSSProperties = {
  padding: '10px 16px',
  border: '1px solid #ddd',
  borderRadius: 8,
  background: '#fff',
  color: '#111',
  cursor: 'pointer',
  fontSize: 14,
};

const errorStyle: React.CSSProperties = {
  color: '#c00',
  fontSize: 13,
  marginTop: 8,
};
