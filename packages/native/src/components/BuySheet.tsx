import React, { useState } from 'react'
import { View, Text, TextInput, StyleSheet } from 'react-native'
import { Sheet, PrimaryButton } from './ui'
import { useOnRamp } from '../hooks/useOnRamp'
import { useWallet } from '../hooks/useAuth'
import { T } from '../theme'

export function BuySheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { getQuote, buyWithQuote, quote, activeOrder, isLoading, error } = useOnRamp()
  const { activeAccount } = useWallet()
  const [fiat, setFiat] = useState('50')
  const [asset, setAsset] = useState('USDC')

  const chain: 'evm' | 'solana' = activeAccount?.ecosystem === 'solana' ? 'solana' : 'evm'

  async function quoteIt() {
    await getQuote({ fiatAmount: fiat, fiatCurrency: 'USD', cryptoAsset: asset, chain, paymentMethod: 'card' })
  }
  async function confirm() {
    if (!quote) return
    await buyWithQuote({ quoteId: quote.id })
  }

  return (
    <Sheet visible={visible} onClose={onClose} title="Buy crypto">
      <View style={s.amountCard}>
        <Text style={s.label}>You pay (USD)</Text>
        <View style={s.amountRow}>
          <Text style={s.dollar}>$</Text>
          <TextInput style={s.amount} value={fiat} onChangeText={setFiat} keyboardType="decimal-pad" placeholderTextColor={T.textMuted} />
        </View>
      </View>

      <Text style={s.label}>Asset</Text>
      <View style={s.assets}>
        {['USDC', 'ETH', 'SOL'].map((a) => (
          <Text
            key={a}
            onPress={() => setAsset(a)}
            style={[s.assetPill, asset === a && s.assetActive]}
          >
            {a}
          </Text>
        ))}
      </View>

      {quote ? (
        <View style={s.quote}>
          <Text style={s.quoteMain}>≈ {quote.cryptoAmount} {asset}</Text>
          <Text style={s.quoteSub}>Rate {quote.exchangeRate} · fee {quote.fees.serviceFee}</Text>
        </View>
      ) : null}

      {activeOrder ? <Text style={s.order}>Order {activeOrder.id.slice(0, 8)}… — {activeOrder.status}</Text> : null}
      {error ? <Text style={s.error}>{error.message}</Text> : null}

      {quote ? (
        <PrimaryButton label={`Buy ${asset}`} onPress={confirm} loading={isLoading} />
      ) : (
        <PrimaryButton label="Get quote" onPress={quoteIt} loading={isLoading} />
      )}
      <Text style={s.foot}>Pay with card · funds settle to your wallet</Text>
    </Sheet>
  )
}

const s = StyleSheet.create({
  amountCard: { backgroundColor: T.bg, borderColor: T.border, borderWidth: 1, borderRadius: T.radius.md, padding: 16 },
  amountRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  dollar: { color: T.textSecondary, fontSize: 28, fontWeight: '700', marginRight: 4 },
  amount: { color: T.text, fontSize: 32, fontWeight: '700', flex: 1, padding: 0 },
  label: { color: T.textMuted, fontSize: 12.5, marginBottom: 8, marginTop: 14 },
  assets: { flexDirection: 'row', gap: 8 },
  assetPill: { color: T.textSecondary, borderColor: T.border, borderWidth: 1, borderRadius: T.radius.pill, paddingHorizontal: 16, paddingVertical: 8, fontSize: 14, overflow: 'hidden' },
  assetActive: { backgroundColor: T.primary, color: T.primaryText, borderColor: T.primary, fontWeight: '600' },
  quote: { backgroundColor: T.surfaceMuted, borderRadius: T.radius.md, padding: 14, marginTop: 16 },
  quoteMain: { color: T.text, fontSize: 20, fontWeight: '700' },
  quoteSub: { color: T.textSecondary, fontSize: 13, marginTop: 2 },
  order: { color: T.textSecondary, fontSize: 13, marginTop: 12 },
  error: { color: T.error, marginTop: 10 },
  foot: { color: T.textMuted, fontSize: 12, textAlign: 'center', marginTop: 12 },
})
