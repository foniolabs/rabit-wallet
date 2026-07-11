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
        {/* top bar */}
        <View style={s.topbar}>
          <Text style={s.brand}>{user?.displayName ?? 'Rabit'}</Text>
          <Pressable onPress={onLogout ?? (() => logout())} hitSlop={10}>
            <Text style={s.logout}>⏻</Text>
          </Pressable>
        </View>

        {/* centered hero: orb + address + total */}
        <View style={s.hero}>
          <Avatar label={user?.displayName ?? user?.email ?? 'R'} size={76} />
          <Pressable style={s.addrChip}>
            <View style={s.dot} />
            <Text style={s.addr}>{shortAddress(evmAddress)}</Text>
          </Pressable>
          <Text style={s.heroTotal}>{total}</Text>
          <Text style={s.heroLabel}>Total balance</Text>
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
  topbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { color: T.text, fontSize: 16, fontWeight: '700' },
  logout: { color: T.textSecondary, fontSize: 20 },
  hero: { alignItems: 'center', marginTop: 24, marginBottom: 30 },
  addrChip: { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: T.surface, borderColor: T.border, borderWidth: 1, borderRadius: T.radius.pill, paddingHorizontal: 12, paddingVertical: 6, marginTop: 16 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: T.success },
  addr: { color: T.textSecondary, fontSize: 13, fontFamily: 'Courier' },
  heroLabel: { color: T.textMuted, fontSize: 13, marginTop: 4 },
  heroTotal: { color: T.text, fontSize: 44, fontWeight: '800', letterSpacing: -1.5, marginTop: 18 },
  actions: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 28 },
  tabs: { flexDirection: 'row', gap: 6, backgroundColor: T.surface, borderRadius: T.radius.pill, padding: 4, alignSelf: 'flex-start' },
  tab: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: T.radius.pill },
  tabActive: { backgroundColor: T.surfaceMuted },
  tabText: { color: T.textMuted, fontSize: 14, fontWeight: '500' },
  tabTextActive: { color: T.text },
  list: { marginTop: 8 },
})
