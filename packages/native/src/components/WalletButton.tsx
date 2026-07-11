import React, { useState } from 'react'
import { Pressable, Text, StyleSheet } from 'react-native'
import { useAuth, useWallet } from '../hooks'
import { AuthModal } from './AuthModal'

function short(addr: string | null) {
  return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : ''
}

/**
 * Drop-in RN wallet button. Signed out → opens the auth sheet.
 * Signed in → an account pill (wire an onPress to open your own wallet screen).
 */
export function WalletButton({ onPressAccount }: { onPressAccount?: () => void }) {
  const { isAuthenticated } = useAuth()
  const { evmAddress } = useWallet()
  const [open, setOpen] = useState(false)

  if (isAuthenticated) {
    return (
      <Pressable style={styles.pill} onPress={onPressAccount}>
        <Text style={styles.dot}>●</Text>
        <Text style={styles.pillText}>{short(evmAddress)}</Text>
      </Pressable>
    )
  }

  return (
    <>
      <Pressable style={styles.primary} onPress={() => setOpen(true)}>
        <Text style={styles.primaryText}>Sign in</Text>
      </Pressable>
      <AuthModal visible={open} onClose={() => setOpen(false)} />
    </>
  )
}

const styles = StyleSheet.create({
  primary: { backgroundColor: '#569F8C', borderRadius: 999, paddingHorizontal: 20, height: 44, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#071A14', fontSize: 15, fontWeight: '600' },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#101F1A', borderColor: '#21403A', borderWidth: 1, borderRadius: 999, paddingHorizontal: 16, height: 44 },
  dot: { color: '#4FD1A6', fontSize: 10 },
  pillText: { color: '#ECF5F1', fontSize: 14, fontWeight: '500' },
})
