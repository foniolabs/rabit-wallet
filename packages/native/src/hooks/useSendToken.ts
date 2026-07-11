/** useSendToken — send native or token transfers on the active chain. */
import { useCallback, useState } from 'react'
import { sendEvmNative, sendEvmErc20 } from '@rabit/evm'
import { sendSolanaNative, sendSolanaSplToken } from '@rabit/solana'
import { useRabitContext } from '../provider'
import { useActivity } from './useActivity'
import type { UnifiedBalance } from './useBalances'

export interface SendArgs {
  token: UnifiedBalance
  to: string
  amount: string
}

export interface UseSendTokenReturn {
  send: (args: SendArgs) => Promise<{ hash: string; explorerUrl?: string }>
  isSending: boolean
  error: Error | null
  reset: () => void
}

export function useSendToken(): UseSendTokenReturn {
  const { core, wallet } = useRabitContext()
  const activity = useActivity()
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const send = useCallback(
    async ({ token, to, amount }: SendArgs) => {
      setIsSending(true)
      setError(null)
      try {
        if (token.ecosystem === 'evm') {
          const chainId = wallet.activeChainId
          if (!chainId) throw new Error('No active EVM chain')
          const chain = core.getEvmChain(chainId)
          if (!chain) throw new Error(`Chain ${chainId} not registered`)
          const pk = core.getEvmPrivateKey()
          if (!pk) throw new Error('Wallet not unlocked')
          const rpcUrl = chain.rpcUrls.default[0].url

          const hash = token.address
            ? await sendEvmErc20({
                privateKey: pk,
                chainId,
                tokenAddress: token.address as `0x${string}`,
                decimals: token.decimals,
                to: to as `0x${string}`,
                amount,
                rpcUrl,
              })
            : await sendEvmNative({ privateKey: pk, chainId, to: to as `0x${string}`, amount, rpcUrl })

          const explorer = chain.blockExplorers?.default.url
          const explorerUrl = explorer ? `${explorer}/tx/${hash}` : undefined
          activity.record({
            ecosystem: 'evm',
            chain: String(chainId),
            kind: token.address ? 'send_token' : 'send_native',
            title: `Sent ${amount} ${token.symbol}`,
            subtitle: `to ${to.slice(0, 8)}…${to.slice(-4)}`,
            hash,
            explorerUrl,
            address: core.evmAddress ?? '',
            timestamp: Date.now(),
            status: 'confirmed',
          })
          return { hash, explorerUrl }
        }

        // Solana
        const slug = wallet.activeSolanaChainSlug
        if (!slug) throw new Error('No active Solana chain')
        const chain = core.getSolanaChain(slug)
        if (!chain) throw new Error(`Solana chain ${slug} not registered`)
        const pk = core.getSolanaPrivateKey()
        if (!pk) throw new Error('Wallet not unlocked')

        const sig = token.address
          ? await sendSolanaSplToken({
              privateKeyHex: pk,
              rpcUrl: chain.rpcUrl,
              mint: token.address,
              decimals: token.decimals,
              to,
              amount,
            })
          : await sendSolanaNative({ privateKeyHex: pk, rpcUrl: chain.rpcUrl, to, amount })

        const cluster = chain.cluster
        const explorerUrl =
          cluster === 'mainnet-beta'
            ? `https://solscan.io/tx/${sig}`
            : `https://solscan.io/tx/${sig}?cluster=${cluster}`
        activity.record({
          ecosystem: 'solana',
          chain: cluster,
          kind: token.address ? 'send_token' : 'send_native',
          title: `Sent ${amount} ${token.symbol}`,
          subtitle: `to ${to.slice(0, 8)}…${to.slice(-4)}`,
          hash: sig,
          explorerUrl,
          address: core.solanaAddress ?? '',
          timestamp: Date.now(),
          status: 'confirmed',
        })
        return { hash: sig, explorerUrl }
      } catch (e) {
        const err = e instanceof Error ? e : new Error('Send failed')
        setError(err)
        throw err
      } finally {
        setIsSending(false)
      }
    },
    [core, wallet, activity],
  )

  const reset = useCallback(() => setError(null), [])
  return { send, isSending, error, reset }
}
