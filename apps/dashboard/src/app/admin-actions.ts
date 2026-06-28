'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { apiRequest } from '@/lib/api'
import { getSession } from '@/lib/session'

export type Project = {
  id: string
  name: string
  tier: string
  createdAt: number
  updatedAt: number
  userCount: number
  keyCount: number
}

export type ApiKey = {
  id: string
  name: string
  prefix: string
  environment: string
  createdAt: number
  lastUsedAt: number | null
  revokedAt: number | null
  fullKey?: string
}

function requireSession() {
  const session = getSession()
  if (!session) redirect('/login')
  return session
}

// ---------- Projects ----------

export async function listProjects(): Promise<Project[]> {
  const session = requireSession()
  const result = await apiRequest<{ projects: Project[] }>('/admin/projects', {
    token: session.accessToken,
  })
  if (!result.ok) {
    if (result.status === 401) redirect('/login')
    throw new Error(result.message)
  }
  return result.data.projects
}

export async function createProjectAction(formData: FormData) {
  const session = requireSession()
  const name = String(formData.get('name') || '').trim()

  if (!name) redirect('/projects?error=name-required')

  const result = await apiRequest<{
    project: Project
    apiKey: { fullKey: string; prefix: string; environment: string; name: string }
  }>('/admin/projects', {
    method: 'POST',
    token: session.accessToken,
    body: JSON.stringify({ name }),
  })

  if (!result.ok) {
    redirect(`/projects?error=create-failed&reason=${encodeURIComponent(result.message)}`)
  }

  // Show the freshly-minted key on the api-keys page once.
  revalidatePath('/projects')
  revalidatePath('/api-keys')
  redirect(
    `/api-keys?projectId=${result.data.project.id}&newKey=${encodeURIComponent(
      result.data.apiKey.fullKey,
    )}&newKeyName=${encodeURIComponent(result.data.apiKey.name)}`,
  )
}

export async function deleteProjectAction(formData: FormData) {
  const session = requireSession()
  const id = String(formData.get('id') || '')
  if (!id) redirect('/projects')

  const result = await apiRequest(`/admin/projects/${id}`, {
    method: 'DELETE',
    token: session.accessToken,
  })

  if (!result.ok) {
    redirect(`/projects?error=delete-failed&reason=${encodeURIComponent(result.message)}`)
  }

  revalidatePath('/projects')
  revalidatePath('/api-keys')
  redirect('/projects?ok=deleted')
}

// ---------- API Keys ----------

// ---------- Usage ----------

export type UsagePoint = {
  bucket: number
  requests: number
  errors: number
  avgMs: number
}

export type UsageReport = {
  window: '24h' | '7d' | '30d'
  bucket: 'hour' | 'day'
  since: number
  totals: { requests: number; errors: number; avgMs: number }
  series: UsagePoint[]
  topRoutes: Array<{ route: string; method: string; requests: number }>
}

export async function getUsageReport(
  windowKey: '24h' | '7d' | '30d' = '7d',
): Promise<UsageReport> {
  const session = requireSession()
  const result = await apiRequest<UsageReport>(`/admin/usage?window=${windowKey}`, {
    token: session.accessToken,
  })
  if (!result.ok) {
    if (result.status === 401) redirect('/login')
    throw new Error(result.message)
  }
  return result.data
}

export async function listApiKeys(projectId: string): Promise<ApiKey[]> {
  const session = requireSession()
  const result = await apiRequest<{ keys: ApiKey[] }>(
    `/admin/projects/${projectId}/keys`,
    { token: session.accessToken },
  )
  if (!result.ok) {
    if (result.status === 401) redirect('/login')
    if (result.status === 404) return []
    throw new Error(result.message)
  }
  return result.data.keys
}

export async function createApiKeyAction(formData: FormData) {
  const session = requireSession()
  const projectId = String(formData.get('projectId') || '')
  const name = String(formData.get('name') || '').trim()
  const environment =
    (String(formData.get('environment') || 'production') as
      | 'production'
      | 'staging'
      | 'development') || 'production'

  if (!projectId || !name) {
    redirect(`/api-keys?projectId=${projectId}&error=invalid-input`)
  }

  const result = await apiRequest<{ key: ApiKey }>(
    `/admin/projects/${projectId}/keys`,
    {
      method: 'POST',
      token: session.accessToken,
      body: JSON.stringify({ name, environment }),
    },
  )

  if (!result.ok) {
    redirect(
      `/api-keys?projectId=${projectId}&error=create-failed&reason=${encodeURIComponent(result.message)}`,
    )
  }

  revalidatePath('/api-keys')
  redirect(
    `/api-keys?projectId=${projectId}&newKey=${encodeURIComponent(
      result.data.key.fullKey!,
    )}&newKeyName=${encodeURIComponent(result.data.key.name)}`,
  )
}

export async function revokeApiKeyAction(formData: FormData) {
  const session = requireSession()
  const projectId = String(formData.get('projectId') || '')
  const keyId = String(formData.get('keyId') || '')
  if (!projectId || !keyId) redirect('/api-keys')

  const result = await apiRequest(`/admin/projects/${projectId}/keys/${keyId}`, {
    method: 'DELETE',
    token: session.accessToken,
  })

  if (!result.ok) {
    redirect(
      `/api-keys?projectId=${projectId}&error=revoke-failed&reason=${encodeURIComponent(result.message)}`,
    )
  }

  revalidatePath('/api-keys')
  redirect(`/api-keys?projectId=${projectId}&ok=revoked`)
}
