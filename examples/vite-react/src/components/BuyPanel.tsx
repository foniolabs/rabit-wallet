import { useState } from 'react';
import { useAuth, useOnRamp } from '@rabit/react';

const ASSETS = ['ETH', 'BTC', 'SOL', 'USDC', 'USDT'] as const;
const CHAINS = ['evm', 'solana'] as const;
const CURRENCIES = ['USD', 'NGN', 'GHS', 'KES', 'EUR', 'GBP'] as const;
const PAYMENT_METHODS = ['bank_transfer', 'card', 'mobile_money'] as const;

export function BuyPanel() {
  const { isAuthenticated } = useAuth();
  const { quote, activeOrder, isLoading, error, getQuote, buyWithQuote, clearQuote } = useOnRamp();

  const [fiatAmount, setFiatAmount] = useState('100');
  const [fiatCurrency, setFiatCurrency] = useState<typeof CURRENCIES[number]>('USD');
  const [cryptoAsset, setCryptoAsset] = useState<typeof ASSETS[number]>('USDC');
  const [chain, setChain] = useState<typeof CHAINS[number]>('evm');
  const [paymentMethod, setPaymentMethod] =
    useState<typeof PAYMENT_METHODS[number]>('bank_transfer');

  return (
    <section
      style={{
        background: '#fff',
        border: '1px solid #eee',
        borderRadius: 12,
        padding: 20,
      }}
    >
      <h2 style={{ margin: '0 0 12px', fontSize: 16 }}>Buy crypto</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Fiat amount">
          <input
            type="number"
            value={fiatAmount}
            onChange={(e) => setFiatAmount(e.target.value)}
            style={inputStyle}
          />
        </Field>
        <Field label="Fiat currency">
          <select
            value={fiatCurrency}
            onChange={(e) => setFiatCurrency(e.target.value as any)}
            style={inputStyle}
          >
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Asset">
          <select
            value={cryptoAsset}
            onChange={(e) => setCryptoAsset(e.target.value as any)}
            style={inputStyle}
          >
            {ASSETS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </Field>
        <Field label="Chain">
          <select
            value={chain}
            onChange={(e) => setChain(e.target.value as any)}
            style={inputStyle}
          >
            {CHAINS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Payment method">
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value as any)}
            style={inputStyle}
          >
            {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </Field>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button
          style={primaryButton}
          disabled={isLoading}
          onClick={() =>
            getQuote({ fiatAmount, fiatCurrency, cryptoAsset, chain, paymentMethod }).catch(() => {})
          }
        >
          {isLoading ? 'Loading…' : 'Get quote'}
        </button>
        {quote && (
          <button style={secondaryButton} onClick={clearQuote}>
            Clear
          </button>
        )}
      </div>

      {error && <div style={errorStyle}>{error.message}</div>}

      {quote && (
        <div style={{ marginTop: 16, borderTop: '1px solid #eee', paddingTop: 12, fontSize: 13 }}>
          <div>
            You get <strong>{quote.cryptoAmount}</strong> {quote.cryptoAsset.symbol}
          </div>
          <div style={{ color: '#666' }}>Rate: 1 {quote.cryptoAsset.symbol} = {quote.exchangeRate} {quote.fiatCurrency}</div>
          <div style={{ color: '#666' }}>
            Fees: {quote.fees.totalFee} {quote.fees.feeCurrency}
            {' '}(service {quote.fees.serviceFee} + network {quote.fees.networkFee})
          </div>
          <button
            style={{ ...primaryButton, marginTop: 8 }}
            disabled={isLoading || !isAuthenticated}
            title={!isAuthenticated ? 'Sign in first' : undefined}
            onClick={() => buyWithQuote({ quoteId: quote.id }).catch(() => {})}
          >
            {isAuthenticated ? 'Confirm order' : 'Sign in to confirm'}
          </button>
        </div>
      )}

      {activeOrder && 'destinationAddress' in activeOrder && (
        <div style={{ marginTop: 12, fontSize: 13 }}>
          <strong>Order created:</strong> {activeOrder.id}
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
