import React, { useState } from 'react'
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView } from 'react-native'
import { Sheet, PrimaryButton } from './ui'
import { useBalances, type UnifiedBalance } from '../hooks/useBalances'
import { useSendToken } from '../hooks/useSendToken'
import { T } from '../theme'

export function SendSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { balances } = useBalances()
  const { send, isSending, error } = useSendToken()
  const [token, setToken] = useState<UnifiedBalance | null>(null)
  const [to, setTo] = useState('')
  const [amount, setAmount] = useState('')
  const [done, setDone] = useState<string | null>(null)

  function reset() {
    setToken(null)
    setTo('')
    setAmount('')
    setDone(null)
  }

  async function submit() {
    if (!token) return
    const { hash } = await send({ token, to: to.trim(), amount: amount.trim() })
    setDone(hash)
  }

  return (
    <Sheet
      visible={visible}
      onClose={() => {
        reset()
        onClose()
      }}
      title="Send"
    >
      {done ? (
        <View>
          <Text style={s.successGlyph}>✓</Text>
          <Text style={s.successTitle}>Sent</Text>
          <Text style={s.successHash} numberOfLines={1}>
            {done}
          </Text>
          <PrimaryButton label="Done" onPress={() => { reset(); onClose() }} />
        </View>
      ) : !token ? (
        <ScrollView style={{ maxHeight: 360 }}>
          <Text style={s.label}>Select a token</Text>
          {balances.map((b) => (
            <Pressable key={`${b.ecosystem}-${b.symbol}`} style={s.pickRow} onPress={() => setToken(b)}>
              <Text style={s.pickSymbol}>{b.symbol}</Text>
              <Text style={s.pickBal}>{b.formatted}</Text>
            </Pressable>
          ))}
        </ScrollView>
      ) : (
        <View>
          <Pressable onPress={() => setToken(null)}>
            <Text style={s.change}>‹ {token.symbol} · balance {token.formatted}</Text>
          </Pressable>
          <Text style={s.label}>Recipient</Text>
          <TextInput
            style={s.input}
            value={to}
            onChangeText={setTo}
            placeholder={token.ecosystem === 'evm' ? '0x…' : 'Solana address'}
            placeholderTextColor={T.textMuted}
            autoCapitalize="none"
          />
          <Text style={s.label}>Amount</Text>
          <TextInput
            style={s.input}
            value={amount}
            onChangeText={setAmount}
            placeholder="0.0"
            placeholderTextColor={T.textMuted}
            keyboardType="decimal-pad"
          />
          {error ? <Text style={s.error}>{error.message}</Text> : null}
          <PrimaryButton label={`Send ${token.symbol}`} onPress={submit} loading={isSending} disabled={!to || !amount} />
        </View>
      )}
    </Sheet>
  )
}

const s = StyleSheet.create({
  label: { color: T.textMuted, fontSize: 12.5, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: T.bg, borderColor: T.border, borderWidth: 1, borderRadius: T.radius.md, color: T.text, paddingHorizontal: 14, height: 50, fontSize: 16 },
  pickRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 14, borderBottomColor: T.border, borderBottomWidth: 1 },
  pickSymbol: { color: T.text, fontSize: 15.5, fontWeight: '600' },
  pickBal: { color: T.textSecondary, fontSize: 15 },
  change: { color: T.primary, fontSize: 14, marginBottom: 4 },
  error: { color: T.error, marginTop: 10 },
  successGlyph: { color: T.success, fontSize: 40, textAlign: 'center' },
  successTitle: { color: T.text, fontSize: 20, fontWeight: '700', textAlign: 'center', marginTop: 8 },
  successHash: { color: T.textMuted, fontSize: 12.5, textAlign: 'center', marginTop: 6, marginBottom: 8, fontFamily: 'Courier' },
})
