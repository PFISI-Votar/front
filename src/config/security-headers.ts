export type SecurityHeadersOptions = {
  apiOrigin: string
  isDev: boolean
  isHttps?: boolean
  /** Extra origins allowed in connect-src (e.g. local Hardhat RPC in dev). */
  extraConnectSrc?: readonly string[]
}

const PERMISSIONS_POLICY = 'camera=(), microphone=(), geolocation=()'
const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]'])

export const NGINX_API_ORIGIN_PLACEHOLDER = '${API_ORIGIN}' as const
export const NGINX_RPC_ORIGINS_PLACEHOLDER = '${RPC_ORIGINS}' as const

const NGINX_PLACEHOLDERS = new Set<string>([
  NGINX_API_ORIGIN_PLACEHOLDER,
  NGINX_RPC_ORIGINS_PLACEHOLDER,
])

/**
 * CSP origins are scheme+host+port only. Paths and query strings (RPC API
 * keys) must never land in a response header.
 */
const toCspOrigin = (value: string): string | null => {
  if (NGINX_PLACEHOLDERS.has(value)) {
    return value
  }

  try {
    const url = new URL(value)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null
    }
    return url.origin
  } catch {
    return null
  }
}

const isLoopbackOrigin = (origin: string): boolean => {
  try {
    return LOOPBACK_HOSTS.has(new URL(origin).hostname)
  } catch {
    return false
  }
}

const isAllowedConnectOrigin = (origin: string, isDev: boolean): boolean => {
  if (NGINX_PLACEHOLDERS.has(origin)) {
    return true
  }

  try {
    const url = new URL(origin)
    if (url.protocol === 'https:') {
      return true
    }
    if (url.protocol === 'http:' && isLoopbackOrigin(origin)) {
      return true
    }
    return isDev && url.protocol === 'http:'
  } catch {
    return false
  }
}

const buildConnectSrc = ({
  apiOrigin,
  isDev,
  extraConnectSrc = [],
}: SecurityHeadersOptions): string => {
  const origins = new Set<string>()
  for (const candidate of [apiOrigin, ...extraConnectSrc]) {
    const origin = toCspOrigin(candidate)
    if (origin && isAllowedConnectOrigin(origin, isDev)) {
      origins.add(origin)
    }
  }
  const extras = [...origins].join(' ')
  const prefix = extras ? ` ${extras}` : ''
  return `connect-src 'self'${prefix}${isDev ? ' ws:' : ''}`
}

export const buildContentSecurityPolicy = (
  options: SecurityHeadersOptions
): string => {
  const { apiOrigin, isDev, isHttps = !isDev } = options
  const api = toCspOrigin(apiOrigin) ?? "'none'"
  // Vite HMR needs inline/eval scripts in development only. Production must
  // not, or an XSS can run in the same origin as the ephemeral wallet.
  const scriptSrc = isDev
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self'"
  const directives = [
    "default-src 'self'",
    scriptSrc,
    "script-src-attr 'none'",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self'",
    `img-src 'self' data: blob: ${api}`,
    buildConnectSrc(options),
    "frame-src 'none'",
    "worker-src 'none'",
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
