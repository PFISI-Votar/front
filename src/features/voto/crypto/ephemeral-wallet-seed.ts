import { utils as secpUtils } from '@noble/secp256k1'
import { bytesToHex, keccak256, toBytes } from 'viem'
import {
  decryptSeed,
  encryptSeed,
  type EncryptedSeed,
} from '@/features/voto/crypto/seed-encryption'

const SEED_BYTES = 32
const MAX_DERIVE_ATTEMPTS = 16
const STORAGE_PREFIX = 'votar:vote-seed:'

const storageKey = (idEleccion: number, votanteScope: string): string =>
  `${STORAGE_PREFIX}${idEleccion}:${votanteScope}`

const HEX_STRING_REGEX = /^0x[0-9a-f]+$/i

const isEncryptedSeed = (value: unknown): value is EncryptedSeed => {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.ciphertext === 'string' &&
    HEX_STRING_REGEX.test(candidate.ciphertext) &&
    typeof candidate.iv === 'string' &&
    HEX_STRING_REGEX.test(candidate.iv)
  )
}

const tryParseEncryptedSeed = (stored: string): EncryptedSeed | null => {
  try {
    const parsed: unknown = JSON.parse(stored)
    return isEncryptedSeed(parsed) ? parsed : null
  } catch {
    return null
  }
}

/**
 * Returns the per-(browser, idEleccion, votanteScope) random seed used to
 * deterministically derive the voter's ephemeral wallet.
 *
 * The seed itself is random — never derived from `votanteHash`, dni, email
 * or any padron data — so it never lets an outside party (including someone
 * with padron access) recompute a voter's nullifier from their identity
 * (VOTAR-353's unlinkability invariant). It only lets THIS browser
 * reconstruct the SAME ephemeral wallet (and therefore the same nullifier)
 * across multiple sign attempts, so a LAST_VOTE_WINS revote overwrites the
 * voter's previous on-chain vote instead of registering as a brand-new
 * anonymous voter.
 *
 * Scoped by `votanteScope` (JWT sub) so two legajos on the same browser do
 * not share a nullifier or on-chain cooldown (VOTAR-452 bug 4). Persisted
 * in localStorage so revotes resolve to the same nullifier across logout/login
 * cycles, matching server-side `estado-revoto` (VOTAR-328).
 *
 * VOTAR-496: the seed is encrypted at rest (AES-GCM, non-extractable key in
 * IndexedDB — see seed-encryption.ts) so a party with mere storage read
 * access can no longer recompute the private key from a plaintext seed.
 */
export const getOrCreateElectionSeed = async (
  idEleccion: number,
  votanteScope: string
): Promise<Uint8Array> => {
  const key = storageKey(idEleccion, votanteScope)
  const stored = globalThis.localStorage.getItem(key)
  if (stored) {
    const parsed = tryParseEncryptedSeed(stored)
    if (parsed) {
      return decryptSeed(parsed)
    }
    // eslint-disable-next-line no-console -- VOTAR-496: no hay logger propio en el proyecto, alerta de storage corrupto/legado.
    console.warn(
      `[VOTAR-496] Valor inesperado en localStorage para "${key}" — no matchea el formato de seed cifrado. Se generará un seed nuevo.`
    )
  }

  const seed = new Uint8Array(SEED_BYTES)
  globalThis.crypto.getRandomValues(seed)
  const encrypted = await encryptSeed(seed)
  globalThis.localStorage.setItem(key, JSON.stringify(encrypted))
  return seed
}

/**
 * Deterministically derives a valid secp256k1 private key from `seed` and
 * `idEleccion`: same inputs always yield the same key (and therefore the
 * same nullifier), unlike a freshly randomized key per sign attempt.
 */
export const deriveEphemeralPrivateKey = (
  seed: Uint8Array,
  idEleccion: number
): Uint8Array => {
  const seedHex = bytesToHex(seed)
  for (let counter = 0; counter < MAX_DERIVE_ATTEMPTS; counter += 1) {
    const material = `${seedHex}:${idEleccion}:${counter}`
    const candidate = toBytes(keccak256(toBytes(material)))
    if (secpUtils.isValidSecretKey(candidate)) {
      return candidate
    }
  }

  throw new Error(
    'No se pudo derivar una clave secp256k1 válida a partir de la semilla del votante'
  )
}
