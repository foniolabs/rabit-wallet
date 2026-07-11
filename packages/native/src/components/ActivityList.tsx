import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useActivity, type ActivityEntry } from '../hooks/useActivity'
import { T } from '../theme'

const GLYPH: Record<string, string> = {
  send_native: '↑',
  send_token: '↑',
  swap: '⇄',
  memo: '≡',
  on_chain: '•',
  approve: '✓',
  contract_call: '›',
  sign_message: '✎',
}

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return 'now'
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  return `${Math.floor(s / 86400)}d`
}

function Row({ e }: { e: ActivityEntry }) {
  return (
    <View style={s.row}>
      <View style={s.icon}>
        <Text style={s.iconText}>{GLYPH[e.kind] ?? '•'}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.title} numberOfLines={1}>
          {e.title}
        </Text>
        {e.subtitle ? (
          <Text style={s.subtitle} numberOfLines={1}>
            {e.subtitle}
          </Text>
        ) : null}
      </View>
      <Text style={s.time}>{timeAgo(e.timestamp)}</Text>
    </View>
  )
}

export function ActivityList() {
  const { entries } = useActivity()
  if (entries.length === 0) {
    return <Text style={s.empty}>No activity yet.</Text>
  }
  return (
    <View>
      {entries.map((e) => (
        <Row key={e.id} e={e} />
      ))}
    </View>
  )
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  icon: { width: 40, height: 40, borderRadius: 20, backgroundColor: T.surfaceMuted, borderWidth: 1, borderColor: T.border, alignItems: 'center', justifyContent: 'center' },
  iconText: { color: T.primary, fontSize: 16, fontWeight: '700' },
  title: { color: T.text, fontSize: 14.5, fontWeight: '500' },
  subtitle: { color: T.textMuted, fontSize: 12.5, marginTop: 1 },
  time: { color: T.textMuted, fontSize: 12.5 },
  empty: { color: T.textMuted, textAlign: 'center', marginTop: 28, fontSize: 14 },
})
