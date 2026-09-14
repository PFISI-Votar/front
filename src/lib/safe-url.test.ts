import { describe, expect, it } from 'vitest'
import { toSafeNavigationUrl } from './safe-url'

describe('toSafeNavigationUrl', () => {
  it('allows https explorer URLs', () => {
    expect(toSafeNavigationUrl('https://sepolia.etherscan.io/tx/0xabc')).toBe(
      'https://sepolia.etherscan.io/tx/0xabc'
    )
  })

  it('allows http only on loopback', () => {
    expect(toSafeNavigationUrl('http://127.0.0.1:8545')).toBe(
      'http://127.0.0.1:8545/'
    )
    expect(toSafeNavigationUrl('http://evil.example/phish')).toBeNull()
  })

  it('rejects javascript, data and credentialed URLs', () => {
    expect(toSafeNavigationUrl('javascript:alert(1)')).toBeNull()
    expect(
      toSafeNavigationUrl('data:text/html,<script>alert(1)</script>')
    ).toBeNull()
    expect(
      toSafeNavigationUrl('https://user:secret@sepolia.etherscan.io/tx/0x1')
    ).toBeNull()
    expect(toSafeNavigationUrl('not a url')).toBeNull()
    expect(toSafeNavigationUrl(null)).toBeNull()
  })
})
