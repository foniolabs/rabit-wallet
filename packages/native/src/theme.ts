/** British-Racing-Green dark theme for the RN components. */
export const T = {
  bg: '#0A1512',
  surface: '#101F1A',
  surfaceMuted: '#162F29',
  card: '#132420',
  border: '#21403A',
  primary: '#569F8C',
  primaryText: '#071A14',
  text: '#ECF5F1',
  textSecondary: '#7FA89D',
  textMuted: '#4A6B62',
  success: '#4FD1A6',
  error: '#FF6B6B',
  radius: { sm: 10, md: 14, lg: 20, pill: 999 },
} as const

export function shortAddress(addr?: string | null): string {
  return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : ''
}
