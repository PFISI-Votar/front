import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createEphemeralWalletManager } from '@/features/voto/crypto/ephemeral-wallet'

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
    const session = await manager.initialize(7)

    expect(session.idEleccion).toBe(7)
    expect(session.publicKeyHex).toMatch(/^0x0[23][0-9a-f]{64}$/)
    expect(session.createdAt).toBeTypeOf('number')
    expect(manager.getPublicKeyHex()).toBe(session.publicKeyHex)
    expect(manager.getSession()).toEqual(session)
  })

  it('UAT-01: does not persist private material in storage or cookies', async () => {
    const session = await manager.initialize(7)
    const publicKeyHex = session.publicKeyHex

    for (const key of STORAGE_KEYS) {
      expect(localStorageMock.getItem(key)).toBeNull()
      expect(sessionStorageMock.getItem(key)).toBeNull()
    }

    expect(localStorageMock.length).toBe(0)
    expect(sessionStorageMock.length).toBe(0)
    expect(document.cookie).not.toContain(publicKeyHex.slice(2))
    expect(document.cookie.toLowerCase()).not.toContain('private')
  })

  it('UAT-02: destroy clears the session and regenerate yields a new public key', async () => {
    const firstSession = await manager.initialize(7)
    manager.destroy()

    expect(manager.getSession()).toBeNull()
    expect(manager.getPublicKeyHex()).toBeNull()

    const secondSession = await manager.initialize(7)
    expect(secondSession.publicKeyHex).not.toBe(firstSession.publicKeyHex)
    expect(secondSession.publicKeyHex).toMatch(/^0x0[23][0-9a-f]{64}$/)
  })

  it('UAT-03: does not expose private key accessors on the public API or window', async () => {
    await manager.initialize(7)

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
      'destroy',
    ])
  })

  it('rejects invalid election ids', async () => {
    await expect(manager.initialize(0)).rejects.toThrow(
      'idEleccion must be a positive integer'
    )
    await expect(manager.initialize(-1)).rejects.toThrow(
      'idEleccion must be a positive integer'
    )
  })

  it('rejects initialization when Web Crypto is unavailable', async () => {
    vi.stubGlobal('crypto', undefined)
    await expect(manager.initialize(7)).rejects.toThrow(
      'Web Crypto API is not supported in this browser'
    )
  })
})
