import { utils as secpUtils } from '@noble/secp256k1'
import { bytesToHex, hexToBytes, keccak256, toBytes, type Hex } from 'viem'

const SEED_BYTES = 32
const MAX_DERIVE_ATTEMPTS = 16
const STORAGE_PREFIX = 'votar:vote-seed:'

const storageKey = (idEleccion: number, votanteScope: string): string =>
  `${STORAGE_PREFIX}${idEleccion}:${votanteScope}`

const SEED_HEX_REGEX = /^0x[0-9a-f]{64}$/i

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
 */
export const getOrCreateElectionSeed = (
  idEleccion: number,
  votanteScope: string
): Uint8Array => {
  const key = storageKey(idEleccion, votanteScope)
  const stored = globalThis.localStorage.getItem(key)
  if (stored && SEED_HEX_REGEX.test(stored)) {
    return hexToBytes(stored as Hex)
  }

  const seed = new Uint8Array(SEED_BYTES)
  globalThis.crypto.getRandomValues(seed)
  globalThis.localStorage.setItem(key, bytesToHex(seed))
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
