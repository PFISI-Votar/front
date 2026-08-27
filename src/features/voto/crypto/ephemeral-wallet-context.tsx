import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { Hex } from 'viem'
import { createEphemeralWalletManager } from '@/features/voto/crypto/ephemeral-wallet'
import {
  EphemeralWalletContext,
  type EphemeralWalletContextValue,
} from '@/features/voto/crypto/ephemeral-wallet-context-value'
import type { EphemeralWalletSession } from '@/features/voto/crypto/ephemeral-wallet.types'
import type { SelectionPayload } from '@/features/voto/crypto/selection-hash'
import { isWebCryptoSupported } from '@/features/voto/crypto/web-crypto-support'

type EphemeralWalletProviderProps = {
  children: ReactNode
}

export const EphemeralWalletProvider = ({
  children,
}: EphemeralWalletProviderProps) => {
  const managerRef = useRef(createEphemeralWalletManager())
  const [session, setSession] = useState<EphemeralWalletSession | null>(null)
  const isSupported = isWebCryptoSupported()

  const destroy = useCallback(() => {
    managerRef.current.destroy()
    setSession(null)
  }, [])

  const initialize = useCallback(
    async (idEleccion: number, votanteScope: string) => {
      const nextSession = await managerRef.current.initialize(
        idEleccion,
        votanteScope
      )
      setSession(nextSession)
      return nextSession
    },
    []
  )

  const signVotePayload = useCallback(
    async (
      selection: SelectionPayload,
      nullifier: Hex,
      ballotContractAddress: Hex
    ) => {
      const signed = await managerRef.current.signVotePayload(
        selection,
        nullifier,
        ballotContractAddress
      )
      // VOTAR-418: manager.destroy() cleared the key; sync React state.
      setSession(managerRef.current.getSession())
      return signed
    },
    []
  )

  useEffect(() => {
    const manager = managerRef.current
    const handlePageExit = () => {
      manager.destroy()
    }

    window.addEventListener('pagehide', handlePageExit)
    window.addEventListener('beforeunload', handlePageExit)

    return () => {
      window.removeEventListener('pagehide', handlePageExit)
      window.removeEventListener('beforeunload', handlePageExit)
      manager.destroy()
    }
  }, [])

  const value = useMemo<EphemeralWalletContextValue>(
    () => ({
      isSupported,
      isReady: Boolean(session),
      publicKeyHex: session?.publicKeyHex ?? null,
      session,
      initialize,
      signVotePayload,
      destroy,
    }),
    [destroy, initialize, isSupported, session, signVotePayload]
  )

  return (
    <EphemeralWalletContext.Provider value={value}>
      {children}
    </EphemeralWalletContext.Provider>
  )
}
