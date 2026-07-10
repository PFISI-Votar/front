import type { Hex } from 'viem'
import type { SelectionPayload } from '@/features/voto/crypto/selection-hash'
import type { SignedVotePayload } from '@/features/voto/crypto/vote-signer'

/**
 * Public session metadata for an ephemeral ECC wallet.
 * Never includes the private key.
 */
export type EphemeralWalletSession = {
  readonly idEleccion: number
  readonly publicKeyHex: string
  readonly createdAt: number
}

export type EphemeralWalletManager = {
  initialize: (idEleccion: number) => Promise<EphemeralWalletSession>
  getSession: () => EphemeralWalletSession | null
  getPublicKeyHex: () => string | null
  /**
   * Signs a 32-byte digest with the ephemeral private key.
   * Does not destroy the wallet.
   */
  signDigest: (digest: Hex) => Promise<Hex>
  /**
   * Signs the ballot selection. `nullifier` must come from VOTAR-353.
   * On success, destroys the private key and session immediately (VOTAR-418).
   */
  signVotePayload: (
    selection: SelectionPayload,
    nullifier: Hex
  ) => Promise<SignedVotePayload>
  destroy: () => void
}
