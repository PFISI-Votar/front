import 'fake-indexeddb/auto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { isWebCryptoSupported } from '@/features/voto/crypto/web-crypto-support'

describe('isWebCryptoSupported', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', {
      locks: {
        request: vi.fn(),
      },
    })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns true when SubtleCrypto, getRandomValues and IndexedDB are available', () => {
    expect(isWebCryptoSupported()).toBe(true)
  })

  it('returns false when crypto is missing', () => {
    vi.stubGlobal('crypto', undefined)
    expect(isWebCryptoSupported()).toBe(false)
  })

  it('returns false when getRandomValues is missing', () => {
    vi.stubGlobal('crypto', { subtle: {} })
    expect(isWebCryptoSupported()).toBe(false)
  })

  it('returns false when subtle is missing', () => {
    vi.stubGlobal('crypto', {
      getRandomValues: (buffer: Uint8Array) => buffer,
    })
    expect(isWebCryptoSupported()).toBe(false)
  })

  it('returns false when indexedDB is missing (VOTAR-496)', () => {
    vi.stubGlobal('indexedDB', undefined)
    expect(isWebCryptoSupported()).toBe(false)
  })

  it('returns false when navigator.locks is missing (VOTAR-496)', () => {
    vi.stubGlobal('navigator', {})
    expect(isWebCryptoSupported()).toBe(false)
  })
})
