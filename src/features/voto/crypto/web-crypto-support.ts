/**
 * Detects whether the runtime exposes the Web Crypto primitives required
 * for ephemeral wallet generation (entropy + SubtleCrypto presence).
 *
 * secp256k1 is not available via subtle.generateKey in mainstream browsers;
 * we still require SubtleCrypto and getRandomValues as a minimum security bar.
 */
export const isWebCryptoSupported = (): boolean => {
  if (typeof globalThis === 'undefined') {
    return false
  }

  const cryptoApi = globalThis.crypto
  if (!cryptoApi) {
    return false
  }

  if (typeof cryptoApi.getRandomValues !== 'function') {
    return false
  }

  if (!cryptoApi.subtle || typeof cryptoApi.subtle !== 'object') {
    return false
  }

  return true
}
