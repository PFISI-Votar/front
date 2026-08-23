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
    expect(fetchImpl.mock.calls.length).toBeGreaterThanOrEqual(2)
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

  it('skips a lagging backup when block skew exceeds the threshold', async () => {
    const onFailover = vi.fn()
    const fetchImpl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      const body =
        init?.body && typeof init.body === 'string'
          ? (JSON.parse(init.body) as { method?: string })
          : null
      const method = body?.method

      if (url.includes('infura')) {
        if (method === 'eth_blockNumber') {
          return jsonRpc('0x64')
        }
        return new Response('Too Many Requests', { status: 429 })
      }
      if (url.includes('alchemy')) {
        return jsonRpc(method === 'eth_blockNumber' ? '0x50' : '0x1')
      }
      return jsonRpc(method === 'eth_blockNumber' ? '0x64' : '0xaa36a7')
    })

    const client = createPublicClient({
      chain: sepolia,
      transport: createVoteRpcTransport(
        [
          'https://sepolia.infura.io/v3/aaa',
          'https://eth-sepolia.g.alchemy.com/v2/bbb',
          'https://x.quiknode.pro/ccc',
        ],
        { fetchFn: fetchImpl as typeof fetch, onFailover, timeoutMs: 200 }
      ),
    })

    await expect(client.getChainId()).resolves.toBe(11155111)
    expect(
      onFailover.mock.calls.some((args) => String(args[0]).includes('skew='))
    ).toBe(true)
    expect(fetchImpl.mock.calls.some(([url]) => String(url).includes('quiknode'))).toBe(
      true
    )
  })
})
