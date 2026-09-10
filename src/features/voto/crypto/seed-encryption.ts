import { bytesToHex, hexToBytes, type Hex } from 'viem'

const DB_NAME = 'votar-ephemeral-crypto'
const DB_VERSION = 1
const STORE_NAME = 'keys'
const ENCRYPTION_KEY_RECORD_ID = 'seed-encryption-key'
const AES_ALGORITHM = 'AES-GCM'
const AES_KEY_LENGTH = 256
const IV_BYTES = 12

export type EncryptedSeed = { ciphertext: Hex; iv: Hex }

let cachedKeyPromise: Promise<CryptoKey> | null = null

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

const readStoredKey = (db: IDBDatabase): Promise<CryptoKey | undefined> => {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const request = tx.objectStore(STORE_NAME).get(ENCRYPTION_KEY_RECORD_ID)
    request.onsuccess = () => resolve(request.result as CryptoKey | undefined)
    request.onerror = () => reject(request.error)
  })
}

const writeKey = (db: IDBDatabase, key: CryptoKey): Promise<void> => {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(key, ENCRYPTION_KEY_RECORD_ID)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/**
 * VOTAR-496: generates (or reuses) a non-extractable AES-GCM key so the
 * ephemeral wallet seed can be encrypted at rest. The key itself never
 * leaves the browser and can never be read back as raw bytes by any code,
 * including ours (`extractable: false`) — it survives page reloads because
 * it is persisted in IndexedDB, unlike an in-memory-only key.
 */
const createEncryptionKey = async (): Promise<CryptoKey> => {
  const db = await openDatabase()
  const stored = await readStoredKey(db)
  if (stored) {
    return stored
  }

  const key = await globalThis.crypto.subtle.generateKey(
    { name: AES_ALGORITHM, length: AES_KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  )
  await writeKey(db, key)
  return key
}

const getOrCreateEncryptionKey = (): Promise<CryptoKey> => {
  if (!cachedKeyPromise) {
    cachedKeyPromise = createEncryptionKey().catch((error: unknown) => {
      cachedKeyPromise = null
      throw error
    })
  }
  return cachedKeyPromise
}

export const encryptSeed = async (seed: Uint8Array): Promise<EncryptedSeed> => {
  const key = await getOrCreateEncryptionKey()
  const iv = new Uint8Array(IV_BYTES)
  globalThis.crypto.getRandomValues(iv)

  const ciphertextBuffer = await globalThis.crypto.subtle.encrypt(
    { name: AES_ALGORITHM, iv },
    key,
    new Uint8Array(seed)
  )

  return {
    ciphertext: bytesToHex(new Uint8Array(ciphertextBuffer)),
    iv: bytesToHex(iv),
  }
}

export const decryptSeed = async (
  encrypted: EncryptedSeed
): Promise<Uint8Array> => {
  const key = await getOrCreateEncryptionKey()
  const plaintextBuffer = await globalThis.crypto.subtle.decrypt(
    { name: AES_ALGORITHM, iv: new Uint8Array(hexToBytes(encrypted.iv)) },
    key,
    new Uint8Array(hexToBytes(encrypted.ciphertext))
  )

  return new Uint8Array(plaintextBuffer)
}
