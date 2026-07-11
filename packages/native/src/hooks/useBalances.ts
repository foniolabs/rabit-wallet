/** useBalances — native + token balances for the active chain, polled. */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { fetchEvmBalances, type EvmBalance, type EvmTokenDef } from '@rabit/evm'
import { fetchSolanaBalances, type SolanaBalance, type SolanaTokenDef } from '@rabit/solana'
import { useRabitContext } from '../provider'
import { useCustomTokens } from './useCustomTokens'

export interface UnifiedBalance {
  ecosystem: 'evm' | 'solana'
  symbol: string
  name: string
  decimals: number
  address: string | null
  raw: bigint
  formatted: string
  raw_def: EvmTokenDef | SolanaTokenDef
}

export interface UseBalancesReturn {
  balances: UnifiedBalance[]
  isLoading: boolean
  error: Error | null
  refresh: () => Promise<void>
  ecosystem: 'evm' | 'solana' | null
}

export interface UseBalancesOptions {
  pollIntervalMs?: number
}

export function useBalances({ pollIntervalMs = 15000 }: UseBalancesOptions = {}): UseBalancesReturn {
  const { core, wallet } = useRabitContext()
  const { evmTokens: getEvmCustom, solanaTokens: getSolCustom } = useCustomTokens()
  const [balances, setBalances] = useState<UnifiedBalance[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const reqIdRef = useRef(0)

  const ecosystem = wallet.activeAccount?.ecosystem ?? null
  const address = wallet.activeAccount?.address ?? null
  const evmChainId = wallet.activeChainId
  const solanaSlug = wallet.activeSolanaChainSlug

  const rpcUrl = useMemo(() => {
    if (ecosystem === 'evm' && evmChainId) return core.getEvmChain(evmChainId)?.rpcUrls.default[0]?.url
    if (ecosystem === 'solana' && solanaSlug) return core.getSolanaChain(solanaSlug)?.rpcUrl
    return undefined
  }, [ecosystem, evmChainId, solanaSlug, core])

  const refresh = useCallback(async () => {
    if (!ecosystem || !address) {
      setBalances([])
      return
    }
    const id = ++reqIdRef.current
    setIsLoading(true)
    setError(null)
    try {
      if (ecosystem === 'evm' && evmChainId) {
        const list = await fetchEvmBalances({
          owner: address as `0x${string}`,
          chainId: evmChainId,
          rpcUrl,
          extraTokens: getEvmCustom(evmChainId),
        })
        if (reqIdRef.current === id) setBalances(list.map(evmToUnified))
      } else if (ecosystem === 'solana' && solanaSlug && rpcUrl) {
        const chain = core.getSolanaChain(solanaSlug)
        if (!chain) return
        const list = await fetchSolanaBalances({
          owner: address,
          rpcUrl,
          cluster: chain.cluster,
          extraTokens: getSolCustom(chain.cluster),
        })
        if (reqIdRef.current === id) setBalances(list.map(solToUnified))
      }
    } catch (e) {
      if (reqIdRef.current === id) setError(e instanceof Error ? e : new Error('Failed to fetch balances'))
    } finally {
      if (reqIdRef.current === id) setIsLoading(false)
    }
  }, [ecosystem, address, evmChainId, solanaSlug, rpcUrl, core, getEvmCustom, getSolCustom])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (!pollIntervalMs) return
    const t = setInterval(refresh, pollIntervalMs)
    return () => clearInterval(t)
  }, [refresh, pollIntervalMs])

  return { balances, isLoading, error, refresh, ecosystem }
}

function evmToUnified(b: EvmBalance): UnifiedBalance {
  return {
    ecosystem: 'evm',
    symbol: b.token.symbol,
    name: b.token.name,
    decimals: b.token.decimals,
    address: b.token.address,
    raw: b.raw,
    formatted: b.formatted,
    raw_def: b.token,
  }
}

function solToUnified(b: SolanaBalance): UnifiedBalance {
  return {
    ecosystem: 'solana',
    symbol: b.token.symbol,
    name: b.token.name,
    decimals: b.token.decimals,
    address: b.token.mint,
    raw: b.raw,
    formatted: b.formatted,
    raw_def: b.token,
  }
}
