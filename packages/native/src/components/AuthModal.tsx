import React, { useState } from 'react'
import { Modal, View, Text, TextInput, Pressable, ActivityIndicator, StyleSheet } from 'react-native'
import { useAuth } from '../hooks'

export interface AuthModalProps {
  visible: boolean
  onClose: () => void
  onAuthenticated?: () => void
}

/**
 * React-Native email-OTP sign-in sheet. A minimal, themeable starting point —
 * Google sign-in is wired to `loginWithGoogle(idToken)`; obtain the id token
 * with @react-native-google-signin/google-signin in your app.
 */
export function AuthModal({ visible, onClose, onAuthenticated }: AuthModalProps) {
  const { sendOtp, verifyOtp, isLoading } = useAuth()
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function submitEmail() {
    setError(null)
    try {
      await sendOtp(email.trim())
      setStep('otp')
    } catch (e) {
      setError((e as Error).message)
    }
  }

  async function submitCode() {
    setError(null)
    try {
      await verifyOtp(email.trim(), code.trim())
      onAuthenticated?.()
      onClose()
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Sign in</Text>

          {step === 'email' ? (
            <>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor="#7FA89D"
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <Pressable style={styles.primary} onPress={submitEmail} disabled={isLoading || !email}>
                {isLoading ? <ActivityIndicator color="#071A14" /> : <Text style={styles.primaryText}>Continue</Text>}
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.label}>Enter the code sent to {email}</Text>
              <TextInput
                style={styles.input}
                value={code}
                onChangeText={setCode}
                placeholder="123456"
                placeholderTextColor="#7FA89D"
                keyboardType="number-pad"
              />
              <Pressable style={styles.primary} onPress={submitCode} disabled={isLoading || code.length < 4}>
                {isLoading ? <ActivityIndicator color="#071A14" /> : <Text style={styles.primaryText}>Verify</Text>}
              </Pressable>
            </>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable onPress={onClose}>
            <Text style={styles.cancel}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { backgroundColor: '#101F1A', padding: 24, paddingBottom: 40, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#21403A', marginBottom: 16 },
  title: { color: '#ECF5F1', fontSize: 20, fontWeight: '700', marginBottom: 16 },
  label: { color: '#7FA89D', fontSize: 13, marginBottom: 6 },
  input: { backgroundColor: '#0A1512', borderColor: '#21403A', borderWidth: 1, borderRadius: 12, color: '#ECF5F1', paddingHorizontal: 14, height: 48, fontSize: 16 },
  primary: { backgroundColor: '#569F8C', borderRadius: 12, height: 50, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  primaryText: { color: '#071A14', fontSize: 16, fontWeight: '600' },
  error: { color: '#FF6B6B', marginTop: 12 },
  cancel: { color: '#7FA89D', textAlign: 'center', marginTop: 16, fontSize: 15 },
})
