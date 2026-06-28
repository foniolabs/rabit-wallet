'use server'

import { redirect } from 'next/navigation'
import { apiRequest } from '@/lib/api'
import { clearSession, getSession, setSession } from '@/lib/session'

type SendOtpResponse = {
  message: string
  email: string
  devOtp?: string
}

type VerifyOtpResponse = {
  token: string
  refreshToken: string
  expiresAt: number
  user: {
    id: string
    email: string
    displayName?: string
    profileImage?: string
  }
  isNewUser: boolean
}

function loginRedirect(params: Record<string, string>): never {
  const qs = new URLSearchParams(params).toString()
  redirect(`/login?${qs}`)
}

/**
 * Step 1 — accept email, ask the API to send a 6-digit OTP, advance the
 * login UI to the OTP step.
 */
export async function requestOtpAction(formData: FormData) {
  const email = String(formData.get('email') || '').trim().toLowerCase()
  const next = String(formData.get('next') || '/')

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    loginRedirect({ error: 'invalid-email', next })
  }

  const result = await apiRequest<SendOtpResponse>('/auth/otp/send', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })

  if (!result.ok) {
    loginRedirect({
      error: 'send-failed',
      reason: result.reason || result.message,
      email,
      next,
    })
  }

  loginRedirect({
    step: 'otp',
    email,
    next,
    ...(result.data.devOtp ? { devOtp: result.data.devOtp } : {}),
  })
}

/**
 * Step 2 — verify the OTP, mint the cookie session.
 */
export async function verifyOtpAction(formData: FormData) {
  const email = String(formData.get('email') || '').trim().toLowerCase()
  const code = String(formData.get('code') || '').trim()
  const next = String(formData.get('next') || '/')

  if (!email || !/^\d{6}$/.test(code)) {
    loginRedirect({ step: 'otp', email, error: 'invalid-code', next })
  }

  const result = await apiRequest<VerifyOtpResponse>('/auth/otp/verify', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  })

  if (!result.ok) {
    loginRedirect({
      step: 'otp',
      email,
      error: result.status === 401 ? 'wrong-code' : 'verify-failed',
      reason: result.reason || result.message,
      next,
    })
  }

  setSession({
    userId: result.data.user.id,
    email: result.data.user.email,
    name: result.data.user.displayName || result.data.user.email.split('@')[0]!,
    profileImage: result.data.user.profileImage,
    accessToken: result.data.token,
    refreshToken: result.data.refreshToken,
    expiresAt: result.data.expiresAt,
  })

  redirect(next.startsWith('/') ? next : '/')
}

/**
 * Resend the OTP without re-entering the email.
 */
export async function resendOtpAction(formData: FormData) {
  const email = String(formData.get('email') || '').trim().toLowerCase()
  const next = String(formData.get('next') || '/')

  if (!email) loginRedirect({ next })

  await apiRequest('/auth/otp/send', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })

  loginRedirect({ step: 'otp', email, resent: '1', next })
}

type UpdateProfileResponse = {
  user: {
    id: string
    email: string
    displayName?: string
    profileImage?: string
  }
}

/**
 * PATCH /auth/me — update displayName / profileImage. Refreshes the session
 * cookie with the new values so the Topbar / Sidebar reflect the change
 * without a re-login.
 */
export async function updateProfileAction(formData: FormData) {
  const session = getSession()
  if (!session) redirect('/login')

  const displayName = String(formData.get('displayName') || '').trim()
  const profileImage = String(formData.get('profileImage') || '').trim()

  if (displayName && (displayName.length < 1 || displayName.length > 80)) {
    redirect('/settings?error=invalid-name')
  }
  if (profileImage && !/^https?:\/\/.+/.test(profileImage)) {
    redirect('/settings?error=invalid-image')
  }

  const patch: Record<string, string> = {}
  if (displayName) patch.displayName = displayName
  if (profileImage) patch.profileImage = profileImage

  if (Object.keys(patch).length === 0) {
    redirect('/settings?error=no-change')
  }

  const result = await apiRequest<UpdateProfileResponse>('/auth/me', {
    method: 'PATCH',
    token: session.accessToken,
    body: JSON.stringify(patch),
  })

  if (!result.ok) {
    if (result.status === 401) redirect('/login?next=/settings')
    redirect(`/settings?error=update-failed&reason=${encodeURIComponent(result.message)}`)
  }

  setSession({
    ...session,
    name: result.data.user.displayName || session.name,
    profileImage: result.data.user.profileImage,
  })

  redirect('/settings?ok=1')
}

export async function signOutAction() {
  const session = getSession()
  if (session) {
    await apiRequest('/auth/logout', {
      method: 'POST',
      token: session.accessToken,
      body: JSON.stringify({ refreshToken: session.refreshToken }),
    })
  }
  clearSession()
  redirect('/login')
}
