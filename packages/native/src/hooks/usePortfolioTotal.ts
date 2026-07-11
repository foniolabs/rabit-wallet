/** usePortfolioTotal — sum token balances into a single USD figure (CoinGecko). */
import { useEffect, useMemo, useState } from 'react'
import { useBalances } from './useBalances'

const COINGECKO_IDS: Record<string, string> = {
  ETH: 'ethereum',
  POL: 'matic-network',
  MATIC: 'matic-network',
  BNB: 'binancecoin',
  SOL: 'solana',
  USDC: 'usd-coin',
  USDT: 'tether',
  WBTC: 'wrapped-bitcoin',
  BTC: 'bitcoin',
  DAI: 'dai',
}

const PRICE_CACHE: Record<string, { price: number; expiry: number }> = {}

async function getPrices(symbols: string[]): Promise<Record<string, number>> {
  const ids: Record<string, string> = {}
  const now = Date.now()
  const out: Record<string, number> = {}
  for (const sym of symbols) {
    const cgId = COINGECKO_IDS[sym.toUpperCase()]
    if (!cgId) continue
    const cached = PRICE_CACHE[cgId]
    if (cached && cached.expiry > now) out[sym] = cached.price
    else ids[sym] = cgId
  }
  const idsToFetch = Array.from(new Set(Object.values(ids)))
  if (idsToFetch.length === 0) return out
  try {
    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${idsToFetch.join(',')}&vs_currencies=usd`)
    const json = (await res.json()) as Record<string, { usd?: number }>
    for (const [sym, cgId] of Object.entries(ids)) {
      const price = json[cgId]?.usd
      if (typeof price === 'number') {
        PRICE_CACHE[cgId] = { price, expiry: now + 60_000 }
        out[sym] = price
      }
    }
  } catch {
    /* leave caller with cached prices */
  }
  return out
}

export interface PortfolioTotalResult {
  totalUsd: number | null
  breakdown: Array<{ symbol: string; amount: number; price: number; usd: number }>
  isLoading: boolean
  refresh: () => Promise<void>
}

export function usePortfolioTotal(): PortfolioTotalResult {
  const { balances } = useBalances()
  const [prices, setPrices] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(false)

  const balanceKey = useMemo(() => balances.map((b) => b.symbol).sort().join(','), [balances])

  const refresh = useMemo(
    () => async () => {
      if (balances.length === 0) {
        setPrices({})
        return
      }
      setIsLoading(true)
      try {
        setPrices(await getPrices(balances.map((b) => b.symbol)))
      } finally {
        setIsLoading(false)
      }
    },
    [balances],
  )

  useEffect(() => {
    void refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [balanceKey])

  const breakdown = useMemo(
    () =>
      balances.map((b) => {
        const amount = parseFloat(b.formatted) || 0
        const price = prices[b.symbol] ?? 0
        return { symbol: b.symbol, amount, price, usd: amount * price }
      }),
    [balances, prices],
  )

  const totalUsd = useMemo(() => {
    if (Object.keys(prices).length === 0 && balances.length > 0) return null
    return breakdown.reduce((sum, x) => sum + x.usd, 0)
  }, [breakdown, prices, balances])

  return { totalUsd, breakdown, isLoading, refresh }
}
