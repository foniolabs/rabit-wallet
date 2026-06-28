import { cookies } from 'next/headers'

export const SESSION_COOKIE = 'rabit_session'
const ONE_MONTH = 60 * 60 * 24 * 30

export type Session = {
  userId: string
  email: string
  name: string
  profileImage?: string
  accessToken: string
  refreshToken: string
  expiresAt: number
}

export function getSession(): Session | null {
  const raw = cookies().get(SESSION_COOKIE)?.value
  if (!raw) return null
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as Session
    if (!parsed.accessToken || !parsed.refreshToken) return null
    return parsed
  } catch {
    return null
  }
}

export function setSession(session: Session) {
  cookies().set(SESSION_COOKIE, encodeURIComponent(JSON.stringify(session)), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ONE_MONTH,
  })
}

export function clearSession() {
  cookies().delete(SESSION_COOKIE)
}
