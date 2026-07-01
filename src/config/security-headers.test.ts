import { describe, expect, it } from 'vitest'
import {
  buildContentSecurityPolicy,
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
      'camera=(), microphone=(), geolocation=()',
    )
    expect(headers['X-Content-Type-Options']).toBe('nosniff')
    expect(headers['Referrer-Policy']).toBe('same-origin')
    expect(headers['Strict-Transport-Security']).toContain('max-age=31536000')
    expect(headers['Content-Security-Policy']).toContain(
      'https://api.votar.test',
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
})
