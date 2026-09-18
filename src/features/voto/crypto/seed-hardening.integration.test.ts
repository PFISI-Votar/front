import { getPublicKey } from '@noble/secp256k1'
import 'fake-indexeddb/auto'
import { bytesToHex, hexToBytes, type Hex } from 'viem'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createEphemeralWalletManager } from '@/features/voto/crypto/ephemeral-wallet'
import { deriveEphemeralPrivateKey } from '@/features/voto/crypto/ephemeral-wallet-seed'

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

describe('VOTAR-496 hardening: seed at rest is not reconstructive key material', () => {
  let localStorageMock: ReturnType<typeof createMemoryStorage>
  let manager: ReturnType<typeof createEphemeralWalletManager>

  beforeEach(() => {
    localStorageMock = createMemoryStorage()
    vi.stubGlobal('localStorage', localStorageMock)
    manager = createEphemeralWalletManager()
  })

  afterEach(() => {
    manager.destroy()
    vi.unstubAllGlobals()
  })

  it('an attacker with read-only access to localStorage cannot reconstruct the private key', async () => {
    const session = await manager.initialize(ID_ELECCION, VOTANTE_SCOPE)
    const realPublicKeyHex = session.publicKeyHex

    // What an attacker with mere storage read access (shared computer,
    // browser extension, disk forensics — no JS execution, no access to
    // the non-extractable CryptoKey in IndexedDB) would see.
    const rawStored = localStorageMock.getItem(
      `votar:vote-seed:${ID_ELECCION}:${VOTANTE_SCOPE}`
    )
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
})
