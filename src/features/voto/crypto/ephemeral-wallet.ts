import { getPublicKey, utils as secpUtils } from '@noble/secp256k1'
import type { Hex } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import type {
  EphemeralWalletManager,
  EphemeralWalletSession,
} from '@/features/voto/crypto/ephemeral-wallet.types'
import type { SelectionPayload } from '@/features/voto/crypto/selection-hash'
import {
  signVotePayload as signTypedVotePayload,
  type SignedVotePayload,
} from '@/features/voto/crypto/vote-signer'
import { isWebCryptoSupported } from '@/features/voto/crypto/web-crypto-support'

const PRIVATE_KEY_BYTES = 32
const MAX_KEYGEN_ATTEMPTS = 16

const bytesToHex = (bytes: Uint8Array): Hex =>
  `0x${Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')}`

const zeroize = (buffer: Uint8Array | null): void => {
  if (!buffer) {
    return
  }
  buffer.fill(0)
}

const generateSecp256k1PrivateKey = (): Uint8Array => {
  const cryptoApi = globalThis.crypto
  if (!cryptoApi?.getRandomValues) {
    throw new Error('Web Crypto getRandomValues is unavailable')
  }

  for (let attempt = 0; attempt < MAX_KEYGEN_ATTEMPTS; attempt += 1) {
    const candidate = new Uint8Array(PRIVATE_KEY_BYTES)
    cryptoApi.getRandomValues(candidate)
    if (secpUtils.isValidSecretKey(candidate)) {
      return candidate
    }
    zeroize(candidate)
  }

  throw new Error('Unable to generate a valid secp256k1 private key')
}

/**
 * Creates an encapsulated ephemeral wallet manager.
 *
 * The private key lives only inside this closure and is never exposed
 * through the public API (equivalent to extractable: false).
 * After a successful signVotePayload the key is zeroized (UAT-04 / VOTAR-357).
 */
export const createEphemeralWalletManager = (): EphemeralWalletManager => {
  let privateKey: Uint8Array | null = null
  let session: EphemeralWalletSession | null = null

  const destroy = (): void => {
    zeroize(privateKey)
    privateKey = null
    session = null
  }

  const initialize = async (
    idEleccion: number
  ): Promise<EphemeralWalletSession> => {
    if (!Number.isInteger(idEleccion) || idEleccion <= 0) {
      throw new Error('idEleccion must be a positive integer')
    }

    if (!isWebCryptoSupported()) {
      throw new Error('Web Crypto API is not supported in this browser')
    }

    destroy()

    const nextPrivateKey = generateSecp256k1PrivateKey()
    const publicKeyBytes = getPublicKey(nextPrivateKey, true)
    const publicKeyHex = bytesToHex(publicKeyBytes)

    privateKey = nextPrivateKey
    session = Object.freeze({
      idEleccion,
      publicKeyHex,
      createdAt: Date.now(),
    })

    return session
  }

  const getSession = (): EphemeralWalletSession | null => session

  const getPublicKeyHex = (): string | null => session?.publicKeyHex ?? null

  const signVotePayload = async (
    selection: SelectionPayload,
    nullifier: Hex
  ): Promise<SignedVotePayload> => {
    if (!privateKey || !session) {
      throw new Error('Ephemeral wallet is not initialized')
    }

    const privateKeyHex = bytesToHex(privateKey)
    const account = privateKeyToAccount(privateKeyHex)
    const signed = await signTypedVotePayload(
      account,
      session.idEleccion,
      selection,
      { nullifier }
    )

    // UAT-04: destroy signing material immediately after a successful signature.
    zeroize(privateKey)
    privateKey = null

    return signed
  }

  return Object.freeze({
    initialize,
    getSession,
    getPublicKeyHex,
    signVotePayload,
    destroy,
  })
}
