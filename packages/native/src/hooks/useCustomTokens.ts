/** useCustomTokens — user-imported tokens, persisted to MMKV. */
import { useCallback, useMemo, useState } from 'react'
import { readEvmContract, ERC20_ABI, type EvmTokenDef } from '@rabit/evm'
import type { ChainId, SolanaCluster } from '@rabit/types'
import { fetchSplMintDecimals, type SolanaTokenDef } from '@rabit/solana'
import { useRabitContext } from '../provider'
import { kv } from '../kv'

const EVM_STORAGE_KEY = 'rabit:customTokens:evm'
const SOL_STORAGE_KEY = 'rabit:customTokens:solana'

type PersistedEvmTokens = Record<number, EvmTokenDef[]>
type PersistedSolanaTokens = Record<string, SolanaTokenDef[]>

const loadEvm = (): PersistedEvmTokens => {
  try {
    const raw = kv.getItem(EVM_STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}
const saveEvm = (d: PersistedEvmTokens) => {
  try {
    kv.setItem(EVM_STORAGE_KEY, JSON.stringify(d))
  } catch {
    /* noop */
  }
}
const loadSol = (): PersistedSolanaTokens => {
  try {
    const raw = kv.getItem(SOL_STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}
const saveSol = (d: PersistedSolanaTokens) => {
  try {
    kv.setItem(SOL_STORAGE_KEY, JSON.stringify(d))
  } catch {
    /* noop */
  }
}

export interface UseCustomTokensReturn {
  evmTokens: (chainId: ChainId) => EvmTokenDef[]
  solanaTokens: (cluster: SolanaCluster) => SolanaTokenDef[]
  importEvm: (args: { chainId: ChainId; address: `0x${string}` }) => Promise<EvmTokenDef>
  importSolana: (args: { cluster: SolanaCluster; mint: string; rpcUrl: string }) => Promise<SolanaTokenDef>
  remove: (
    args:
      | { ecosystem: 'evm'; chainId: ChainId; address: string }
      | { ecosystem: 'solana'; cluster: SolanaCluster; mint: string },
  ) => void
}

export function useCustomTokens(): UseCustomTokensReturn {
  const { core } = useRabitContext()
  const [evm, setEvm] = useState<PersistedEvmTokens>(() => loadEvm())
  const [sol, setSol] = useState<PersistedSolanaTokens>(() => loadSol())

  const evmTokens = useCallback((chainId: ChainId) => evm[chainId as number] ?? [], [evm])
  const solanaTokens = useCallback((cluster: SolanaCluster) => sol[cluster] ?? [], [sol])

  const importEvm = useCallback(
    async ({ chainId, address }: { chainId: ChainId; address: `0x${string}` }) => {
      const chain = core.getEvmChain(chainId)
      if (!chain) throw new Error(`Chain ${chainId} not registered`)
      const rpcUrl = chain.rpcUrls.default[0]?.url
      const [symbol, name, decimals] = await Promise.all([
        readEvmContract<string>({ chainId, address, abi: ERC20_ABI, functionName: 'symbol', rpcUrl }),
        readEvmContract<string>({ chainId, address, abi: ERC20_ABI, functionName: 'name', rpcUrl }),
        readEvmContract<number>({ chainId, address, abi: ERC20_ABI, functionName: 'decimals', rpcUrl }),
      ])
      const token: EvmTokenDef = { symbol, name, decimals: Number(decimals), address }
      const next = { ...evm }
      const list = (next[chainId as number] ?? []).filter(
        (t) => t.address?.toLowerCase() !== address.toLowerCase(),
      )
      list.push(token)
      next[chainId as number] = list
      setEvm(next)
      saveEvm(next)
      return token
    },
    [evm, core],
  )

  const importSolana = useCallback(
    async ({ cluster, mint, rpcUrl }: { cluster: SolanaCluster; mint: string; rpcUrl: string }) => {
      const decimals = await fetchSplMintDecimals({ mint, rpcUrl })
      if (decimals == null) throw new Error("Couldn't read mint info — is the mint address correct?")
      const token: SolanaTokenDef = {
        symbol: mint.slice(0, 4),
        name: `Token ${mint.slice(0, 6)}…${mint.slice(-4)}`,
        decimals,
        mint,
      }
      const next = { ...sol }
      const list = (next[cluster] ?? []).filter((t) => t.mint !== mint)
      list.push(token)
      next[cluster] = list
      setSol(next)
      saveSol(next)
      return token
    },
    [sol],
  )

  const remove = useCallback<UseCustomTokensReturn['remove']>(
    (args) => {
      if (args.ecosystem === 'evm') {
        const next = { ...evm }
        next[args.chainId as number] = (next[args.chainId as number] ?? []).filter(
          (t) => t.address?.toLowerCase() !== args.address.toLowerCase(),
        )
        setEvm(next)
        saveEvm(next)
      } else {
        const next = { ...sol }
        next[args.cluster] = (next[args.cluster] ?? []).filter((t) => t.mint !== args.mint)
        setSol(next)
        saveSol(next)
      }
    },
    [evm, sol],
  )

  return useMemo(
    () => ({ evmTokens, solanaTokens, importEvm, importSolana, remove }),
    [evmTokens, solanaTokens, importEvm, importSolana, remove],
  )
}
