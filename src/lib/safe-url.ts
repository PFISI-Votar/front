const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1'])

/**
 * External navigation (explorador, Etherscan) only. Rejects javascript:, data:
 * and credentialed URLs that would execute or leak if used as href/window.open.
 */
export const toSafeNavigationUrl = (
  value: string | null | undefined
): string | null => {
  if (!value) {
    return null
  }

  try {
    const url = new URL(value)
    if (url.username || url.password) {
      return null
    }
    if (url.protocol === 'https:') {
      return url.toString()
    }
    if (url.protocol === 'http:' && LOOPBACK_HOSTS.has(url.hostname)) {
      return url.toString()
    }
    return null
  } catch {
    return null
  }
}
