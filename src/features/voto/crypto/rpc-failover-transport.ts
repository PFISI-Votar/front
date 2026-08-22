import { fallback, http, type Transport } from 'viem'
import {
  classifyRpcFailoverReason,
  formatRpcFailoverLog,
  isRpcFailoverError,
  sanitizeRpcUrl,
} from '@/features/voto/crypto/rpc-failover'
import {
  RPC_FAILOVER_LOG_PREFIX,
  RPC_FAILOVER_TIMEOUT_MS,
} from '@/features/voto/crypto/rpc-failover.constants'

export type RpcFailoverLogFn = (message: string) => void

export type CreateVoteRpcTransportOptions = {
  timeoutMs?: number
  fetchFn?: typeof fetch
  onFailover?: RpcFailoverLogFn
}

const defaultFailoverLog: RpcFailoverLogFn = (message) => {
  // eslint-disable-next-line no-console -- UAT-04: visible to electoral operators
  console.warn(RPC_FAILOVER_LOG_PREFIX, message)
}

const wrapHttpTransport = (
  url: string,
  backupUrl: string | undefined,
  timeoutMs: number,
  fetchImpl: typeof fetch | undefined,
  onFailover: RpcFailoverLogFn
): Transport => {
  const inner = http(url, {
    timeout: timeoutMs,
    retryCount: 0,
    fetchFn: fetchImpl,
  })

  return ({ chain, pollingInterval }) => {
    const transport = inner({
      chain,
      pollingInterval,
      retryCount: 0,
      timeout: timeoutMs,
    })
    return {
      ...transport,
      async request(args, options) {
        try {
          return await transport.request(args, options)
        } catch (error) {
          if (backupUrl && isRpcFailoverError(error)) {
            onFailover(
              formatRpcFailoverLog({
                at: new Date().toISOString(),
                reason: classifyRpcFailoverReason(error) ?? 'network',
                failedEndpoint: sanitizeRpcUrl(url),
                backupEndpoint: sanitizeRpcUrl(backupUrl),
                message: error instanceof Error ? error.name : 'RPC error',
              })
            )
          }
          throw error
        }
      },
    }
  }
}

/**
 * Sequential Infura → Alchemy → QuickNode transport.
 * Each hop times out under 1s (VOTAR-386).
 */
export const createVoteRpcTransport = (
  urls: readonly string[],
  options: CreateVoteRpcTransportOptions = {}
): Transport => {
  if (urls.length === 0) {
    throw new Error('VITE_RPC_URL no está configurada para transmitir el voto')
  }

  const timeoutMs = options.timeoutMs ?? RPC_FAILOVER_TIMEOUT_MS
  const onFailover = options.onFailover ?? defaultFailoverLog

  if (urls.length === 1) {
    return http(urls[0], {
      timeout: timeoutMs,
      retryCount: 0,
      fetchFn: options.fetchFn,
    })
  }

  return fallback(
    urls.map((url, index) =>
      wrapHttpTransport(
        url,
        urls[index + 1],
        timeoutMs,
        options.fetchFn,
        onFailover
      )
    ),
    { retryCount: 0, rank: false }
  )
}
