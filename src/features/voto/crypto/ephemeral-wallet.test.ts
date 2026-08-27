import { hexToBytes } from 'viem'
import { privateKeyToAccount, generatePrivateKey } from 'viem/accounts'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createEphemeralWalletManager } from '@/features/voto/crypto/ephemeral-wallet'
import { signDigestWithSecp256k1 } from '@/features/voto/crypto/secp256k1-digest-signer'
import { computeSelectionHash } from '@/features/voto/crypto/selection-hash'
import { hashVoteTypedData } from '@/features/voto/crypto/vote-signer'

const TEST_BALLOT_ADDRESS =
  '0x0000000000000000000000000000000000000001' as const

const VOTANTE_SCOPE_A = 'voter-scope-a'
const VOTANTE_SCOPE_B = 'voter-scope-b'
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

const STORAGE_KEYS = [
  'privateKey',
  'private_key',
  'ephemeralWallet',
  'ephemeral-wallet',
  'myPrivateKey',
]

describe('createEphemeralWalletManager (VOTAR-352)', () => {
  let manager: ReturnType<typeof createEphemeralWalletManager>
  let localStorageMock: ReturnType<typeof createMemoryStorage>
  let sessionStorageMock: ReturnType<typeof createMemoryStorage>

  beforeEach(() => {
    manager = createEphemeralWalletManager()
    localStorageMock = createMemoryStorage()
    sessionStorageMock = createMemoryStorage()
    vi.stubGlobal('localStorage', localStorageMock)
    vi.stubGlobal('sessionStorage', sessionStorageMock)
    vi.stubGlobal('document', { cookie: '' })
  })

  afterEach(() => {
    manager.destroy()
    vi.unstubAllGlobals()
  })

  it('generates a compressed secp256k1 public key for a valid election', async () => {
    const session = await manager.initialize(7, VOTANTE_SCOPE_A)

    expect(session.idEleccion).toBe(7)
    expect(session.publicKeyHex).toMatch(/^0x0[23][0-9a-f]{64}$/)
    expect(session.createdAt).toBeTypeOf('number')
    expect(manager.getPublicKeyHex()).toBe(session.publicKeyHex)
    expect(manager.getSession()).toEqual(session)
  })

  it('UAT-01: never persists private/public key material in storage or cookies', async () => {
    const session = await manager.initialize(7, VOTANTE_SCOPE_A)
    const publicKeyHex = session.publicKeyHex

    for (const key of STORAGE_KEYS) {
      expect(localStorageMock.getItem(key)).toBeNull()
      expect(sessionStorageMock.getItem(key)).toBeNull()
    }

    // VOTAR-353: a random per-(browser, idEleccion) seed IS persisted so the
    // same voter reaches the same nullifier across sign attempts — but the
    // seed is not the private/public key, and never appears verbatim in it.
    expect(localStorageMock.length).toBe(1)
    expect(
      localStorageMock.getItem(seedStorageKey(7, VOTANTE_SCOPE_A))
    ).toMatch(/^0x[0-9a-f]{64}$/)
    expect(
      localStorageMock.getItem(seedStorageKey(7, VOTANTE_SCOPE_A))
    ).not.toBe(publicKeyHex)
    expect(sessionStorageMock.length).toBe(0)
    expect(document.cookie).not.toContain(publicKeyHex.slice(2))
    expect(document.cookie.toLowerCase()).not.toContain('private')
  })

  it('VOTAR-353: destroy clears the session, but regenerating for the same election yields the same public key (LAST_VOTE_WINS revote support)', async () => {
    const firstSession = await manager.initialize(7, VOTANTE_SCOPE_A)
    manager.destroy()

    expect(manager.getSession()).toBeNull()
    expect(manager.getPublicKeyHex()).toBeNull()

    const secondSession = await manager.initialize(7, VOTANTE_SCOPE_A)
    expect(secondSession.publicKeyHex).toBe(firstSession.publicKeyHex)
    expect(secondSession.publicKeyHex).toMatch(/^0x0[23][0-9a-f]{64}$/)
  })

  it('VOTAR-353: two different elections derive different public keys from the same browser', async () => {
    const electionSeven = await manager.initialize(7, VOTANTE_SCOPE_A)
    manager.destroy()
    const electionEight = await manager.initialize(8, VOTANTE_SCOPE_A)

    expect(electionEight.publicKeyHex).not.toBe(electionSeven.publicKeyHex)
  })

  it('VOTAR-452: distintos votanteScope derivan claves distintas para la misma elección', async () => {
    const voterA = await manager.initialize(7, VOTANTE_SCOPE_A)
    manager.destroy()
    const voterB = await manager.initialize(7, VOTANTE_SCOPE_B)

    expect(voterB.publicKeyHex).not.toBe(voterA.publicKeyHex)
    expect(
      localStorageMock.getItem(seedStorageKey(7, VOTANTE_SCOPE_A))
    ).toMatch(/^0x[0-9a-f]{64}$/)
    expect(
      localStorageMock.getItem(seedStorageKey(7, VOTANTE_SCOPE_B))
    ).toMatch(/^0x[0-9a-f]{64}$/)
  })

  it('UAT-03: does not expose private key accessors on the public API or window', async () => {
    await manager.initialize(7, VOTANTE_SCOPE_A)

    expect(manager).not.toHaveProperty('getPrivateKey')
    expect(manager).not.toHaveProperty('privateKey')
    expect(manager).not.toHaveProperty('exportPrivateKey')
    expect(
      (globalThis as { myPrivateKey?: unknown }).myPrivateKey
    ).toBeUndefined()
    expect((globalThis as { privateKey?: unknown }).privateKey).toBeUndefined()

    const publicKeys = Object.keys(manager)
    expect(publicKeys).toEqual([
      'initialize',
      'getSession',
      'getPublicKeyHex',
      'signDigest',
      'signVotePayload',
      'destroy',
    ])
  })

  it('UAT-04 / VOTAR-418: signVotePayload destroys session so a second sign fails', async () => {
    await manager.initialize(357, VOTANTE_SCOPE_A)
    const selection = {
      selecciones: [{ idCategoria: 1, idCandidato: 101 }],
    }
    const nullifier =
      '0x1111111111111111111111111111111111111111111111111111111111111111' as const

    const signed = await manager.signVotePayload(
      selection,
      nullifier,
      TEST_BALLOT_ADDRESS
    )
    expect(signed.electionId).toBe(357)
    expect(signed.nullifier).toBe(nullifier)
    expect(signed.signature).toMatch(/^0x[0-9a-f]+$/i)
    expect(manager.getPublicKeyHex()).toBeNull()
    expect(manager.getSession()).toBeNull()

    await expect(
      manager.signVotePayload(selection, nullifier, TEST_BALLOT_ADDRESS)
    ).rejects.toThrow('Ephemeral wallet is not initialized')
  })

  it('VOTAR-418: signVotePayload zeroizes the private-key Uint8Array buffer', async () => {
    const fillSpy = vi.spyOn(Uint8Array.prototype, 'fill')
    await manager.initialize(418, VOTANTE_SCOPE_A)
    const selection = {
      selecciones: [{ idCategoria: 1, idCandidato: 101 }],
    }
    const nullifier =
      '0x2222222222222222222222222222222222222222222222222222222222222222' as const

    fillSpy.mockClear()
    await manager.signVotePayload(selection, nullifier, TEST_BALLOT_ADDRESS)

    const zeroizeCalls = fillSpy.mock.calls.filter(
      (call) => call[0] === 0 && call.length === 1
    )
    expect(zeroizeCalls.length).toBeGreaterThanOrEqual(1)
    fillSpy.mockRestore()
  })

  it('VOTAR-418: failed signature does not destroy the wallet', async () => {
    await manager.initialize(418, VOTANTE_SCOPE_A)
    const publicKeyBefore = manager.getPublicKeyHex()
    const selection = {
      selecciones: [{ idCategoria: 1, idCandidato: 101 }],
    }

    await expect(
      manager.signVotePayload(
        selection,
        '0xdead' as `0x${string}`,
        TEST_BALLOT_ADDRESS
      )
    ).rejects.toThrow(/nullifier must be a 32-byte hex value/)

    expect(manager.getPublicKeyHex()).toBe(publicKeyBefore)
    expect(manager.getSession()).not.toBeNull()

    const nullifier =
      '0x3333333333333333333333333333333333333333333333333333333333333333' as const
    const signed = await manager.signVotePayload(
      selection,
      nullifier,
      TEST_BALLOT_ADDRESS
    )
    expect(signed.signature).toMatch(/^0x[0-9a-f]+$/i)
  })

  it('VOTAR-418: signDigest matches viem account signature for the same digest', async () => {
    const privateKeyHex = generatePrivateKey()
    const account = privateKeyToAccount(privateKeyHex)
    const privateKeyBytes = hexToBytes(privateKeyHex)
    const selection = {
      selecciones: [{ idCategoria: 1, idCandidato: 101 }],
    }
    const nullifier =
      '0x4444444444444444444444444444444444444444444444444444444444444444' as const
    const timestamp = 1_700_000_000
    const selectionHash = computeSelectionHash(selection)
    const digest = hashVoteTypedData(
      357,
      selectionHash,
      nullifier,
      101n,
      timestamp,
      {
        chainId: 31_337,
        verifyingContract: '0x0000000000000000000000000000000000000001',
      }
    )

    const nobleSig = await signDigestWithSecp256k1(privateKeyBytes, digest)
    const viemSig = await account.signTypedData({
      domain: {
        name: 'VOTAR',
        version: '1',
        chainId: 31_337,
        verifyingContract: '0x0000000000000000000000000000000000000001',
      },
      types: {
        Vote: [
          { name: 'electionId', type: 'uint256' },
          { name: 'nullifier', type: 'bytes32' },
          { name: 'selectionHash', type: 'bytes32' },
          { name: 'candidateId', type: 'uint256' },
          { name: 'timestamp', type: 'uint256' },
        ],
      },
      primaryType: 'Vote',
      message: {
        electionId: BigInt(357),
        nullifier,
        selectionHash,
        candidateId: 101n,
        timestamp: BigInt(timestamp),
      },
    })

    expect(nobleSig.toLowerCase()).toBe(viemSig.toLowerCase())
  })

  it('rejects invalid election ids', async () => {
    await expect(manager.initialize(0, VOTANTE_SCOPE_A)).rejects.toThrow(
      'idEleccion must be a positive integer'
    )
    await expect(manager.initialize(-1, VOTANTE_SCOPE_A)).rejects.toThrow(
      'idEleccion must be a positive integer'
    )
  })

  it('rejects initialization without votanteScope', async () => {
    await expect(manager.initialize(7, '')).rejects.toThrow(
      'votanteScope is required'
    )
  })

  it('rejects initialization when Web Crypto is unavailable', async () => {
    vi.stubGlobal('crypto', undefined)
    await expect(manager.initialize(7, VOTANTE_SCOPE_A)).rejects.toThrow(
      'Web Crypto API is not supported in this browser'
    )
  })
})
