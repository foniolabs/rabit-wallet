import React from 'react'
import { View, Text, StyleSheet, StatusBar } from 'react-native'
import {
  RabitProvider,
  WalletButton,
  WalletScreen,
  useAuth,
  PRESET_EVM_CHAINS,
  ETHEREUM_SEPOLIA,
  PRESET_SOLANA_CHAINS,
  theme as T,
} from 'rabitwallet-native'

const config = {
  projectId: process.env.EXPO_PUBLIC_RABIT_PROJECT_ID ?? 'dev-project',
  apiKey: process.env.EXPO_PUBLIC_RABIT_API_KEY ?? 'dev-api-key',
  apiBaseUrl: process.env.EXPO_PUBLIC_RABIT_API_BASE_URL ?? 'https://rabit-api-116474648478.us-central1.run.app',
  app: { name: 'Rabit Expo Demo' },
  evmChains: PRESET_EVM_CHAINS,
  defaultEvmChainId: ETHEREUM_SEPOLIA.id,
  solanaChains: PRESET_SOLANA_CHAINS,
  defaultSolanaCluster: 'devnet' as const,
  authMethods: ['email', 'google'] as const,
}

function Gate() {
  const { isAuthenticated } = useAuth()
  if (isAuthenticated) return <WalletScreen />
  return (
    <View style={styles.signin}>
      <Text style={styles.brand}>Rabit</Text>
      <Text style={styles.tag}>An embedded wallet from just an email.</Text>
      <View style={{ height: 28 }} />
      <WalletButton />
    </View>
  )
}

export default function App() {
  return (
    <RabitProvider config={config}>
      <StatusBar barStyle="light-content" />
      <Gate />
    </RabitProvider>
  )
}

const styles = StyleSheet.create({
  signin: { flex: 1, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center', padding: 32 },
  brand: { color: T.text, fontSize: 34, fontWeight: '800', letterSpacing: -0.5 },
  tag: { color: T.textSecondary, fontSize: 15.5, marginTop: 10, textAlign: 'center' },
})
