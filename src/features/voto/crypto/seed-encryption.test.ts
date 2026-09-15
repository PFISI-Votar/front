import 'fake-indexeddb/auto'
import { bytesToHex } from 'viem'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const DB_NAME = 'votar-ephemeral-crypto'
const STORE_NAME = 'keys'
const CONTEXT_A = 'votar:vote-seed:7:voter-scope-a'
const CONTEXT_B = 'votar:vote-seed:7:voter-scope-b'

const deleteDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = globalThis.indexedDB.deleteDatabase(DB_NAME)
    request.onsuccess = () => resolve()
    request.onerror = () => reject(request.error)
    request.onblocked = () => resolve()
  })
}

const deleteKeyRecord = (recordId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = globalThis.indexedDB.open(DB_NAME)
    request.onsuccess = () => {
      const db = request.result
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).delete(recordId)
      tx.oncomplete = () => {
        db.close()
        resolve()
      }
      tx.onerror = () => {
        db.close()
        reject(tx.error)
      }
    }
    request.onerror = () => reject(request.error)
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

    const encrypted = await encryptSeed(seed, CONTEXT_A)
    const decrypted = await decryptSeed(encrypted, CONTEXT_A)

    expect(decrypted).toEqual(seed)
  })

  it('never leaves the plaintext seed recognizable inside the ciphertext', async () => {
    const { encryptSeed } = await importFreshModule()
    const seed = new Uint8Array(32).fill(7)
    const seedHex = bytesToHex(seed).replace(/^0x/, '').toLowerCase()

    const encrypted = await encryptSeed(seed, CONTEXT_A)

    expect(encrypted.ciphertext.toLowerCase()).not.toContain(seedHex)
  })

  it('uses a fresh IV each time, so encrypting the same seed twice differs', async () => {
    const { encryptSeed } = await importFreshModule()
    const seed = new Uint8Array(32).fill(9)

    const first = await encryptSeed(seed, CONTEXT_A)
    const second = await encryptSeed(seed, CONTEXT_A)

    expect(first.iv).not.toEqual(second.iv)
    expect(first.ciphertext).not.toEqual(second.ciphertext)
  })

  it('reuses the same key across a simulated page reload', async () => {
    const beforeReload = await importFreshModule()
    const seed = new Uint8Array(32).fill(3)
    const encrypted = await beforeReload.encryptSeed(seed, CONTEXT_A)

    const afterReload = await importFreshModule()
    const decrypted = await afterReload.decryptSeed(encrypted, CONTEXT_A)

    expect(decrypted).toEqual(seed)
  })

  it('does not create two different keys when the same context races concurrently', async () => {
    const { encryptSeed } = await importFreshModule()
    const generateKeySpy = vi.spyOn(globalThis.crypto.subtle, 'generateKey')

    const [encryptedA, encryptedB] = await Promise.all([
      encryptSeed(new Uint8Array(32).fill(1), CONTEXT_A),
      encryptSeed(new Uint8Array(32).fill(2), CONTEXT_A),
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

    await expect(encryptSeed(new Uint8Array(32), CONTEXT_A)).rejects.toThrow(
      'boom'
    )
    generateKeySpy.mockRestore()

    const encrypted = await encryptSeed(new Uint8Array(32).fill(5), CONTEXT_A)
    expect(encrypted.ciphertext).toBeTruthy()
  })

  it('VOTAR-496 review: rejects decryption when the context does not match (AAD)', async () => {
    const { encryptSeed, decryptSeed } = await importFreshModule()
    const seed = new Uint8Array(32).fill(4)

    const encrypted = await encryptSeed(seed, CONTEXT_A)

    await expect(decryptSeed(encrypted, CONTEXT_B)).rejects.toThrow()
  })

  it('VOTAR-496 review: a ciphertext copied to a different election/voter key cannot be decrypted', async () => {
    const { encryptSeed, decryptSeed } = await importFreshModule()
    const seedFromElectionSeven = new Uint8Array(32).fill(6)

    const encryptedForElectionSeven = await encryptSeed(
      seedFromElectionSeven,
      'votar:vote-seed:7:voter-scope-a'
    )

    await expect(
      decryptSeed(encryptedForElectionSeven, 'votar:vote-seed:8:voter-scope-a')
    ).rejects.toThrow()
  })

  it('VOTAR-496 review: uses a separate key per comicio/votante, so losing one does not affect another', async () => {
    const { encryptSeed } = await importFreshModule()
    const seedA = new Uint8Array(32).fill(1)
    const seedB = new Uint8Array(32).fill(2)

    const encryptedA = await encryptSeed(seedA, CONTEXT_A)
    const encryptedB = await encryptSeed(seedB, CONTEXT_B)

    // Simulate losing ONLY CONTEXT_A's key (its IndexedDB record
    // specifically), leaving CONTEXT_B's untouched. A fresh module import
    // clears the in-memory cache for both (equivalent to a page reload) —
    // CONTEXT_B must still find and reuse its own key, unaffected by A's
    // loss.
    await deleteKeyRecord(CONTEXT_A)
    const afterPartialLoss = await importFreshModule()

    const decryptedB = await afterPartialLoss.decryptSeed(encryptedB, CONTEXT_B)
    expect(decryptedB).toEqual(seedB)

    await expect(
      afterPartialLoss.decryptSeed(encryptedA, CONTEXT_A)
    ).rejects.toThrow()
  })
})
