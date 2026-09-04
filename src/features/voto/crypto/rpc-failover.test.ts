import { describe, expect, it } from 'vitest'
import {
  assertRpcUrlsUseHttpsExceptLoopback,
  classifyRpcFailoverReason,
  isBlockSkewAcceptable,
  isRpcFailoverError,
  parseRpcUrls,
  rpcUrlToOrigin,
  sanitizeRpcUrl,
} from '@/features/voto/crypto/rpc-failover'

describe('rpc-failover — VOTAR-386', () => {
  it('parses primary and comma-separated backups', () => {
    expect(
      parseRpcUrls(
        'https://sepolia.infura.io/v3/aaa',
        'https://eth-sepolia.g.alchemy.com/v2/bbb, https://x.quiknode.pro/ccc'
      )
    ).toEqual([
      'https://sepolia.infura.io/v3/aaa',
      'https://eth-sepolia.g.alchemy.com/v2/bbb',
      'https://x.quiknode.pro/ccc',
    ])
  })

  it('extracts CSP origins and redacts API keys', () => {
    expect(rpcUrlToOrigin('https://eth-sepolia.g.alchemy.com/v2/secret')).toBe(
      'https://eth-sepolia.g.alchemy.com'
    )
    expect(sanitizeRpcUrl('https://sepolia.infura.io/v3/abcd1234secret')).toBe(
      'https://sepolia.infura.io/v3/abcd...'
    )
  })

  it('UAT-01/UAT-03: failovers on revoked keys and HTTP 429', () => {
    expect(classifyRpcFailoverReason({ status: 401 })).toBe('auth')
    expect(isRpcFailoverError(new Error('429 Too Many Requests'))).toBe(true)
    expect(isRpcFailoverError(new Error('execution reverted'))).toBe(false)
  })

  it('VOTAR-378 UAT-02: exige HTTPS salvo loopback', () => {
    expect(() =>
      assertRpcUrlsUseHttpsExceptLoopback([
        'https://sepolia.infura.io/v3/aaa',
        'http://127.0.0.1:8545',
      ])
    ).not.toThrow()
    expect(() =>
      assertRpcUrlsUseHttpsExceptLoopback(['http://sepolia.infura.io/v3/aaa'])
    ).toThrow(/HTTPS/)
  })

  it('rejects backups with significant block skew', () => {
    expect(isBlockSkewAcceptable(100, 104, 5)).toBe(true)
    expect(isBlockSkewAcceptable(100, 90, 5)).toBe(false)
  })
})
