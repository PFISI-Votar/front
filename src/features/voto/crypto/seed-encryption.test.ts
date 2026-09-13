import 'fake-indexeddb/auto'
import { bytesToHex } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const DB_NAME = 'votar-ephemeral-crypto'

const deleteDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = globalThis.indexedDB.deleteDatabase(DB_NAME)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
    request.onblocked = () => resolve()
  })
}

const importFreshModule = async () => {
  vi.resetModules()
  return import('@/features/voto/crypto/seed-encryption')
}

describe('seed-encryption (VOTAR-496)', () => {
  beforeEach(async () => {
    await deleteDatabase()
  })

  it('decrypts back to the exact original seed', async () => {
    const { encryptSeed, decryptSeed } = await importFreshModule()
    const seed = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8])

    const encrypted = await encryptSeed(seed)
    const decrypted = await decryptSeed(encrypted)

    expect(decrypted).toEqual(seed)
  })

  it('never leaves the plaintext seed recognizable inside the ciphertext', async () => {
    const { encryptSeed } = await importFreshModule()
    const seed = new Uint8Array(32).fill(7)
    const seedHex = bytesToHex(seed).replace(/^0x/, '').toLowerCase()

    const encrypted = await encryptSeed(seed)

    expect(encrypted.ciphertext.toLowerCase()).not.toContain(seedHex)
  })

  it('uses a fresh IV each time, so encrypting the same seed twice differs', async () => {
    const { encryptSeed } = await importFreshModule()
    const seed = new Uint8Array(32).fill(9)

    const first = await encryptSeed(seed)
    const second = await encryptSeed(seed)

    expect(first.iv).not.toEqual(second.iv)
    expect(first.ciphertext).not.toEqual(second.ciphertext)
  })

  it('reuses the same key across a simulated page reload', async () => {
    // A fresh module instance clears the in-memory key cache, but the
    // underlying IndexedDB (the real persistence layer) is untouched —
    // this is exactly what happens on an actual browser reload (F5).
    const beforeReload = await importFreshModule()
    const seed = new Uint8Array(32).fill(3)
    const encrypted = await beforeReload.encryptSeed(seed)

    const afterReload = await importFreshModule()
    const decrypted = await afterReload.decryptSeed(encrypted)

    expect(decrypted).toEqual(seed)
  })

  it('does not create two different keys when called concurrently before one exists', async () => {
    const { encryptSeed } = await importFreshModule()
    const generateKeySpy = vi.spyOn(globalThis.crypto.subtle, 'generateKey')

    const [encryptedA, encryptedB] = await Promise.all([
      encryptSeed(new Uint8Array(32).fill(1)),
      encryptSeed(new Uint8Array(32).fill(2)),
    ])

    expect(generateKeySpy).toHaveBeenCalledTimes(1)
    expect(encryptedA.ciphertext).not.toEqual(encryptedB.ciphertext)

    generateKeySpy.mockRestore()
  })

  it('recovers on the next call if key generation fails once', async () => {
    const { encryptSeed } = await importFreshModule()
    const generateKeySpy = vi
      .spyOn(globalThis.crypto.subtle, 'generateKey')
      .mockRejectedValueOnce(new Error('boom'))

    await expect(encryptSeed(new Uint8Array(32))).rejects.toThrow('boom')
    generateKeySpy.mockRestore()

    const encrypted = await encryptSeed(new Uint8Array(32).fill(5))
    expect(encrypted.ciphertext).toBeTruthy()
  })
})
