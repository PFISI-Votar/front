import { useCallback, useEffect, useState } from 'react'
import { AxiosError } from 'axios'
import { useQuery } from '@tanstack/react-query'
import { AlertCircle } from 'lucide-react'
import budFingerprint from '@/assets/bud-fingerprint.png'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  METODOS_AUTENTICACION,
  type MetodoAutenticacion,
} from '@/features/eleccion/configuracion-comicio/data/constants'
import type { TipoVotacion } from '@/features/eleccion/lista/data/schema'
import {
  obtenerBoletaDigital,
  obtenerConfiguracionBud,
} from '@/features/voto/api/voto-api'
import { BudLoginScreen } from '@/features/voto/components/bud-login-screen'
import { BudVotingWizard } from '@/features/voto/components/bud-voting-wizard'
import { CryptoUnsupportedScreen } from '@/features/voto/crypto/components/crypto-unsupported-screen'
import { EphemeralWalletProvider } from '@/features/voto/crypto/ephemeral-wallet-context'
import { useEphemeralWallet } from '@/features/voto/crypto/use-ephemeral-wallet'
import { isWebCryptoSupported } from '@/features/voto/crypto/web-crypto-support'
import {
  clearVotanteSession,
  ensureVotanteSession,
} from '@/features/voto/services/votante-session'
import type { VotanteAuthUser } from '@/features/voto/types/votante-auth.types'

type BoletaUnicaDigitalPageProps = {
  idEleccion: number
  showIntro?: boolean
}

const WALLET_INIT_ERROR =
  'No pudimos generar tu identidad criptográfica efímera. Reintentá iniciar sesión.'

export const BoletaUnicaDigitalPage = (props: BoletaUnicaDigitalPageProps) => {
  if (!isWebCryptoSupported()) {
    return <CryptoUnsupportedScreen />
  }

  return (
    <EphemeralWalletProvider>
      <BoletaUnicaDigitalPageContent {...props} />
    </EphemeralWalletProvider>
  )
}

