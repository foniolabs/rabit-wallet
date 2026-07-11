import React from 'react'
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native'
import { useBalances, type UnifiedBalance } from '../hooks/useBalances'
import { T } from '../theme'

const TINT: Record<string, string> = { ETH: '#627EEA', SOL: '#9945FF', USDC: '#2775CA', USDT: '#26A17B' }

export function TokenRow({ token, onPress }: { token: UnifiedBalance; onPress?: (t: UnifiedBalance) => void }) {
  const tint = TINT[token.symbol] ?? T.primary
  return (
    <Pressable style={s.row} onPress={() => onPress?.(token)}>
      <View style={[s.logo, { backgroundColor: tint }]}>
        <Text style={s.logoText}>{token.symbol.slice(0, 1)}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.symbol}>{token.symbol}</Text>
        <Text style={s.name} numberOfLines={1}>
          {token.name}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={s.amount}>{token.formatted}</Text>
        <Text style={s.chain}>{token.ecosystem === 'evm' ? 'EVM' : 'Solana'}</Text>
      </View>
    </Pressable>
  )
}

export function TokenList({ onSelect }: { onSelect?: (t: UnifiedBalance) => void }) {
  const { balances, isLoading } = useBalances()

  if (isLoading && balances.length === 0) {
    return <ActivityIndicator style={{ marginTop: 24 }} color={T.primary} />
  }
  if (balances.length === 0) {
    return <Text style={s.empty}>No tokens yet. Buy or receive to get started.</Text>
  }
  return (
    <View>
      {balances.map((b) => (
        <TokenRow key={`${b.ecosystem}-${b.symbol}-${b.address ?? 'native'}`} token={b} onPress={onSelect} />
      ))}
    </View>
  )
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  logo: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  logoText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  symbol: { color: T.text, fontSize: 15.5, fontWeight: '600' },
  name: { color: T.textMuted, fontSize: 12.5, marginTop: 1 },
  amount: { color: T.text, fontSize: 15, fontWeight: '600' },
  chain: { color: T.textMuted, fontSize: 12, marginTop: 1 },
  empty: { color: T.textMuted, textAlign: 'center', marginTop: 28, fontSize: 14 },
})
