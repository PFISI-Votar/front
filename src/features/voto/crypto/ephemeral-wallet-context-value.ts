import { createContext } from 'react'
import type { EphemeralWalletSession } from '@/features/voto/crypto/ephemeral-wallet.types'

export type EphemeralWalletContextValue = {
  isSupported: boolean
  isReady: boolean
  publicKeyHex: string | null
  session: EphemeralWalletSession | null
  initialize: (idEleccion: number) => Promise<EphemeralWalletSession>
  destroy: () => void
}

export const EphemeralWalletContext =
  createContext<EphemeralWalletContextValue | null>(null)
