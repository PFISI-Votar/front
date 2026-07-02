export type SecurityHeadersOptions = {
  apiOrigin: string
  isDev: boolean
  isHttps?: boolean
}

const PERMISSIONS_POLICY = 'camera=(), microphone=(), geolocation=()'

const normalizeOrigin = (apiOrigin: string): string => {
  try {
    return new URL(apiOrigin).origin
  } catch {
    return apiOrigin
  }
}

export const buildContentSecurityPolicy = ({
  apiOrigin,
  isDev,
  isHttps = !isDev,
}: SecurityHeadersOptions): string => {
  const api = normalizeOrigin(apiOrigin)
  const scriptSrc = isDev
    ? "script-src 'self' 'unsafe-inline'"
    : "script-src 'self'"
  const directives = [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self'",
    `img-src 'self' data: blob: ${api}`,
    `connect-src 'self' ${api}${isDev ? ' ws:' : ''}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ]

  if (isHttps && !isDev) {
    directives.push('upgrade-insecure-requests')
  }

  return directives.join('; ')
}

export const buildSecurityHeaders = (
  options: SecurityHeadersOptions
): Record<string, string> => {
  const { isDev, isHttps = !isDev } = options
  const headers: Record<string, string> = {
    'X-Frame-Options': 'DENY',
    'Content-Security-Policy': buildContentSecurityPolicy(options),
    'Permissions-Policy': PERMISSIONS_POLICY,
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'same-origin',
    'X-DNS-Prefetch-Control': 'off',
  }

  if (!isDev && isHttps) {
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
  }

  return headers
}

export const REQUIRED_SECURITY_HEADER_NAMES = [
  'x-frame-options',
  'content-security-policy',
  'permissions-policy',
  'x-content-type-options',
  'referrer-policy',
] as const