const BoletaUnicaDigitalPageContent = ({
  idEleccion,
  showIntro = true,
}: BoletaUnicaDigitalPageProps) => {
  const {
    initialize: initializeWallet,
    destroy: destroyWallet,
    isReady,
  } = useEphemeralWallet()
  const [introVisible, setIntroVisible] = useState(() => showIntro)
  const [votanteSession, setVotanteSession] = useState<VotanteAuthUser | null>(
    null
  )
  const [sessionBootstrapComplete, setSessionBootstrapComplete] =
    useState(false)
  const [isWalletBootstrapping, setIsWalletBootstrapping] = useState(false)
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState<
    string | null
  >(null)
  const [walletError, setWalletError] = useState<string | null>(null)

  const boletaQuery = useQuery({
    queryKey: ['boleta-digital', idEleccion],
    queryFn: () => obtenerBoletaDigital(idEleccion),
    retry: false,
    enabled:
      Boolean(votanteSession) && !introVisible && sessionBootstrapComplete,
  })
  const budConfigQuery = useQuery({
    queryKey: ['bud-config', idEleccion],
    queryFn: () => obtenerConfiguracionBud(idEleccion),
    retry: false,
    enabled: !introVisible,
  })

  useEffect(() => {
    if (!introVisible) {
      return
    }

    const timeout = window.setTimeout(() => setIntroVisible(false), 1300)
    return () => window.clearTimeout(timeout)
  }, [introVisible])

  const handleSessionExpired = useCallback(async () => {
    destroyWallet()
    await clearVotanteSession()
    setVotanteSession(null)
    setSessionExpiredMessage(
      'Tu sesión expiró. Volvé a iniciar sesión para continuar.'
    )
  }, [destroyWallet])

  const prepareEphemeralWallet = useCallback(async (): Promise<boolean> => {
    try {
      await initializeWallet(idEleccion)
      setWalletError(null)
      return true
    } catch {
      destroyWallet()
      setWalletError(WALLET_INIT_ERROR)
      return false
    }
  }, [destroyWallet, idEleccion, initializeWallet])

  useEffect(() => {
    if (introVisible || sessionBootstrapComplete) {
      return
    }

    let cancelled = false
    void ensureVotanteSession(idEleccion)
      .then(async (user) => {
        if (cancelled) {
          return
        }
        if (!user) {
          setVotanteSession(null)
          return
        }
        const isWalletReady = await prepareEphemeralWallet()
        if (cancelled) {
          return
        }
        if (!isWalletReady) {
          await clearVotanteSession()
          setVotanteSession(null)
          return
        }
        setVotanteSession(user)
      })
      .finally(() => {
        if (!cancelled) {
          setSessionBootstrapComplete(true)
        }
      })

    return () => {
      cancelled = true
    }
  }, [
    idEleccion,
    introVisible,
    prepareEphemeralWallet,
    sessionBootstrapComplete,
  ])

  useEffect(() => {
    if (!boletaQuery.isError || !(boletaQuery.error instanceof AxiosError)) {
      return
    }
    if (boletaQuery.error.response?.status !== 401) {
      return
    }
    const timeoutId = window.setTimeout(() => {
      void handleSessionExpired()
    }, 0)
    return () => window.clearTimeout(timeoutId)
  }, [boletaQuery.isError, boletaQuery.error, handleSessionExpired])

  const boleta = boletaQuery.data

  if (introVisible) {
    return <BoletaIntroSplash />
  }

  if (!sessionBootstrapComplete || isWalletBootstrapping) {
    return <BoletaIntroSplash />
  }

  if (!votanteSession) {
    const estadoComicio = budConfigQuery.data?.estado
    if (estadoComicio === 'CERRADA' || estadoComicio === 'ESCRUTADA') {
      return (
        <main className='grid min-h-svh place-items-center bg-[#fdfcfa] px-6'>
          <Alert className='max-w-xl border-slate-300 bg-white'>
            <AlertCircle className='size-4' aria-hidden='true' />
            <AlertTitle>El período de votación ha concluido</AlertTitle>
            <AlertDescription>
              Este comicio está cerrado. La Boleta Única Digital ya no admite
              nuevos sufragios. Podés consultar el Dashboard Público para ver
              los resultados definitivos.
            </AlertDescription>
          </Alert>
        </main>
      )
    }

    const metodosAutenticacion = (budConfigQuery.data?.metodosAutenticacion ??
      []) as MetodoAutenticacion[]
    const authMethod =
      metodosAutenticacion.includes(METODOS_AUTENTICACION.GOOGLE) &&
      !metodosAutenticacion.includes(METODOS_AUTENTICACION.SSO_INSTITUCIONAL)
        ? METODOS_AUTENTICACION.GOOGLE
        : METODOS_AUTENTICACION.SSO_INSTITUCIONAL

    return (
      <>
        {sessionExpiredMessage ? (
          <div className='pointer-events-none fixed inset-x-0 top-4 z-50 mx-auto w-full max-w-md px-4'>
            <Alert variant='destructive'>
              <AlertTitle>Sesión expirada</AlertTitle>
              <AlertDescription>{sessionExpiredMessage}</AlertDescription>
            </Alert>
          </div>
        ) : null}
        {walletError ? (
          <div className='pointer-events-none fixed inset-x-0 top-4 z-50 mx-auto w-full max-w-md px-4'>
            <Alert variant='destructive'>
              <AlertTitle>Error de seguridad</AlertTitle>
              <AlertDescription>{walletError}</AlertDescription>
            </Alert>
          </div>
        ) : null}
        <BudLoginScreen
          idEleccion={idEleccion}
          authMethod={authMethod}
          onAuthenticated={(user) => {
            void (async () => {
              setIsWalletBootstrapping(true)
              setSessionExpiredMessage(null)
              const isWalletReady = await prepareEphemeralWallet()
              setIsWalletBootstrapping(false)
              if (!isWalletReady) {
                await clearVotanteSession()
                return
              }
              setVotanteSession(user)
            })()
          }}
        />
      </>
    )
  }

  // Do not gate on `isReady`: after a successful local signature the ephemeral
  // wallet is zeroized (VOTAR-418), so isReady becomes false while the wizard
  // must stay mounted to show transmit progress and the vote receipt (VOTAR-379).
  if (boletaQuery.isLoading || budConfigQuery.isLoading) {
    return <BoletaIntroSplash />
  }

  if (
    boletaQuery.isError ||
    budConfigQuery.isError ||
    !boleta ||
    !budConfigQuery.data
  ) {
    const status =
      boletaQuery.error instanceof AxiosError
        ? boletaQuery.error.response?.status
        : undefined
    if (status === 410) {
      return (
        <main className='grid min-h-svh place-items-center bg-[#fdfcfa] px-6'>
          <Alert className='max-w-xl border-slate-300 bg-white'>
            <AlertCircle className='size-4' aria-hidden='true' />
            <AlertTitle>El período de votación ha concluido</AlertTitle>
            <AlertDescription>
              El comicio fue cerrado y ya no admite nuevos sufragios (HTTP 410).
            </AlertDescription>
          </Alert>
        </main>
      )
    }

    return (
      <main className='grid min-h-svh place-items-center bg-[#fdfcfa] px-6'>
        <Alert variant='destructive' className='max-w-xl'>
          <AlertCircle className='size-4' aria-hidden='true' />
          <AlertTitle>No se pudo preparar la votación</AlertTitle>
          <AlertDescription>
            No pudimos obtener la configuración del comicio. Reintentá en unos
            segundos.
          </AlertDescription>
        </Alert>
      </main>
    )
  }

  if (
    budConfigQuery.data.estado === 'CERRADA' ||
    budConfigQuery.data.estado === 'ESCRUTADA'
  ) {
    return (
      <main className='grid min-h-svh place-items-center bg-[#fdfcfa] px-6'>
        <Alert className='max-w-xl border-slate-300 bg-white'>
          <AlertCircle className='size-4' aria-hidden='true' />
          <AlertTitle>El período de votación ha concluido</AlertTitle>
          <AlertDescription>
            La Boleta Única Digital está deshabilitada de forma permanente para
            este comicio.
          </AlertDescription>
        </Alert>
      </main>
    )
  }

  return (
    <BudVotingWizard
      boleta={boleta}
      tipoVotacion={budConfigQuery.data.tipoVotacion as TipoVotacion}
      cryptoReady={isReady}
      onLogout={() => {
        destroyWallet()
        void clearVotanteSession().finally(() => {
          setVotanteSession(null)
          setSessionBootstrapComplete(true)
        })
      }}
    />
  )
}

const BoletaIntroSplash = () => (
  <main className='votar-light-surface relative grid min-h-svh place-items-center overflow-hidden bg-[#fdfcfa]'>
    <img
      src={budFingerprint}
      alt=''
      aria-hidden='true'
      className='pointer-events-none absolute top-1/2 left-1/2 w-[min(70vw,28rem)] -translate-x-1/2 -translate-y-1/2 opacity-[0.08]'
    />
    <div className='relative text-center'>
      <p className='text-5xl font-extrabold tracking-tight text-[#2f6f9f]'>
        VOTAR
      </p>
      <p className='mt-3 text-sm text-slate-600'>Preparando tu boleta…</p>
    </div>
  </main>
)
