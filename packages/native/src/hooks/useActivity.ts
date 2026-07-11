/** useActivity — local activity feed (MMKV) + Solana on-chain history. */
import { useCallback, useEffect, useMemo, useState } from 'react'
import { getRecentSolanaMemos } from '@rabit/solana'
import { useRabitContext } from '../provider'
import { kv } from '../kv'

export type ActivityKind =
  | 'send_native'
  | 'send_token'
  | 'approve'
  | 'swap'
  | 'memo'
  | 'contract_call'
  | 'sign_message'
  | 'on_chain'

export interface ActivityEntry {
  id: string
  ecosystem: 'evm' | 'solana'
  chain: string
  kind: ActivityKind
  title: string
  subtitle?: string
  hash?: string
  explorerUrl?: string
  address: string
  timestamp: number
  status: 'pending' | 'confirmed' | 'failed'
}

const STORAGE_KEY_PREFIX = 'rabit:activity:'
const keyFor = (userId: string | null | undefined) => `${STORAGE_KEY_PREFIX}${userId ?? 'anon'}`

function loadLocal(userId: string | null | undefined): ActivityEntry[] {
  try {
    const raw = kv.getItem(keyFor(userId))
    return raw ? (JSON.parse(raw) as ActivityEntry[]) : []
  } catch {
    return []
  }
}

function saveLocal(userId: string | null | undefined, list: ActivityEntry[]) {
  try {
    kv.setItem(keyFor(userId), JSON.stringify(list.slice(0, 200)))
  } catch {
    /* noop */
  }
}

export interface UseActivityReturn {
  entries: ActivityEntry[]
  isLoading: boolean
  refresh: () => Promise<void>
  record: (entry: Omit<ActivityEntry, 'id'> & { id?: string }) => void
  clear: () => void
}

export function useActivity(): UseActivityReturn {
  const { core, auth, wallet } = useRabitContext()
  const userId = auth.user?.id ?? null
  const [local, setLocal] = useState<ActivityEntry[]>(() => loadLocal(userId))
  const [solanaOnChain, setSolanaOnChain] = useState<ActivityEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setLocal(loadLocal(userId))
  }, [userId])

  const refresh = useCallback(async () => {
    const owner = core.solanaAddress
    const slug = wallet.activeSolanaChainSlug
    if (!owner || !slug) {
      setSolanaOnChain([])
      return
    }
    const chain = core.getSolanaChain(slug)
    if (!chain) return
    setIsLoading(true)
    try {
      const entries = await getRecentSolanaMemos({ owner, rpcUrl: chain.rpcUrl, limit: 20 })
      const cluster = chain.cluster
      const clusterQ = cluster === 'mainnet-beta' ? '' : `?cluster=${cluster}`
      setSolanaOnChain(
        entries.map<ActivityEntry>((e) => ({
          id: e.signature,
          ecosystem: 'solana',
          chain: cluster,
          kind: e.memo ? 'memo' : 'on_chain',
          title: e.memo ? `Memo: ${e.memo}` : 'On-chain transaction',
          hash: e.signature,
          explorerUrl: `https://solscan.io/tx/${e.signature}${clusterQ}`,
          address: owner,
          timestamp: e.blockTime ? e.blockTime * 1000 : Date.now(),
          status: 'confirmed',
        })),
      )
    } catch {
      setSolanaOnChain([])
    } finally {
      setIsLoading(false)
    }
  }, [core, wallet.activeSolanaChainSlug])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const record = useCallback<UseActivityReturn['record']>(
    (entry) => {
      const id = entry.id ?? entry.hash ?? `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      const next = [{ ...entry, id }, ...local].slice(0, 200)
      setLocal(next)
      saveLocal(userId, next)
    },
    [local, userId],
  )

  const clear = useCallback(() => {
    setLocal([])
    saveLocal(userId, [])
  }, [userId])

  const entries = useMemo(() => {
    const merged = new Map<string, ActivityEntry>()
    for (const e of [...solanaOnChain, ...local]) {
      const key = e.hash ?? e.id
      const existing = merged.get(key)
      if (!existing || e.title !== 'On-chain transaction') merged.set(key, e)
    }
    return Array.from(merged.values()).sort((a, b) => b.timestamp - a.timestamp)
  }, [local, solanaOnChain])

  return { entries, isLoading, refresh, record, clear }
}
