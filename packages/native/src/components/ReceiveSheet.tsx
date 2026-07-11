import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Sheet } from './ui'
import { useWallet } from '../hooks/useAuth'
import { T } from '../theme'

function AddressCard({ label, address }: { label: string; address: string | null }) {
  if (!address) return null
  return (
    <View style={s.card}>
      <Text style={s.label}>{label}</Text>
      <Text style={s.addr} selectable>
        {address}
      </Text>
    </View>
  )
}

/**
 * Receive — shows the user's EVM + Solana addresses. Drop in a QR by adding
 * `react-native-qrcode-svg` and rendering it above each address.
 */
export function ReceiveSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { evmAddress, solanaAddress } = useWallet()
  return (
    <Sheet visible={visible} onClose={onClose} title="Receive">
      <Text style={s.hint}>Send tokens to these addresses. Long-press to copy.</Text>
      <AddressCard label="Ethereum / EVM" address={evmAddress} />
      <AddressCard label="Solana" address={solanaAddress} />
    </Sheet>
  )
}

const s = StyleSheet.create({
  hint: { color: T.textSecondary, fontSize: 13.5, marginBottom: 14 },
  card: { backgroundColor: T.bg, borderColor: T.border, borderWidth: 1, borderRadius: T.radius.md, padding: 16, marginBottom: 12 },
  label: { color: T.textMuted, fontSize: 12.5, marginBottom: 6 },
  addr: { color: T.text, fontSize: 14, fontFamily: 'Courier', lineHeight: 20 },
})
