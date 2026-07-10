import { afterEach, describe, expect, it, vi } from 'vitest'
import { isWebCryptoSupported } from '@/features/voto/crypto/web-crypto-support'

describe('isWebCryptoSupported', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns true when SubtleCrypto and getRandomValues are available', () => {
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
})
