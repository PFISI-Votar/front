/**
 * Detects whether the runtime exposes the Web Crypto primitives required
 * for ephemeral wallet generation (entropy + SubtleCrypto presence), plus
 * IndexedDB, needed since VOTAR-496 to persist the non-extractable key
 * used to encrypt the wallet seed at rest.
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

  if (typeof globalThis.indexedDB === 'undefined') {
    return false
  }

  return true
}
