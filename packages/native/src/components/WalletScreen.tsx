import React, { useState } from 'react'
import { View, Text, Pressable, ScrollView, StyleSheet, SafeAreaView } from 'react-native'
import { useAuth, useWallet } from '../hooks/useAuth'
import { usePortfolioTotal } from '../hooks/usePortfolioTotal'
import { Avatar, ActionButton } from './ui'
import { TokenList } from './TokenList'
import { ActivityList } from './ActivityList'
import { SendSheet } from './SendSheet'
import { ReceiveSheet } from './ReceiveSheet'
import { BuySheet } from './BuySheet'
import { T, shortAddress } from '../theme'

type Sheet = 'send' | 'receive' | 'buy' | null
type Tab = 'tokens' | 'activity'

/**
 * The full embedded wallet screen — MetaMask-style: account header, portfolio
 * total, Receive/Send/Buy/Swap actions, and Tokens/Activity tabs. Drop it into
 * a screen inside <RabitProvider>. Swap opens via `onSwap` (wire your own
 * screen using useSwap) — kept out of the sheet set to stay focused.
 */
export function WalletScreen({ onSwap, onLogout }: { onSwap?: () => void; onLogout?: () => void }) {
  const { user, logout } = useAuth()
  const { evmAddress } = useWallet()
  const { totalUsd, isLoading } = usePortfolioTotal()
  const [sheet, setSheet] = useState<Sheet>(null)
  const [tab, setTab] = useState<Tab>('tokens')

  const total = totalUsd == null ? (isLoading ? '—' : '$0.00') : `$${totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* header */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <Avatar label={user?.displayName ?? user?.email ?? 'R'} size={38} />
            <View>
              <Text style={s.name}>{user?.displayName ?? user?.email ?? 'Wallet'}</Text>
              <Text style={s.addr}>{shortAddress(evmAddress)}</Text>
            </View>
          </View>
          <Pressable onPress={onLogout ?? (() => logout())} hitSlop={10}>
            <Text style={s.logout}>⏻</Text>
          </Pressable>
        </View>

        {/* portfolio total */}
        <View style={s.hero}>
          <Text style={s.heroLabel}>Total balance</Text>
          <Text style={s.heroTotal}>{total}</Text>
        </View>

        {/* actions */}
        <View style={s.actions}>
          <ActionButton glyph="↓" label="Receive" onPress={() => setSheet('receive')} />
          <ActionButton glyph="↑" label="Send" onPress={() => setSheet('send')} />
          <ActionButton glyph="+" label="Buy" onPress={() => setSheet('buy')} />
          <ActionButton glyph="⇄" label="Swap" onPress={onSwap} />
        </View>

        {/* tabs */}
        <View style={s.tabs}>
          <Pressable onPress={() => setTab('tokens')} style={[s.tab, tab === 'tokens' && s.tabActive]}>
            <Text style={[s.tabText, tab === 'tokens' && s.tabTextActive]}>Tokens</Text>
          </Pressable>
          <Pressable onPress={() => setTab('activity')} style={[s.tab, tab === 'activity' && s.tabActive]}>
            <Text style={[s.tabText, tab === 'activity' && s.tabTextActive]}>Activity</Text>
          </Pressable>
        </View>

        <View style={s.list}>{tab === 'tokens' ? <TokenList onSelect={() => setSheet('send')} /> : <ActivityList />}</View>
      </ScrollView>

      <SendSheet visible={sheet === 'send'} onClose={() => setSheet(null)} />
      <ReceiveSheet visible={sheet === 'receive'} onClose={() => setSheet(null)} />
      <BuySheet visible={sheet === 'buy'} onClose={() => setSheet(null)} />
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: T.bg },
  content: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { color: T.text, fontSize: 15.5, fontWeight: '600' },
  addr: { color: T.textMuted, fontSize: 12.5, fontFamily: 'Courier', marginTop: 1 },
  logout: { color: T.textSecondary, fontSize: 20 },
  hero: { alignItems: 'center', marginTop: 32, marginBottom: 28 },
  heroLabel: { color: T.textSecondary, fontSize: 13.5 },
  heroTotal: { color: T.text, fontSize: 42, fontWeight: '800', letterSpacing: -1, marginTop: 6 },
  actions: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 28 },
  tabs: { flexDirection: 'row', gap: 6, backgroundColor: T.surface, borderRadius: T.radius.pill, padding: 4, alignSelf: 'flex-start' },
  tab: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: T.radius.pill },
  tabActive: { backgroundColor: T.surfaceMuted },
  tabText: { color: T.textMuted, fontSize: 14, fontWeight: '500' },
  tabTextActive: { color: T.text },
  list: { marginTop: 8 },
})
