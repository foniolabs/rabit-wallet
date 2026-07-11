/** useSwap — quote + execute swaps (LiFi on EVM, Jupiter on Solana). */
import { useCallback, useState } from 'react'
import {
  getLiFiQuote,
  executeLiFiQuote,
  formatLiFiAmount,
  LIFI_NATIVE_ADDRESS,
  parseUnits,
  type LiFiQuote,
} from '@rabit/evm'
import { getJupiterQuote, executeJupiterSwap, SOL_MINT, type JupiterQuote } from '@rabit/solana'
import { useRabitContext } from '../provider'
import { useActivity } from './useActivity'

export interface SwapQuote {
  ecosystem: 'evm' | 'solana'
  toAmountFormatted: string
  toAmountMinFormatted: string
  routeName: string
  gasUsd?: string
  priceImpactPct?: number
  raw: LiFiQuote | JupiterQuote
}

export interface SwapTokenSpec {
  address: string | null
  decimals: number
  symbol: string
  chainId?: number
}

export interface UseSwapReturn {
  quote: SwapQuote | null
  isQuoting: boolean
  isSwapping: boolean
  error: Error | null
  getQuote: (args: { from: SwapTokenSpec; to: SwapTokenSpec; amount: string; slippageBps?: number }) => Promise<SwapQuote>
  execute: () => Promise<{ hash: string; explorerUrl?: string }>
  reset: () => void
}

export function useSwap(): UseSwapReturn {
  const { core, wallet } = useRabitContext()
  const activity = useActivity()
  const [quote, setQuote] = useState<SwapQuote | null>(null)
  const [isQuoting, setIsQuoting] = useState(false)
  const [isSwapping, setIsSwapping] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const getQuote = useCallback<UseSwapReturn['getQuote']>(
    async ({ from, to, amount, slippageBps }) => {
      const ecosystem = wallet.activeAccount?.ecosystem
      if (!ecosystem) throw new Error('No active account')
      setIsQuoting(true)
      setError(null)
      try {
        if (ecosystem === 'evm') {
          const fromChainId = from.chainId ?? wallet.activeChainId
          const toChainId = to.chainId ?? wallet.activeChainId
          if (!fromChainId || !toChainId) throw new Error('No active EVM chain')
          const fromAddress = (core.evmAddress ?? '0x') as `0x${string}`
          const fromAmount = parseUnits(amount, from.decimals).toString()
          const lifi = await getLiFiQuote({
            fromChainId,
            toChainId,
            fromTokenAddress: (from.address ?? LIFI_NATIVE_ADDRESS) as `0x${string}`,
            toTokenAddress: (to.address ?? LIFI_NATIVE_ADDRESS) as `0x${string}`,
            fromAmount,
            fromAddress,
            slippage: slippageBps != null ? slippageBps / 10000 : undefined,
          })
          const next: SwapQuote = {
            ecosystem: 'evm',
            toAmountFormatted: formatLiFiAmount(lifi.toAmount, to.decimals),
            toAmountMinFormatted: formatLiFiAmount(lifi.toAmountMin, to.decimals),
            routeName: lifi.toolName,
            gasUsd: lifi.gasCostUSD,
            raw: lifi,
          }
          setQuote(next)
          return next
        }

        if (!wallet.activeSolanaChainSlug) throw new Error('No active Solana chain')
        const inputMint = from.address ?? SOL_MINT
        const outputMint = to.address ?? SOL_MINT
        const amountRaw = BigInt(Math.round(parseFloat(amount) * Math.pow(10, from.decimals))).toString()
        const jup = await getJupiterQuote({ inputMint, outputMint, amount: amountRaw, slippageBps: slippageBps ?? 50 })
        const fmtFromRaw = (raw: string) => (Number(raw) / Math.pow(10, to.decimals)).toString()
        const next: SwapQuote = {
          ecosystem: 'solana',
          toAmountFormatted: fmtFromRaw(jup.outAmount),
          toAmountMinFormatted: fmtFromRaw(jup.otherAmountThreshold),
          routeName: 'Jupiter',
          priceImpactPct: parseFloat(jup.priceImpactPct) * 100,
          raw: jup,
        }
        setQuote(next)
        return next
      } catch (e) {
        const err = e instanceof Error ? e : new Error('Quote failed')
        setError(err)
        throw err
      } finally {
        setIsQuoting(false)
      }
    },
    [core, wallet],
  )

  const execute = useCallback<UseSwapReturn['execute']>(async () => {
    if (!quote) throw new Error('No quote — call getQuote first')
    setIsSwapping(true)
    setError(null)
    try {
      if (quote.ecosystem === 'evm') {
        const pk = core.getEvmPrivateKey()
        if (!pk) throw new Error('Wallet not unlocked')
        const chainId = wallet.activeChainId
        if (!chainId) throw new Error('No active EVM chain')
        const chain = core.getEvmChain(chainId)
        const hash = await executeLiFiQuote({
          quote: quote.raw as LiFiQuote,
          privateKey: pk,
          rpcUrl: chain?.rpcUrls.default[0]?.url,
        })
        const explorer = chain?.blockExplorers?.default.url
        const explorerUrl = explorer ? `${explorer}/tx/${hash}` : undefined
        activity.record({
          ecosystem: 'evm',
          chain: String(chainId),
          kind: 'swap',
          title: `Swapped via ${quote.routeName}`,
          subtitle: `${quote.toAmountFormatted} received`,
          hash,
          explorerUrl,
          address: core.evmAddress ?? '',
          timestamp: Date.now(),
          status: 'confirmed',
        })
        return { hash, explorerUrl }
      }

      const slug = wallet.activeSolanaChainSlug
      if (!slug) throw new Error('No active Solana chain')
      const chain = core.getSolanaChain(slug)
      if (!chain) throw new Error(`Chain ${slug} not registered`)
      const pk = core.getSolanaPrivateKey()
      if (!pk) throw new Error('Wallet not unlocked')
      const sig = await executeJupiterSwap({ quote: quote.raw as JupiterQuote, privateKeyHex: pk, rpcUrl: chain.rpcUrl })
      const explorerUrl =
        chain.cluster === 'mainnet-beta'
          ? `https://solscan.io/tx/${sig}`
          : `https://solscan.io/tx/${sig}?cluster=${chain.cluster}`
      activity.record({
        ecosystem: 'solana',
        chain: chain.cluster,
        kind: 'swap',
        title: `Swapped via ${quote.routeName}`,
        subtitle: `${quote.toAmountFormatted} received`,
        hash: sig,
        explorerUrl,
        address: core.solanaAddress ?? '',
        timestamp: Date.now(),
        status: 'confirmed',
      })
      return { hash: sig, explorerUrl }
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Swap failed')
      setError(err)
      throw err
    } finally {
      setIsSwapping(false)
    }
  }, [core, wallet, quote, activity])

  const reset = useCallback(() => {
    setQuote(null)
    setError(null)
  }, [])

  return { quote, isQuoting, isSwapping, error, getQuote, execute, reset }
}
