import { createContext } from 'react'
import type { Hex } from 'viem'
import type { EphemeralWalletSession } from '@/features/voto/crypto/ephemeral-wallet.types'
import type { SelectionPayload } from '@/features/voto/crypto/selection-hash'
import type { SignedVotePayload } from '@/features/voto/crypto/vote-signer'

export type EphemeralWalletContextValue = {
  isSupported: boolean
  isReady: boolean
  publicKeyHex: string | null
  session: EphemeralWalletSession | null
  initialize: (idEleccion: number) => Promise<EphemeralWalletSession>
  signVotePayload: (
    selection: SelectionPayload,
    nullifier: Hex,
    ballotContractAddress: Hex
  ) => Promise<SignedVotePayload>
  destroy: () => void
}

export const EphemeralWalletContext =
  createContext<EphemeralWalletContextValue | null>(null)
