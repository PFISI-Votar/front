import { Point, getPublicKey } from '@noble/secp256k1'
import { bytesToHex, type Hex } from 'viem'
import { publicKeyToAddress } from 'viem/accounts'
import {
  deriveEphemeralPrivateKey,
  getOrCreateElectionSeed,
} from '@/features/voto/crypto/ephemeral-wallet-seed'
import type {
  EphemeralWalletManager,
  EphemeralWalletSession,
} from '@/features/voto/crypto/ephemeral-wallet.types'
import { signDigestWithSecp256k1 } from '@/features/voto/crypto/secp256k1-digest-signer'
import type { SelectionPayload } from '@/features/voto/crypto/selection-hash'
import {
  signVotePayloadWithDigestSigner,
  type SignedVotePayload,
} from '@/features/voto/crypto/vote-signer'
import { isWebCryptoSupported } from '@/features/voto/crypto/web-crypto-support'

const zeroize = (buffer: Uint8Array | null): void => {
  if (!buffer) {
    return
  }
  buffer.fill(0)
}

/**
 * Derives an Ethereum address from a compressed secp256k1 public key hex.
 * viem's publicKeyToAddress expects an uncompressed SEC1 key (0x04...).
 */
const addressFromCompressedPublicKey = (publicKeyHex: string): Hex => {
  const uncompressed = Point.fromHex(publicKeyHex.replace(/^0x/i, '')).toBytes(
    false
  )
  return publicKeyToAddress(bytesToHex(uncompressed))
}

/**
 * Creates an encapsulated ephemeral wallet manager.
 *
 * The private key lives only inside this closure and is never exposed
 * through the public API (equivalent to extractable: false).
 * After a successful signVotePayload the key is destroyed via destroy()
 * (UAT-04 / VOTAR-357 / VOTAR-418).
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

    // VOTAR-353: derive (not randomize) the ephemeral key so the same
    // voter always reaches the same nullifier across sign attempts —
    // required for LAST_VOTE_WINS revotes to overwrite, not multiply.
    const seed = getOrCreateElectionSeed(idEleccion)
    const nextPrivateKey = deriveEphemeralPrivateKey(seed, idEleccion)
    zeroize(seed)
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

  /**
   * Signs a 32-byte digest with the ephemeral private key.
   * Does not destroy the wallet; callers that need one-shot signing
   * should use signVotePayload instead.
   */
  const signDigest = async (digest: Hex): Promise<Hex> => {
    if (!privateKey || !session) {
      throw new Error('Ephemeral wallet is not initialized')
    }
    return signDigestWithSecp256k1(privateKey, digest)
  }

  const signVotePayload = async (
    selection: SelectionPayload,
    nullifier: Hex,
    ballotContractAddress: Hex
  ): Promise<SignedVotePayload> => {
    if (!privateKey || !session) {
      throw new Error('Ephemeral wallet is not initialized')
    }

    const expectedSigner = addressFromCompressedPublicKey(session.publicKeyHex)
    const electionId = session.idEleccion

    const signed = await signVotePayloadWithDigestSigner(
      electionId,
      selection,
      {
        nullifier,
        expectedSigner,
        signDigest,
        verifyingContract: ballotContractAddress,
      }
    )

    // VOTAR-418 / CLAUDE.md paso 9: destroy signing material immediately
    // after a successful signature (zeroize + clear session).
    destroy()

    return signed
  }

  return Object.freeze({
    initialize,
    getSession,
    getPublicKeyHex,
    signDigest,
    signVotePayload,
    destroy,
  })
}
