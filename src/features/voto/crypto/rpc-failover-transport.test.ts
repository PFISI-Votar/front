import { createPublicClient } from 'viem'
import { sepolia } from 'viem/chains'
import { describe, expect, it, vi } from 'vitest'
import { createVoteRpcTransport } from '@/features/voto/crypto/rpc-failover-transport'

describe('createVoteRpcTransport — VOTAR-386', () => {
  const jsonRpc = (result: unknown) =>
    new Response(JSON.stringify({ jsonrpc: '2.0', id: 1, result }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })

  it('UAT-01: switches to the backup after the primary rejects the API key', async () => {
    const onFailover = vi.fn()
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('infura')) {
        return new Response('Unauthorized', { status: 401 })
      }
      return jsonRpc('0x1')
    })

    const client = createPublicClient({
      chain: sepolia,
      transport: createVoteRpcTransport(
        [
          'https://sepolia.infura.io/v3/primarysecret',
          'https://eth-sepolia.g.alchemy.com/v2/backupsecret',
        ],
        { fetchFn: fetchImpl as typeof fetch, onFailover, timeoutMs: 200 }
      ),
    })

    await expect(client.getBlockNumber()).resolves.toBe(1n)
    expect(fetchImpl).toHaveBeenCalledTimes(2)
    expect(onFailover).toHaveBeenCalledTimes(1)
    expect(onFailover.mock.calls[0][0]).toContain('reason=auth')
    expect(onFailover.mock.calls[0][0]).not.toContain('primarysecret')
  })

  it('UAT-03: switches immediately on HTTP 429', async () => {
    const onFailover = vi.fn()
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('infura')) {
        return new Response('Too Many Requests', { status: 429 })
      }
      return jsonRpc('0x2a')
    })

    const client = createPublicClient({
      chain: sepolia,
      transport: createVoteRpcTransport(
        [
          'https://sepolia.infura.io/v3/aaa',
          'https://eth-sepolia.g.alchemy.com/v2/bbb',
        ],
        { fetchFn: fetchImpl as typeof fetch, onFailover, timeoutMs: 200 }
      ),
    })

    await expect(client.getBlockNumber()).resolves.toBe(42n)
    expect(onFailover.mock.calls[0][0]).toContain('reason=rate_limit')
  })
})
