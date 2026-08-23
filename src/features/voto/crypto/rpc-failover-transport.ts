import { custom, fallback, http, type Transport } from 'viem'
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

const createSkewAwareTransport = (
  url: string,
  index: number,
  urls: readonly string[],
  options: {
    timeoutMs: number
    fetchFn?: typeof fetch
    onFailover: RpcFailoverLogFn
    getReferenceBlock: () => number | null
    setReferenceBlock: (block: number) => void
  }
): Transport => {
  const backupUrl = urls[index + 1]
  const innerHttp = http(url, {
    timeout: options.timeoutMs,
    retryCount: 0,
    fetchFn: options.fetchFn,
  })

  return (params) => {
    const inner = innerHttp(params)

    return custom(
      {
        request: async (...args: Parameters<typeof inner.request>) => {
          const [rpcArgs, reqOptions] = args

          if (index > 0) {
            let referenceBlock = options.getReferenceBlock()
            if (referenceBlock == null) {
              try {
                referenceBlock = await fetchEthBlockNumber(
                  urls[0],
                  options.timeoutMs,
                  options.fetchFn
                )
                options.setReferenceBlock(referenceBlock)
              } catch {
                // Primary may be unavailable; skew check is best-effort.
              }
            }
            if (referenceBlock != null) {
              try {
                const candidateBlock = await fetchEthBlockNumber(
                  url,
                  options.timeoutMs,
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
                  options.onFailover(
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
                  throw new Error('503 Service Unavailable')
                }
              } catch (error) {
                if (isRpcFailoverError(error)) {
                  throw error
                }
                throw new Error('503 Service Unavailable', { cause: error })
              }
            }
          }

          try {
            return await inner.request(rpcArgs, reqOptions)
          } catch (error) {
            if (backupUrl && isRpcFailoverError(error)) {
              options.onFailover(
                formatRpcFailoverLog({
                  at: new Date().toISOString(),
                  reason: classifyRpcFailoverReason(error) ?? 'network',
                  failedEndpoint: sanitizeRpcUrl(url),
                  backupEndpoint: sanitizeRpcUrl(backupUrl),
                  message: error instanceof Error ? error.name : 'RPC error',
                })
              )
              if (options.getReferenceBlock() == null) {
                try {
                  options.setReferenceBlock(
                    await fetchEthBlockNumber(
                      url,
                      options.timeoutMs,
                      options.fetchFn
                    )
                  )
                } catch {
                  // ignore
                }
              }
            }
            throw error
          }
        },
      },
      {
        key: `vote-rpc-${index}`,
        name: `Vote RPC node ${index + 1}`,
        retryCount: 0,
      }
    )(params)
  }
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

  let referenceBlock: number | null = null

  return fallback(
    urls.map((url, index) =>
      createSkewAwareTransport(url, index, urls, {
        timeoutMs,
        fetchFn: options.fetchFn,
        onFailover,
        getReferenceBlock: () => referenceBlock,
        setReferenceBlock: (block) => {
          referenceBlock = block
        },
      })
    ),
    { retryCount: 0, rank: false }
  )
}
