import { getPublicKey } from '@noble/secp256k1'
import 'fake-indexeddb/auto'
import { bytesToHex, hexToBytes, type Hex } from 'viem'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createEphemeralWalletManager } from '@/features/voto/crypto/ephemeral-wallet'
import { deriveEphemeralPrivateKey } from '@/features/voto/crypto/ephemeral-wallet-seed'
import { decryptSeed } from '@/features/voto/crypto/seed-encryption'

// VOTAR-496: unlike ephemeral-wallet.test.ts and ephemeral-wallet-seed.test.ts,
// this file does NOT mock seed-encryption.ts — it exercises the real
// AES-GCM + IndexedDB pipeline (via fake-indexeddb) to prove the actual
// security property the ticket asked for, not just the wiring.
const createMemoryStorage = () => {
  const store = new Map<string, string>()
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
    removeItem: (key: string) => {
      store.delete(key)
    },
    clear: () => {
      store.clear()
    },
    get length() {
      return store.size
    },
    key: (index: number) => [...store.keys()][index] ?? null,
  }
}

const ID_ELECCION = 496
const VOTANTE_SCOPE = 'hardening-attacker-scope'
const OLD_PLAINTEXT_SEED_REGEX = /^0x[0-9a-f]{64}$/i
const SEED_STORAGE_KEY = `votar:vote-seed:${ID_ELECCION}:${VOTANTE_SCOPE}`

describe('VOTAR-496 hardening: seed at rest is not reconstructive key material', () => {
  let localStorageMock: ReturnType<typeof createMemoryStorage>
  let sessionStorageMock: ReturnType<typeof createMemoryStorage>
  let manager: ReturnType<typeof createEphemeralWalletManager>

  beforeEach(() => {
    localStorageMock = createMemoryStorage()
    sessionStorageMock = createMemoryStorage()
    vi.stubGlobal('localStorage', localStorageMock)
    vi.stubGlobal('sessionStorage', sessionStorageMock)
    vi.stubGlobal('document', {
      body: { innerHTML: '' },
      cookie: '',
    })
    // Node unit env has crypto.subtle + fake-indexeddb, but not Web Locks.
    vi.stubGlobal('navigator', {
      locks: {
        request: async (
          _name: string,
          callback: () => Promise<CryptoKey>
        ): Promise<CryptoKey> => callback(),
      },
    })
    manager = createEphemeralWalletManager()
  })

  afterEach(() => {
    manager.destroy()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('an attacker with read-only access to localStorage cannot reconstruct the private key', async () => {
    const session = await manager.initialize(ID_ELECCION, VOTANTE_SCOPE)
    const realPublicKeyHex = session.publicKeyHex

    // What an attacker with mere storage read access (shared computer,
    // browser extension, disk forensics — no JS execution, no access to
    // the non-extractable CryptoKey in IndexedDB) would see.
    const rawStored = localStorageMock.getItem(SEED_STORAGE_KEY)
    expect(rawStored).not.toBeNull()

    // Pre-VOTAR-496, this raw value WAS the plaintext seed hex, directly
    // consumable by deriveEphemeralPrivateKey. Confirm that door is shut.
    expect(OLD_PLAINTEXT_SEED_REGEX.test(rawStored as string)).toBe(false)

    // Even a more determined attacker who inspects the stored shape and
    // pulls out the ciphertext field, then runs it through the same
    // (public, open-source) derivation as if it were the seed, does not
    // reconstruct the real key.
    const parsed = JSON.parse(rawStored as string) as {
      ciphertext: Hex
      iv: Hex
    }
    const attackerGuessSeed = hexToBytes(parsed.ciphertext)
    const attackerPrivateKey = deriveEphemeralPrivateKey(
      attackerGuessSeed,
      ID_ELECCION
    )
    const attackerPublicKeyHex = bytesToHex(
      getPublicKey(attackerPrivateKey, true)
    )

    expect(attackerPublicKeyHex).not.toBe(realPublicKeyHex)
  })

  it('VOTAR-489: derived private key never appears in DOM, storage or console', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})

    await manager.initialize(ID_ELECCION, VOTANTE_SCOPE)

    const rawStored = localStorageMock.getItem(SEED_STORAGE_KEY)
    expect(rawStored).not.toBeNull()
    const parsed = JSON.parse(rawStored as string) as {
      ciphertext: Hex
      iv: Hex
    }
    // Legitimate decrypt (same origin has IndexedDB key) to learn the real
    // private key hex — then prove that value never landed in any sink a
    // XSS or console dump could scrape.
    const seed = await decryptSeed(parsed, SEED_STORAGE_KEY)
    const privateKeyHex = bytesToHex(
      deriveEphemeralPrivateKey(seed, ID_ELECCION)
    )
    const privateKeyHexNoPrefix = privateKeyHex.slice(2).toLowerCase()

    const storageBlob = [
      ...Array.from({ length: localStorageMock.length }, (_, i) => {
        const key = localStorageMock.key(i)
        return key ? `${key}=${localStorageMock.getItem(key)}` : ''
      }),
      ...Array.from({ length: sessionStorageMock.length }, (_, i) => {
        const key = sessionStorageMock.key(i)
        return key ? `${key}=${sessionStorageMock.getItem(key)}` : ''
      }),
    ]
      .join('\n')
      .toLowerCase()

    expect(storageBlob).not.toContain(privateKeyHex.toLowerCase())
    expect(storageBlob).not.toContain(privateKeyHexNoPrefix)
    expect(document.body.innerHTML.toLowerCase()).not.toContain(
      privateKeyHexNoPrefix
    )
    expect(document.cookie.toLowerCase()).not.toContain(privateKeyHexNoPrefix)

    const consoleBlob = [logSpy, infoSpy, warnSpy, errorSpy, debugSpy]
      .flatMap((spy) => spy.mock.calls)
      .map((args) => args.map(String).join(' '))
      .join('\n')
      .toLowerCase()
    expect(consoleBlob).not.toContain(privateKeyHex.toLowerCase())
    expect(consoleBlob).not.toContain(privateKeyHexNoPrefix)
  })
})
