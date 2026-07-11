import React from 'react'
import { Modal, View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native'
import { T } from '../theme'

/** A bottom sheet — the base for Send / Receive / Buy. */
export function Sheet({
  visible,
  onClose,
  title,
  children,
}: {
  visible: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={s.backdrop} onPress={onClose} />
      <View style={s.sheet}>
        <View style={s.handle} />
        <View style={s.sheetHeader}>
          <Text style={s.sheetTitle}>{title}</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={s.close}>✕</Text>
          </Pressable>
        </View>
        {children}
      </View>
    </Modal>
  )
}

/** A round action button (Receive / Send / Buy / Swap). */
export function ActionButton({ glyph, label, onPress }: { glyph: string; label: string; onPress?: () => void }) {
  return (
    <Pressable style={s.action} onPress={onPress}>
      <View style={s.actionCircle}>
        <Text style={s.actionGlyph}>{glyph}</Text>
      </View>
      <Text style={s.actionLabel}>{label}</Text>
    </Pressable>
  )
}

export function Avatar({ label, size = 40 }: { label: string; size?: number }) {
  return (
    <View style={[s.avatar, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[s.avatarText, { fontSize: size * 0.42 }]}>{label.slice(0, 1).toUpperCase()}</Text>
    </View>
  )
}

export function PrimaryButton({
  label,
  onPress,
  loading,
  disabled,
}: {
  label: string
  onPress?: () => void
  loading?: boolean
  disabled?: boolean
}) {
  return (
    <Pressable style={[s.primary, (disabled || loading) && s.primaryDisabled]} onPress={onPress} disabled={disabled || loading}>
      {loading ? <ActivityIndicator color={T.primaryText} /> : <Text style={s.primaryText}>{label}</Text>}
    </Pressable>
  )
}

const s = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: {
    backgroundColor: T.surface,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 36,
    borderTopLeftRadius: T.radius.lg,
    borderTopRightRadius: T.radius.lg,
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: T.border, marginBottom: 14 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  sheetTitle: { color: T.text, fontSize: 18, fontWeight: '700' },
  close: { color: T.textSecondary, fontSize: 16 },
  action: { alignItems: 'center', gap: 8 },
  actionCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: T.surfaceMuted,
    borderWidth: 1,
    borderColor: T.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionGlyph: { color: T.primary, fontSize: 22, fontWeight: '700' },
  actionLabel: { color: T.textSecondary, fontSize: 12.5, fontWeight: '500' },
  avatar: { backgroundColor: T.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: T.primaryText, fontWeight: '700' },
  primary: { backgroundColor: T.primary, height: 52, borderRadius: T.radius.md, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  primaryDisabled: { opacity: 0.5 },
  primaryText: { color: T.primaryText, fontSize: 16, fontWeight: '600' },
})
