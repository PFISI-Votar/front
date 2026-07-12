import { useContext } from 'react'
import { EphemeralWalletContext } from '@/features/voto/crypto/ephemeral-wallet-context-value'

/**
 * Thin React hook exposing only public wallet metadata and lifecycle controls.
 * The private key is never available through this API.
 */
export const useEphemeralWallet = () => {
  const value = useContext(EphemeralWalletContext)
  if (!value) {
    throw new Error(
      'useEphemeralWallet must be used within EphemeralWalletProvider'
    )
  }

  const {
    isSupported,
    isReady,
    publicKeyHex,
    session,
    initialize,
    signVotePayload,
    destroy,
  } = value

  return {
    isSupported,
    isReady,
    publicKeyHex,
    session,
    initialize,
    signVotePayload,
    destroy,
  }
}
