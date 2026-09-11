import 'fake-indexeddb/auto'
import { bytesToHex, hexToBytes } from 'viem'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  deriveEphemeralPrivateKey,
  getOrCreateElectionSeed,
} from '@/features/voto/crypto/ephemeral-wallet-seed'

// VOTAR-496: same mocking rationale as ephemeral-wallet.test.ts — this file
// covers storage/parsing behavior, not real AES-GCM (see
// seed-encryption.test.ts for that, against a fake-indexeddb-backed
// IndexedDB). A reversible XOR keeps round-trips working while still
// differing from the plaintext seed.
vi.mock('@/features/voto/crypto/seed-encryption', () => ({
  encryptSeed: async (seed: Uint8Array) => ({
    ciphertext: bytesToHex(seed.map((byte) => byte ^ 0xff)),
    iv: '0x00',
  }),
  decryptSeed: async (encrypted: { ciphertext: `0x${string}` }) =>
    hexToBytes(encrypted.ciphertext).map((byte) => byte ^ 0xff),
}))

const seedStorageKey = (idEleccion: number, scope: string) =>
  `votar:vote-seed:${idEleccion}:${scope}`

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

describe('getOrCreateElectionSeed (VOTAR-496)', () => {
  let localStorageMock: ReturnType<typeof createMemoryStorage>

  beforeEach(() => {
    localStorageMock = createMemoryStorage()
    vi.stubGlobal('localStorage', localStorageMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('generates a new 32-byte seed and persists it encrypted, not in plaintext', async () => {
    const seed = await getOrCreateElectionSeed(7, 'voter-scope-a')

    expect(seed).toHaveLength(32)

    const key = seedStorageKey(7, 'voter-scope-a')
    const stored = localStorageMock.getItem(key)
    expect(stored).not.toBeNull()

    const parsed = JSON.parse(stored as string) as {
      ciphertext: string
      iv: string
    }
    expect(parsed.ciphertext).toMatch(/^0x[0-9a-f]+$/)
    expect(parsed.iv).toMatch(/^0x[0-9a-f]+$/)
    // The stored value must never equal the plaintext seed hex.
    expect(parsed.ciphertext).not.toBe(bytesToHex(seed))
  })

  it('reuses the same seed on a second call (revote continuity)', async () => {
    const first = await getOrCreateElectionSeed(7, 'voter-scope-a')
    const second = await getOrCreateElectionSeed(7, 'voter-scope-a')

    expect(second).toEqual(first)
  })

  it('generates different seeds for different idEleccion or votanteScope', async () => {
    const baseline = await getOrCreateElectionSeed(7, 'voter-scope-a')
    const differentElection = await getOrCreateElectionSeed(8, 'voter-scope-a')
    const differentScope = await getOrCreateElectionSeed(7, 'voter-scope-b')

    expect(differentElection).not.toEqual(baseline)
    expect(differentScope).not.toEqual(baseline)
  })

  it('falls back to a fresh seed and warns when the stored value is corrupted', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const key = seedStorageKey(7, 'voter-scope-a')
    localStorageMock.setItem(key, 'not-valid-json-or-shape')

    const seed = await getOrCreateElectionSeed(7, 'voter-scope-a')

    expect(seed).toHaveLength(32)
    expect(warnSpy).toHaveBeenCalledTimes(1)
    expect(warnSpy.mock.calls[0][0]).toContain(key)

    warnSpy.mockRestore()
  })

  it('falls back to a fresh seed when the stored JSON has the wrong shape', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const key = seedStorageKey(7, 'voter-scope-a')
    localStorageMock.setItem(key, JSON.stringify({ foo: 'bar' }))

    const seed = await getOrCreateElectionSeed(7, 'voter-scope-a')

    expect(seed).toHaveLength(32)
    expect(warnSpy).toHaveBeenCalledTimes(1)

    warnSpy.mockRestore()
  })
})

describe('deriveEphemeralPrivateKey (VOTAR-352, unchanged by VOTAR-496)', () => {
  it('is deterministic: same seed and idEleccion always yield the same key', () => {
    const seed = new Uint8Array(32).fill(42)
    const first = deriveEphemeralPrivateKey(seed, 7)
    const second = deriveEphemeralPrivateKey(seed, 7)

    expect(first).toEqual(second)
  })

  it('yields different keys for different idEleccion with the same seed', () => {
    const seed = new Uint8Array(32).fill(42)
    const forElectionSeven = deriveEphemeralPrivateKey(seed, 7)
    const forElectionEight = deriveEphemeralPrivateKey(seed, 8)

    expect(forElectionSeven).not.toEqual(forElectionEight)
  })
})
