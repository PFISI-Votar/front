import { http, type Transport } from 'viem'
import {
  classifyRpcFailoverReason,
  formatRpcFailoverLog,
  isBlockSkewAcceptable,
  isRpcFailoverError,
  sanitizeRpcUrl,
} from '@/features/voto/crypto/rpc-failover'
import {
  RPC_FAILOVER_LOG_PREFIX,
  RPC_FAILOVER_TIMEOUT_MS,
  RPC_MAX_BLOCK_SKEW,
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

const fetchEthBlockNumber = async (
  rpcUrl: string,
  timeoutMs: number,
  fetchImpl?: typeof fetch
): Promise<number> => {
  const fetchFn = fetchImpl ?? fetch
  const response = await fetchFn(rpcUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_blockNumber',
      params: [],
    }),
    signal: AbortSignal.timeout(timeoutMs),
  })
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }
  const payload = (await response.json()) as {
    result?: string
    error?: { message?: string }
  }
  if (payload.error?.message) {
    throw new Error(payload.error.message)
  }
  if (!payload.result) {
    throw new Error('missing eth_blockNumber result')
  }
  return Number.parseInt(payload.result, 16)
}

/**
 * Sequential Infura → Alchemy → QuickNode transport.
 * Each hop times out under 1s (VOTAR-386) and skips backups with excessive block skew.
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

  return ({ chain, pollingInterval }) => {
    const buildTransport = (url: string) =>
      http(url, {
        timeout: timeoutMs,
        retryCount: 0,
        fetchFn: options.fetchFn,
      })({
        chain,
        pollingInterval,
        retryCount: 0,
        timeout: timeoutMs,
      })

    return {
      config: { type: 'http' as const },
      type: 'http' as const,
      name: 'vote-rpc-failover',
      async request(args, reqOptions) {
        let referenceBlock: number | null = null
        let lastError: unknown

        for (let index = 0; index < urls.length; index += 1) {
          const url = urls[index]
          const backupUrl = urls[index + 1]

          if (index > 0) {
            if (referenceBlock == null) {
              try {
                referenceBlock = await fetchEthBlockNumber(
                  urls[0],
                  timeoutMs,
                  options.fetchFn
                )
              } catch {
                // Primary may be unavailable; skew check is best-effort.
              }
            }
            if (referenceBlock != null) {
              try {
                const candidateBlock = await fetchEthBlockNumber(
                  url,
                  timeoutMs,
                  options.fetchFn
                )
                const skew = Math.abs(referenceBlock - candidateBlock)
                if (
                  !isBlockSkewAcceptable(
                    referenceBlock,
                    candidateBlock,
                    RPC_MAX_BLOCK_SKEW
                  )
                ) {
                  onFailover(
                    formatRpcFailoverLog({
                      at: new Date().toISOString(),
                      reason: 'unavailable',
                      failedEndpoint: sanitizeRpcUrl(url),
                      backupEndpoint: backupUrl
                        ? sanitizeRpcUrl(backupUrl)
                        : '(none)',
                      message: `skipped backup: block skew ${skew} (ref=${referenceBlock}, backup=${candidateBlock})`,
                      blockSkew: skew,
                    })
                  )
                  continue
                }
              } catch {
                continue
              }
            }
          }

          try {
            return await buildTransport(url).request(args, reqOptions)
          } catch (error) {
            lastError = error
            if (!backupUrl || !isRpcFailoverError(error)) {
              throw error
            }
            onFailover(
              formatRpcFailoverLog({
                at: new Date().toISOString(),
                reason: classifyRpcFailoverReason(error) ?? 'network',
                failedEndpoint: sanitizeRpcUrl(url),
                backupEndpoint: sanitizeRpcUrl(backupUrl),
                message: error instanceof Error ? error.name : 'RPC error',
              })
            )
            if (referenceBlock == null) {
              try {
                referenceBlock = await fetchEthBlockNumber(
                  url,
                  timeoutMs,
                  options.fetchFn
                )
              } catch {
                // ignore
              }
            }
          }
        }

        throw lastError
      },
    }
  }
}
