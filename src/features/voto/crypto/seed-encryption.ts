import { bytesToHex, hexToBytes, type Hex } from 'viem'

const DB_NAME = 'votar-ephemeral-crypto'
const DB_VERSION = 1
const STORE_NAME = 'keys'
const AES_ALGORITHM = 'AES-GCM'
const AES_KEY_LENGTH = 256
const IV_BYTES = 12
const LOCK_NAME_PREFIX = 'votar-seed-encryption-key:'

export type EncryptedSeed = { ciphertext: Hex; iv: Hex }

// VOTAR-496 review: one CryptoKey per (idEleccion, votanteScope) — `context`
// (the same string used as storage key / AAD) doubles as the IndexedDB
// record id. Losing/corrupting one comicio's key no longer breaks every
// other comicio the voter used in this browser.
const cachedKeyPromises = new Map<string, Promise<CryptoKey>>()

const openDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = globalThis.indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

const readStoredKey = (
  db: IDBDatabase,
  recordId: string
): Promise<CryptoKey | undefined> => {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const request = tx.objectStore(STORE_NAME).get(recordId)
    request.onsuccess = () => resolve(request.result as CryptoKey | undefined)
    request.onerror = () => reject(request.error)
  })
}

const writeKey = (
  db: IDBDatabase,
  recordId: string,
  key: CryptoKey
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(key, recordId)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/**
 * VOTAR-496: generates (or reuses) a non-extractable AES-GCM key, one per
 * (idEleccion, votanteScope) — `recordId` is that pair's storage key.
 * Coordinated across browser tabs with navigator.locks: two tabs racing to
 * create the same comicio's key would otherwise overwrite each other in
 * IndexedDB, leaving one tab holding a key that no longer matches what's
 * persisted (VOTAR-496 review).
 */
const createEncryptionKey = async (recordId: string): Promise<CryptoKey> => {
  return globalThis.navigator.locks.request(
    `${LOCK_NAME_PREFIX}${recordId}`,
    async () => {
      const db = await openDatabase()
      try {
        // Re-check inside the lock: another tab may have created and
        // persisted this comicio's key while we were waiting our turn.
        const stored = await readStoredKey(db, recordId)
        if (stored) {
          return stored
        }

        const key = await globalThis.crypto.subtle.generateKey(
          { name: AES_ALGORITHM, length: AES_KEY_LENGTH },
          false,
          ['encrypt', 'decrypt']
        )
        await writeKey(db, recordId, key)
        return key
      } finally {
        db.close()
      }
    }
  )
}

const getOrCreateEncryptionKey = (recordId: string): Promise<CryptoKey> => {
  const cached = cachedKeyPromises.get(recordId)
  if (cached) {
    return cached
  }
  const promise = createEncryptionKey(recordId).catch((error: unknown) => {
    cachedKeyPromises.delete(recordId)
    throw error
  })
  cachedKeyPromises.set(recordId, promise)
  return promise
}

const deleteKeyRecord = (db: IDBDatabase, recordId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(recordId)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export const deleteEncryptionKey = async (context: string): Promise<void> => {
  cachedKeyPromises.delete(context)
  const db = await openDatabase()
  try {
    await deleteKeyRecord(db, context)
  } finally {
    db.close()
  }
}

export const encryptSeed = async (
  seed: Uint8Array,
  context: string
): Promise<EncryptedSeed> => {
  const key = await getOrCreateEncryptionKey(context)
  const iv = new Uint8Array(IV_BYTES)
  globalThis.crypto.getRandomValues(iv)
  const additionalData = new TextEncoder().encode(context)

  const ciphertextBuffer = await globalThis.crypto.subtle.encrypt(
    { name: AES_ALGORITHM, iv, additionalData },
    key,
    new Uint8Array(seed)
  )

  return {
    ciphertext: bytesToHex(new Uint8Array(ciphertextBuffer)),
    iv: bytesToHex(iv),
  }
}

export const decryptSeed = async (
  encrypted: EncryptedSeed,
  context: string
): Promise<Uint8Array> => {
  const key = await getOrCreateEncryptionKey(context)
  const additionalData = new TextEncoder().encode(context)
  const plaintextBuffer = await globalThis.crypto.subtle.decrypt(
    {
      name: AES_ALGORITHM,
      iv: new Uint8Array(hexToBytes(encrypted.iv)),
      additionalData,
    },
    key,
    new Uint8Array(hexToBytes(encrypted.ciphertext))
  )

  return new Uint8Array(plaintextBuffer)
}
