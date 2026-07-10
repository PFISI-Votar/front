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
   * Signs the ballot selection. `nullifier` must come from VOTAR-353.
   */
  signVotePayload: (
    selection: SelectionPayload,
    nullifier: Hex
  ) => Promise<SignedVotePayload>
  destroy: () => void
}
