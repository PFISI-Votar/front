export type SecurityHeadersOptions = {
  apiOrigin: string
  isDev: boolean
  isHttps?: boolean
  /** Extra origins allowed in connect-src (e.g. local Hardhat RPC in dev). */
  extraConnectSrc?: readonly string[]
}

const PERMISSIONS_POLICY = 'camera=(), microphone=(), geolocation=()'

export const NGINX_API_ORIGIN_PLACEHOLDER = '${API_ORIGIN}' as const
export const NGINX_RPC_ORIGINS_PLACEHOLDER = '${RPC_ORIGINS}' as const

const normalizeOrigin = (apiOrigin: string): string => {
  if (apiOrigin === NGINX_API_ORIGIN_PLACEHOLDER) {
    return apiOrigin
  }

  try {
    return new URL(apiOrigin).origin
  } catch {
    return apiOrigin
  }
}

const buildConnectSrc = ({
  apiOrigin,
  isDev,
  extraConnectSrc = [],
}: SecurityHeadersOptions): string => {
  const origins = new Set<string>([normalizeOrigin(apiOrigin)])
  for (const origin of extraConnectSrc) {
    const normalized = normalizeOrigin(origin)
    if (normalized) {
      origins.add(normalized)
    }
  }
  const extras = [...origins].join(' ')
  return `connect-src 'self' ${extras}${isDev ? ' ws:' : ''}`
}

export const buildContentSecurityPolicy = (
  options: SecurityHeadersOptions
): string => {
  const { apiOrigin, isDev, isHttps = !isDev } = options
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
    buildConnectSrc(options),
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

export const buildNginxSecurityHeaderLines = (): string[] => {
  const headers = buildSecurityHeaders({
    apiOrigin: NGINX_API_ORIGIN_PLACEHOLDER,
    isDev: false,
    isHttps: true,
    extraConnectSrc: [NGINX_RPC_ORIGINS_PLACEHOLDER],
  })

  return Object.entries(headers).map(
    ([name, value]) => `add_header ${name} "${value}" always;`
  )
}

export const REQUIRED_SECURITY_HEADER_NAMES = [
  'x-frame-options',
  'content-security-policy',
  'permissions-policy',
  'x-content-type-options',
  'referrer-policy',
] as const
