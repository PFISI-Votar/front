import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createEphemeralWalletManager } from '@/features/voto/crypto/ephemeral-wallet'
import {
  EphemeralWalletContext,
  type EphemeralWalletContextValue,
} from '@/features/voto/crypto/ephemeral-wallet-context-value'
import type { EphemeralWalletSession } from '@/features/voto/crypto/ephemeral-wallet.types'
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

  const initialize = useCallback(async (idEleccion: number) => {
    const nextSession = await managerRef.current.initialize(idEleccion)
    setSession(nextSession)
    return nextSession
  }, [])

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
      destroy,
    }),
    [destroy, initialize, isSupported, session]
  )

  return (
    <EphemeralWalletContext.Provider value={value}>
      {children}
    </EphemeralWalletContext.Provider>
  )
}
