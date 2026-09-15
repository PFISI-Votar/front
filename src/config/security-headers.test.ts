import { describe, expect, it } from 'vitest'
import {
  buildContentSecurityPolicy,
  buildNginxSecurityHeaderLines,
  buildSecurityHeaders,
  REQUIRED_SECURITY_HEADER_NAMES,
} from './security-headers'

describe('security-headers', () => {
  it('builds CSP with frame-ancestors none and API origin', () => {
    const csp = buildContentSecurityPolicy({
      apiOrigin: 'http://localhost:3000',
      isDev: false,
    })

    expect(csp).toContain("frame-ancestors 'none'")
    expect(csp).toContain("frame-src 'none'")
    expect(csp).toContain("script-src 'self';")
    expect(csp).toContain("script-src-attr 'none'")
    expect(csp).not.toContain('unsafe-eval')
    expect(csp).not.toContain("script-src 'self' 'unsafe-inline'")
    expect(csp).toContain('connect-src')
    expect(csp).toContain('http://localhost:3000')
    expect(csp).toContain("object-src 'none'")
    expect(csp).not.toContain('fonts.googleapis.com')
  })

  it('allows unsafe-inline scripts in dev for Vite HMR', () => {
    const csp = buildContentSecurityPolicy({
      apiOrigin: 'http://localhost:3000',
      isDev: true,
    })

    expect(csp).toContain("'unsafe-inline'")
    expect(csp).toContain('ws:')
    expect(csp).not.toContain('upgrade-insecure-requests')
  })

  it('includes all required security headers for production preview', () => {
    const headers = buildSecurityHeaders({
      apiOrigin: 'https://api.votar.test',
      isDev: false,
      isHttps: true,
    })

    expect(headers['X-Frame-Options']).toBe('DENY')
    expect(headers['Permissions-Policy']).toBe(
      'camera=(), microphone=(), geolocation=()'
    )
    expect(headers['X-Content-Type-Options']).toBe('nosniff')
    expect(headers['Referrer-Policy']).toBe('same-origin')
    expect(headers['Strict-Transport-Security']).toContain('max-age=31536000')
    expect(headers['Content-Security-Policy']).toContain(
      'https://api.votar.test'
    )
  })

  it('omits HSTS in development', () => {
    const headers = buildSecurityHeaders({
      apiOrigin: 'http://localhost:3000',
      isDev: true,
    })

    expect(headers['Strict-Transport-Security']).toBeUndefined()
  })

  it('documents required header names for verification script', () => {
    expect(REQUIRED_SECURITY_HEADER_NAMES).toContain('x-content-type-options')
    expect(REQUIRED_SECURITY_HEADER_NAMES).toContain('permissions-policy')
  })

  it('builds nginx header lines with API_ORIGIN placeholder', () => {
    const lines = buildNginxSecurityHeaderLines()

    expect(lines).toContain('add_header X-Frame-Options "DENY" always;')
    expect(lines.some((line) => line.includes('${API_ORIGIN}'))).toBe(true)
    expect(lines.some((line) => line.includes('${RPC_ORIGINS}'))).toBe(true)
    expect(
      lines.some((line) => line.includes('Strict-Transport-Security'))
    ).toBe(true)
  })

  it('keeps RPC origins in connect-src without leaking API keys', () => {
    const secret = 'alchemy-secret-key-should-not-appear'
    const csp = buildContentSecurityPolicy({
      apiOrigin: 'https://api.votar.test',
      isDev: false,
      extraConnectSrc: [
        `https://eth-sepolia.g.alchemy.com/v2/${secret}`,
        'http://rpc.public.example:8545',
      ],
    })

    expect(csp).toContain('https://eth-sepolia.g.alchemy.com')
    expect(csp).toContain('https://api.votar.test')
    expect(csp).not.toContain(secret)
    expect(csp).not.toContain('/v2/')
    expect(csp).not.toContain('rpc.public.example')
  })

  it('allows Hardhat RPC origins via extraConnectSrc in dev', () => {
    const csp = buildContentSecurityPolicy({
      apiOrigin: 'http://localhost:8000',
      isDev: true,
      extraConnectSrc: ['http://127.0.0.1:8545', 'http://localhost:8545'],
    })

    expect(csp).toContain('http://127.0.0.1:8545')
    expect(csp).toContain('http://localhost:8545')
    expect(csp).toContain('http://localhost:8000')
  })
})
