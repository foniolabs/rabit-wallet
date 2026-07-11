/** useOnRamp — on-ramp / off-ramp (identical to web; drives the OnRampEngine). */
import { useState, useCallback, useRef } from 'react'
import type {
  FiatCurrency,
  PaymentMethod,
  PayoutMethod,
  OnRampQuote,
  OffRampQuote,
  OnRampOrder,
  OffRampOrder,
  BankAccount,
  MobileMoneyAccount,
  CryptoAsset,
} from '@rabit/types'
import { OnRampEngine } from '@rabit/onramp'
import { useRabitContext } from '../provider'

export interface UseOnRampReturn {
  quote: OnRampQuote | null
  offRampQuote: OffRampQuote | null
  activeOrder: OnRampOrder | OffRampOrder | null
  supportedAssets: CryptoAsset[]
  isLoading: boolean
  error: Error | null
  getQuote: (params: {
    fiatAmount: string
    fiatCurrency: FiatCurrency
    cryptoAsset: string
    chain: 'evm' | 'solana'
    paymentMethod: PaymentMethod
  }) => Promise<OnRampQuote>
  buyWithQuote: (params: { quoteId: string; paymentDetails?: BankAccount | MobileMoneyAccount }) => Promise<OnRampOrder>
  getOffRampQuote: (params: {
    cryptoAmount: string
    cryptoAsset: string
    chain: 'evm' | 'solana'
    fiatCurrency: FiatCurrency
    payoutMethod: PayoutMethod
  }) => Promise<OffRampQuote>
  sellWithQuote: (params: { quoteId: string; payoutDetails: BankAccount | MobileMoneyAccount }) => Promise<OffRampOrder>
  getSupportedAssets: () => Promise<CryptoAsset[]>
  clearQuote: () => void
}

export function useOnRamp(): UseOnRampReturn {
  const { config, auth, wallet } = useRabitContext()
  const engineRef = useRef<OnRampEngine | null>(null)

  const [quote, setQuote] = useState<OnRampQuote | null>(null)
  const [offRampQuote, setOffRampQuote] = useState<OffRampQuote | null>(null)
  const [activeOrder, setActiveOrder] = useState<OnRampOrder | OffRampOrder | null>(null)
  const [supportedAssets, setSupportedAssets] = useState<CryptoAsset[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const getEngine = useCallback(() => {
    if (!engineRef.current) {
      engineRef.current = new OnRampEngine({
        apiBaseUrl: config.apiBaseUrl ?? 'https://api.rabit.com',
        apiKey: config.apiKey,
        projectId: config.projectId,
      })
    }
    if (auth.session?.token) engineRef.current.setAuthToken(auth.session.token)
    return engineRef.current
  }, [config.apiBaseUrl, config.apiKey, config.projectId, auth.session?.token])

  const getQuote = useCallback<UseOnRampReturn['getQuote']>(
    async (params) => {
      setIsLoading(true)
      setError(null)
      try {
        const q = await getEngine().getQuote(params)
        setQuote(q)
        return q
      } catch (e) {
        const err = e instanceof Error ? e : new Error('Failed to get quote')
        setError(err)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [getEngine],
  )

  const buyWithQuote = useCallback<UseOnRampReturn['buyWithQuote']>(
    async (params) => {
      if (!wallet.activeAccount) throw new Error('No active wallet account')
      setIsLoading(true)
      setError(null)
      try {
        const order = await getEngine().createOrder({
          quoteId: params.quoteId,
          destinationAddress: wallet.activeAccount.address,
          destinationChain: wallet.activeAccount.ecosystem,
          paymentDetails: params.paymentDetails,
        })
        setActiveOrder(order)
        return order
      } catch (e) {
        const err = e instanceof Error ? e : new Error('Failed to create order')
        setError(err)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [getEngine, wallet.activeAccount],
  )

  const getOffRampQuote = useCallback<UseOnRampReturn['getOffRampQuote']>(
    async (params) => {
      setIsLoading(true)
      setError(null)
      try {
        const q = await getEngine().getOffRampQuote(params)
        setOffRampQuote(q)
        return q
      } catch (e) {
        const err = e instanceof Error ? e : new Error('Failed to get off-ramp quote')
        setError(err)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [getEngine],
  )

  const sellWithQuote = useCallback<UseOnRampReturn['sellWithQuote']>(
    async (params) => {
      if (!wallet.activeAccount) throw new Error('No active wallet account')
      setIsLoading(true)
      setError(null)
      try {
        const order = await getEngine().createOffRampOrder({
          quoteId: params.quoteId,
          sourceAddress: wallet.activeAccount.address,
          sourceChain: wallet.activeAccount.ecosystem,
          payoutDetails: params.payoutDetails,
        })
        setActiveOrder(order)
        return order
      } catch (e) {
        const err = e instanceof Error ? e : new Error('Failed to create off-ramp order')
        setError(err)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [getEngine, wallet.activeAccount],
  )

  const getSupportedAssets = useCallback(async () => {
    const assets = await getEngine().getSupportedAssets()
    setSupportedAssets(assets)
    return assets
  }, [getEngine])

  const clearQuote = useCallback(() => {
    setQuote(null)
    setOffRampQuote(null)
  }, [])

  return {
    quote,
    offRampQuote,
    activeOrder,
    supportedAssets,
    isLoading,
    error,
    getQuote,
    buyWithQuote,
    getOffRampQuote,
    sellWithQuote,
    getSupportedAssets,
    clearQuote,
  }
}
