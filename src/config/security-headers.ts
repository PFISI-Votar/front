export type SecurityHeadersOptions = {
  apiOrigin: string
  isDev: boolean
  isHttps?: boolean
  /** Extra origins allowed in connect-src (e.g. local Hardhat RPC in dev). */
  extraConnectSrc?: readonly string[]
}

const PERMISSIONS_POLICY = 'camera=(), microphone=(), geolocation=()'
const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]'])

/**
 * Strict host[+port] for CSP source expressions. Rejects `;` / `"` / spaces
 * that would inject extra directives (e.g. a second frame-ancestors).
 * Keep in sync with deploy/csp-origin-lib.sh `is_strict_csp_hostport`.
 */
export const CSP_HOSTPORT_RE =
  /^(?:localhost|(?:[a-z0-9-]+\.)*[a-z0-9-]+)(?::\d{1,5})?$|^\[(?:[0-9a-f:]+)\](?::\d{1,5})?$/i

export const isStrictCspHostPort = (hostPort: string): boolean =>
  CSP_HOSTPORT_RE.test(hostPort)

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
export const toCspOrigin = (value: string): string | null => {
  if (NGINX_PLACEHOLDERS.has(value)) {
    return value
  }

  try {
    const url = new URL(value.trim())
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null
    }
    // url.host is hostname:port (or [ipv6]:port). Reject CSP metacharacters
    // that URL() still accepts in the hostname (e.g. `;` or `"`).
    if (!isStrictCspHostPort(url.host)) {
      return null
    }
    const origin = url.origin
    if (/[;"'\\\s]/.test(origin)) {
      return null
    }
    return origin
  } catch {
    return null
  }
}

/**
 * Fail loudly when an absolute http(s) URL is required. Schemeless hostnames
 * (e.g. `api.votar.ar`) used to slip into connect-src as bare host-sources;
 * now they abort header generation so ops typos surface at boot/build time.
 */
export const requireCspOrigin = (value: string, label: string): string => {
  const origin = toCspOrigin(value)
  if (!origin) {
    throw new Error(
      `${label} must be an absolute http(s) URL (got ${JSON.stringify(value)}). ` +
        'Example: https://api.example.com'
    )
  }
  return origin
}

const isLoopbackOrigin = (origin: string): boolean => {
  try {
    return LOOPBACK_HOSTS.has(new URL(origin).hostname)
  } catch {
    return false
  }
}

export const isAllowedConnectOrigin = (
  origin: string,
  isDev: boolean
): boolean => {
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

/**
 * Sanitize a raw env value into a CSP origin for production nginx deploy.
 * Strips paths/queries (API keys) and rejects non-https / non-loopback http.
 */
export const sanitizeDeployCspOrigin = (value: string): string | null => {
  const origin = toCspOrigin(value)
  if (!origin || NGINX_PLACEHOLDERS.has(origin)) {
    return null
  }
  if (!isAllowedConnectOrigin(origin, false)) {
    return null
  }
  return origin
}

/**
 * Sanitize space-separated RPC/API origin env values for nginx envsubst.
 * Returns null if any token is present but invalid (fail closed).
 */
export const sanitizeDeployCspOriginsList = (value: string): string | null => {
  const tokens = value
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 0)
  if (tokens.length === 0) {
    return ''
  }

  const origins: string[] = []
  for (const token of tokens) {
    const origin = sanitizeDeployCspOrigin(token)
    if (!origin) {
      return null
    }
    origins.push(origin)
  }
  return [...new Set(origins)].join(' ')
}

const buildConnectSrc = ({
  apiOrigin,
  isDev,
  extraConnectSrc = [],
}: SecurityHeadersOptions): string => {
  const origins = new Set<string>()
  // apiOrigin is validated by requireCspOrigin in buildContentSecurityPolicy.
  // Fail closed if it is not allowed for connect-src (e.g. plain http to a
  // public host in production) — never leave img-src with an origin that
  // connect-src silently dropped.
  const api = requireCspOrigin(apiOrigin, 'apiOrigin')
  if (!isAllowedConnectOrigin(api, isDev)) {
    throw new Error(
      `apiOrigin is not allowed in connect-src for this environment (got ${JSON.stringify(apiOrigin)}). ` +
        'Use https, or http only for loopback (or any http in development).'
    )
  }
  origins.add(api)
  for (const candidate of extraConnectSrc) {
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
  const api = requireCspOrigin(apiOrigin, 'apiOrigin')
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
