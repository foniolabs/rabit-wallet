/**
 * Server-side fetch wrapper for the @rabit/api backend.
 *
 * Uses RABIT_API_URL and RABIT_API_KEY from the environment.
 * Both are server-only — they must NOT be exposed to the client.
 *
 * Auto-refreshes the access token on 401 using the stored refresh token,
 * then retries the original request once.
 */

import { getSession, setSession, clearSession } from '@/lib/session'

const API_URL = process.env.RABIT_API_URL || 'http://localhost:3001'
const API_KEY = process.env.RABIT_API_KEY || 'dev-api-key'

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; message: string; reason?: string }

type ApiInit = RequestInit & {
  /** Bearer token. If omitted, no Authorization header is sent. */
  token?: string
  /** Set false to skip the auto-refresh-on-401 retry (used internally to avoid loops). */
  autoRefresh?: boolean
}

async function rawRequest<T>(path: string, init: ApiInit = {}): Promise<ApiResult<T>> {
  const { token, headers, autoRefresh: _autoRefresh, ...rest } = init

  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...rest,
      cache: 'no-store',
      headers: {
        'content-type': 'application/json',
        'x-api-key': API_KEY,
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    })
  } catch (err) {
    return {
      ok: false,
      status: 0,
      message: 'Network error',
      reason: err instanceof Error ? err.message : 'fetch failed',
    }
  }

  let body: unknown
  try {
    body = await res.json()
  } catch {
    body = null
  }

  if (!res.ok) {
    const b = body as { message?: string; reason?: string } | null
    return {
      ok: false,
      status: res.status,
      message: b?.message || `HTTP ${res.status}`,
      reason: b?.reason,
    }
  }

  return { ok: true, data: body as T }
}

/**
 * Use the stored refresh token to mint a new access token and update
 * the session cookie. Returns the new access token, or null on failure.
 */
async function refreshAccessToken(): Promise<string | null> {
  const session = getSession()
  if (!session?.refreshToken) return null

  const result = await rawRequest<{
    token: string
    refreshToken: string
    expiresAt: number
  }>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken: session.refreshToken }),
    autoRefresh: false,
  })

  if (!result.ok) {
    clearSession()
    return null
  }

  setSession({
    ...session,
    accessToken: result.data.token,
    refreshToken: result.data.refreshToken,
    expiresAt: result.data.expiresAt,
  })

  return result.data.token
}

export async function apiRequest<T>(
  path: string,
  init: ApiInit = {},
): Promise<ApiResult<T>> {
  const first = await rawRequest<T>(path, init)

  // Only retry once, only on 401, only when we sent a token (i.e. an
  // authenticated call), and only when caller hasn't opted out.
  if (
    first.ok ||
    first.status !== 401 ||
    !init.token ||
    init.autoRefresh === false
  ) {
    return first
  }

  const newToken = await refreshAccessToken()
  if (!newToken) return first

  return rawRequest<T>(path, { ...init, token: newToken, autoRefresh: false })
}
