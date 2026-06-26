import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { AxiosError } from 'axios'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Download,
  LockKeyhole,
  Loader2,
  RotateCcw,
  Share2,
} from 'lucide-react'
import budFingerprint from '@/assets/bud-fingerprint.png'
import { getApiErrorMessage } from '@/lib/api-client'
import { resolveMediaUrl } from '@/lib/media-url'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  METODOS_AUTENTICACION,
  type MetodoAutenticacion,
} from '@/features/eleccion/configuracion-comicio/data/constants'
import type { TipoVotacion } from '@/features/eleccion/lista/data/schema'
import {
  confirmarVoto,
  obtenerBoletaDigital,
  obtenerConfiguracionBud,
} from '@/features/voto/api/voto-api'
import {
  clearVotanteSession,
  ensureVotanteSession,
} from '@/features/voto/services/votante-session'
import type { VotanteAuthUser } from '@/features/voto/types/votante-auth.types'
import {
  BudBottomNav,
  BudLoginScreen,
  BudTopBar,
} from '@/features/voto/components/bud-login-screen'
import { BudVotingWizard } from '@/features/voto/components/bud-voting-wizard'
import { CategoriaSection } from '@/features/voto/components/categoria-section'
import { VotoConfirmDialog } from '@/features/voto/components/voto-confirm-dialog'
import type {
  CandidatoBoletaDigital,
  ConfirmarVotoResponse,
  SeleccionesPorCategoria,
} from '@/features/voto/data/schema'
import {
  buildConfirmarVotoInput,
  generarIdempotencyKey,
  getCategoriasSinCandidatos,
  getCategoriasSinSeleccion,
  getTotalCandidatos,
  seleccionarCandidato,
} from '@/features/voto/utils/seleccion-voto'

type BoletaUnicaDigitalPageProps = {
  idEleccion: number
  showIntro?: boolean
  showLogin?: boolean
}

const getHttpErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    const status = error.response?.status
    if (status === 400 || status === 422) {
      return getApiErrorMessage(error)
    }
    if (status === 401) {
      return 'Tu sesión expiró. Volvé a iniciar sesión para continuar.'
    }
    if (status === 403) {
      return 'No estás habilitado para votar en este comicio o la boleta no está disponible.'
    }
    if (status === 404) {
      return 'No se encontró la boleta digital solicitada.'
    }
    if (status === 409) {
      return 'El voto ya fue confirmado o hubo un conflicto de idempotencia.'
    }
    if (status === 429) {
      return 'Demasiados intentos de confirmación. Esperá un minuto y volvé a intentar.'
    }
  }
  return 'No pudimos comunicarnos con el servidor. Reintentá sin perder tu selección.'
}

const getListImageUrl = (candidato: CandidatoBoletaDigital) =>
  candidato.imagenListaUrl ??
  candidato.logoListaUrl ??
  candidato.fotoListaUrl ??
  null

export const BoletaUnicaDigitalPage = ({
  idEleccion,
  showIntro = true,
  showLogin = true,
}: BoletaUnicaDigitalPageProps) => {
  const [introVisible, setIntroVisible] = useState(() => showIntro)
  const [votanteSession, setVotanteSession] = useState<VotanteAuthUser | null>(
    showLogin ? null : {
      sub: 'test-session',
      role: 'voter',
      idEleccion,
    }
  )
  const [sessionBootstrapComplete, setSessionBootstrapComplete] = useState(
    () => !showLogin
  )
  const [sessionExpiredMessage, setSessionExpiredMessage] = useState<
    string | null
  >(null)
  const [selecciones, setSelecciones] = useState<SeleccionesPorCategoria>({})
  const [votoEnBlanco, setVotoEnBlanco] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [idempotencyKey, setIdempotencyKey] = useState(generarIdempotencyKey)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [comprobante, setComprobante] = useState<ConfirmarVotoResponse | null>(
    null
  )

  const boletaQuery = useQuery({
    queryKey: ['boleta-digital', idEleccion],
    queryFn: () => obtenerBoletaDigital(idEleccion),
    retry: false,
    enabled: Boolean(votanteSession) && !introVisible && sessionBootstrapComplete,
  })
  const budConfigQuery = useQuery({
    queryKey: ['bud-config', idEleccion],
    queryFn: () => obtenerConfiguracionBud(idEleccion),
    retry: false,
    enabled: showLogin && !introVisible,
  })

  useEffect(() => {
    if (!introVisible) {
      return
    }

    const timeout = window.setTimeout(() => setIntroVisible(false), 1300)
    return () => window.clearTimeout(timeout)
  }, [introVisible])

  const handleSessionExpired = async () => {
    await clearVotanteSession()
    setVotanteSession(null)
    setSessionExpiredMessage(
      'Tu sesión expiró. Volvé a iniciar sesión para continuar.'
    )
  }

  useEffect(() => {
    if (introVisible || !showLogin || sessionBootstrapComplete) {
      return
    }

    let cancelled = false
    void ensureVotanteSession(idEleccion).then((user) => {
      if (cancelled) {
        return
      }
      setVotanteSession(user)
      setSessionBootstrapComplete(true)
    })

    return () => {
      cancelled = true
    }
  }, [idEleccion, introVisible, showLogin, sessionBootstrapComplete])

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
  }, [boletaQuery.isError, boletaQuery.error])

  const confirmarMutation = useMutation({
    mutationFn: () =>
      confirmarVoto(
        idEleccion,
        votoEnBlanco
          ? { idempotencyKey, selecciones: [], votoEnBlanco: true }
          : buildConfirmarVotoInput(selecciones, idempotencyKey)
      ),
    onSuccess: (data) => {
      setComprobante(data)
      setSubmitError(null)
      setDialogOpen(false)
    },
    onError: (error) => {
      if (error instanceof AxiosError && error.response?.status === 401) {
        void handleSessionExpired()
        return
      }
      setSubmitError(getHttpErrorMessage(error))
    },
  })

  const boleta = boletaQuery.data
  const candidatosSeleccionados = useMemo<CandidatoBoletaDigital[]>(() => {
    if (!boleta || votoEnBlanco) {
      return []
    }

    return boleta.categorias
      .map((categoria) =>
        categoria.candidatos.find(
          (candidato) =>
            candidato.idCandidato === selecciones[categoria.idCategoria]
        )
      )
      .filter((candidato): candidato is CandidatoBoletaDigital =>
        Boolean(candidato)
      )
  }, [boleta, selecciones, votoEnBlanco])
  const categoriasSinSeleccion = useMemo(
    () => (boleta ? getCategoriasSinSeleccion(boleta, selecciones) : []),
    [boleta, selecciones]
  )
  const categoriasSinCandidatos = useMemo(
    () => (boleta ? getCategoriasSinCandidatos(boleta) : []),
    [boleta]
  )
  const totalCandidatos = boleta ? getTotalCandidatos(boleta.categorias) : 0
  const accentColor = votoEnBlanco
    ? '#0284c7'
    : candidatosSeleccionados[0]?.colorLista || '#0284c7'
  const puedeConfirmar =
    Boolean(boleta) &&
    !comprobante &&
    (votoEnBlanco
      ? boleta?.permitirVotoEnBlanco
      : categoriasSinSeleccion.length === 0 &&
        categoriasSinCandidatos.length === 0)

  const resetIntento = () => {
    setComprobante(null)
    setSubmitError(null)
    setIdempotencyKey(generarIdempotencyKey())
  }

  const handleSelect = (idCategoria: number, idCandidato: number) => {
    setVotoEnBlanco(false)
    setSelecciones((current) =>
      seleccionarCandidato(current, idCategoria, idCandidato)
    )
    resetIntento()
  }

  const handleVotoEnBlanco = () => {
    setSelecciones({})
    setVotoEnBlanco(true)
    resetIntento()
  }

  if (introVisible) {
    return <BoletaIntroSplash />
  }

  if (showLogin && !sessionBootstrapComplete) {
    return <BoletaIntroSplash />
  }

  if (showLogin && !votanteSession) {
    const metodosAutenticacion =
      (budConfigQuery.data?.metodosAutenticacion ?? []) as MetodoAutenticacion[]
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
        <BudLoginScreen
          idEleccion={idEleccion}
          authMethod={authMethod}
          onAuthenticated={(user) => {
            setSessionExpiredMessage(null)
            setVotanteSession(user)
          }}
        />
      </>
    )
  }

  if (showLogin && votanteSession) {
    if (boletaQuery.isLoading || budConfigQuery.isLoading) {
      return <BoletaIntroSplash />
    }

    if (
      boletaQuery.isError ||
      budConfigQuery.isError ||
      !boleta ||
      !budConfigQuery.data
    ) {
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

    return (
      <BudVotingWizard
        boleta={boleta}
        tipoVotacion={budConfigQuery.data.tipoVotacion as TipoVotacion}
        onLogout={() => {
          void clearVotanteSession().finally(() => {
            setVotanteSession(null)
            setSessionBootstrapComplete(true)
          })
        }}
      />
    )
  }

  if (boletaQuery.isLoading) {
    return (
      <BoletaPageShell accentColor={accentColor}>
        <BoletaSkeleton />
      </BoletaPageShell>
    )
  }

  if (boletaQuery.isError || !boleta) {
    return (
      <BoletaPageShell accentColor={accentColor}>
        <Alert variant='destructive' role='alert'>
          <AlertCircle className='size-4' aria-hidden='true' />
          <AlertTitle>No se pudo cargar la boleta digital</AlertTitle>
          <AlertDescription className='flex flex-col gap-3'>
            <span>{getHttpErrorMessage(boletaQuery.error)}</span>
            <Button
              variant='outline'
              className='w-fit'
              onClick={() => boletaQuery.refetch()}
            >
              <RotateCcw className='me-2 size-4' aria-hidden='true' />
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      </BoletaPageShell>
    )
  }

  if (comprobante) {
    return (
      <BoletaSuccessScreen
        comprobante={comprobante}
        boletaNombre={boleta.nombreEleccion}
        selecciones={candidatosSeleccionados}
        votoEnBlanco={votoEnBlanco}
        accentColor={accentColor}
      />
    )
  }

  return (
    <BoletaPageShell accentColor={accentColor}>
      <BudTopBar />
      <section className='mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-6 pb-24 sm:max-w-3xl lg:max-w-5xl'>
        <div className='flex items-center justify-between gap-3'>
          <div>
            <p className='text-xs font-semibold tracking-[0.24em] text-sky-700 uppercase'>
              Boleta Única Digital
            </p>
            <h1 className='text-2xl font-bold'>{boleta.nombreEleccion}</h1>
          </div>
          <div className='rounded-full bg-white/80 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm'>
            {boleta.categorias.length} cargos · {totalCandidatos} candidatos
          </div>
        </div>

        {submitError && (
          <Alert variant='destructive' role='alert'>
            <AlertCircle className='size-4' aria-hidden='true' />
            <AlertTitle>No se pudo confirmar el voto</AlertTitle>
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}

        <div className='flex flex-col gap-4'>
          {boleta.categorias.map((categoria, index) => (
            <CategoriaSection
              key={categoria.idCategoria}
              categoria={categoria}
              nombreEleccion={boleta.nombreEleccion}
              step={index + 1}
              totalSteps={boleta.categorias.length}
              selectedCandidatoId={selecciones[categoria.idCategoria]}
              disabled={votoEnBlanco || Boolean(comprobante)}
              onSelect={handleSelect}
              votoEnBlanco={votoEnBlanco}
              permitirVotoEnBlanco={boleta.permitirVotoEnBlanco}
              onVotoEnBlanco={handleVotoEnBlanco}
            />
          ))}
        </div>

        <Card className='border-red-200 bg-red-50 text-red-950 shadow-sm'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-xl'>
              <LockKeyhole className='size-5' />
              Advertencia de Inmutabilidad
            </CardTitle>
            <CardDescription className='text-red-900'>
              Una vez confirmada, su boleta será encriptada y registrada
              permanentemente en la red blockchain. Esta acción no podrá ser
              modificada.
            </CardDescription>
          </CardHeader>
        </Card>

        {categoriasSinCandidatos.length > 0 && !votoEnBlanco && (
          <Alert variant='destructive'>
            <AlertCircle className='size-4' aria-hidden='true' />
            <AlertTitle>Boleta incompleta</AlertTitle>
            <AlertDescription>
              Hay categorías sin candidatos oficializados.
            </AlertDescription>
          </Alert>
        )}

        {!votoEnBlanco && categoriasSinSeleccion.length > 0 && (
          <p className='text-center text-sm text-slate-600' aria-live='polite'>
            Faltan {categoriasSinSeleccion.length} categoría
            {categoriasSinSeleccion.length === 1 ? '' : 's'} por seleccionar.
          </p>
        )}

        <Button
          size='lg'
          className='h-14 rounded-xl text-lg font-bold shadow-lg shadow-sky-300/50'
          disabled={!puedeConfirmar || confirmarMutation.isPending}
          onClick={() => setDialogOpen(true)}
        >
          {confirmarMutation.isPending ? (
            <Loader2 className='me-2 size-5 animate-spin' aria-hidden='true' />
          ) : (
            <LockKeyhole className='me-2 size-5' aria-hidden='true' />
          )}
          Confirmar y Encriptar Voto
        </Button>
        <Button
          type='button'
          variant='outline'
          size='lg'
          className='h-12 rounded-xl'
        >
          Regresar al Inicio
          <ArrowRight className='ms-2 size-4 rotate-180' />
        </Button>

        <p className='text-center text-xs leading-relaxed text-slate-500'>
          Este recibo no contiene su identidad real ni el sentido de su voto en
          texto plano, garantizando el secreto del sufragio mediante pruebas de
          conocimiento cero.
        </p>
      </section>

      <BudBottomNav active='boleta' />

      <VotoConfirmDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        boleta={boleta}
        selecciones={selecciones}
        votoEnBlanco={votoEnBlanco}
        isPending={confirmarMutation.isPending}
        onConfirm={() => confirmarMutation.mutate()}
      />
    </BoletaPageShell>
  )
}

const BoletaPageShell = ({
  children,
  accentColor,
}: {
  children: ReactNode
  accentColor: string
}) => (
  <main
    className='min-h-svh text-slate-950'
    style={
      {
        '--bud-accent': accentColor,
        background:
          `radial-gradient(circle at 50% 0%, ${accentColor}22, transparent 20rem), ` +
          'linear-gradient(180deg, #f8fcff 0%, #eef7fb 100%)',
      } as CSSProperties
    }
  >
    {children}
  </main>
)

const BoletaSuccessScreen = ({
  comprobante,
  boletaNombre,
  selecciones,
  votoEnBlanco,
  accentColor,
}: {
  comprobante: ConfirmarVotoResponse
  boletaNombre: string
  selecciones: CandidatoBoletaDigital[]
  votoEnBlanco: boolean
  accentColor: string
}) => (
  <BoletaPageShell accentColor={accentColor}>
    <BudTopBar />
    <section className='mx-auto flex w-full max-w-md flex-col gap-5 px-4 py-6 pb-24 text-center'>
      <div className='mx-auto grid size-28 place-items-center rounded-full bg-sky-100 ring-[18px] ring-sky-100/50'>
        <div className='grid size-16 place-items-center rounded-full bg-sky-500 text-white'>
          <CheckCircle2 className='size-9' />
        </div>
      </div>

      <div className='space-y-2'>
        <p className='sr-only'>Voto confirmado</p>
        <h1 className='text-2xl font-bold text-sky-900'>
          Voto Registrado con Éxito
        </h1>
        <p className='text-sm leading-relaxed text-slate-600'>
          Su participación democrática ha sido cifrada y transmitida de forma
          inmutable a la red blockchain electoral.
        </p>
      </div>

      <Card className='bg-white/95 text-left shadow-sm'>
        <CardHeader>
          <CardTitle className='text-xs tracking-[0.18em] text-slate-500 uppercase'>
            Hash de transacción (SHA-256)
          </CardTitle>
        </CardHeader>
        <CardContent className='grid gap-3'>
          <code className='block rounded-lg bg-slate-50 p-4 text-xs break-all text-slate-600'>
            {comprobante.comprobanteHash}
          </code>
          <Button type='button' variant='ghost' className='justify-end'>
            Copiar Hash
          </Button>
        </CardContent>
      </Card>

      <Card className='bg-white/95 shadow-sm'>
        <CardContent className='grid gap-3 p-6'>
          <div className='mx-auto grid size-28 place-items-center rounded-md bg-[linear-gradient(135deg,#0f172a_25%,#fff_25%,#fff_50%,#0f172a_50%,#0f172a_75%,#fff_75%)] bg-[length:18px_18px] shadow-inner' />
          <p className='text-sm text-slate-600'>
            Escanee para verificar integridad externa
          </p>
        </CardContent>
      </Card>

      <Card className='bg-white/95 text-left shadow-sm'>
        <CardContent className='grid gap-3 p-5 text-sm'>
          <ReceiptRow
            label='Emitido el'
            value={formatReceiptDate(comprobante.recibidoEn)}
          />
          <ReceiptRow
            label='Hora local'
            value={formatReceiptTime(comprobante.recibidoEn)}
          />
          <ReceiptRow label='Nodo electoral' value='MX-CENTRAL-04' />
          <p className='pt-2 text-xs font-medium text-sky-800'>
            ✓ Blockchain: sincronizado
          </p>
        </CardContent>
      </Card>

      <Card className='overflow-hidden bg-white/95 text-left shadow-sm'>
        <CardHeader className='bg-slate-100 py-3'>
          <CardTitle className='text-xs tracking-[0.18em] text-slate-500 uppercase'>
            Resumen de selección
          </CardTitle>
        </CardHeader>
        <CardContent className='grid gap-3 p-5'>
          {votoEnBlanco ? (
            <p className='font-semibold'>Voto en blanco confirmado</p>
          ) : (
            selecciones.map((candidato) => (
              <div
                key={`${candidato.idCategoria}-${candidato.idCandidato}`}
                className='flex items-center gap-3'
              >
                {candidato.fotoUrl ? (
                  <img
                    src={resolveMediaUrl(candidato.fotoUrl)}
                    alt={`Foto de ${candidato.nombreCompleto}`}
                    className='size-12 rounded-xl border bg-muted object-cover'
                  />
                ) : (
                  <span
                    className='size-12 rounded-xl border bg-muted'
                    style={{
                      backgroundColor: `${candidato.colorLista ?? accentColor}22`,
                    }}
                    aria-hidden='true'
                  />
                )}
                {getListImageUrl(candidato) ? (
                  <img
                    src={resolveMediaUrl(getListImageUrl(candidato))}
                    alt={`Logo de ${candidato.agrupacionPolitica}`}
                    className='h-12 w-20 rounded-xl border bg-muted object-cover'
                  />
                ) : (
                  <span
                    className='h-12 w-20 rounded-xl border bg-muted'
                    style={{
                      backgroundColor: candidato.colorLista ?? accentColor,
                    }}
                    aria-hidden='true'
                  />
                )}
                <div>
                  <p className='text-xs text-slate-500 uppercase'>
                    {candidato.agrupacionPolitica}
                  </p>
                  <p className='font-semibold'>{candidato.nombreCompleto}</p>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Button className='h-12 rounded-xl font-semibold'>
        <Download className='me-2 size-4' />
        Descargar Comprobante PDF
      </Button>
      <Button variant='outline' className='h-12 rounded-xl font-semibold'>
        <Share2 className='me-2 size-4' />
        Compartir Hash de Verificación
      </Button>

      <p className='text-xs leading-relaxed text-slate-500'>
        Comicio: {boletaNombre}. Este recibo no contiene su identidad real ni el
        sentido de su voto en texto plano.
      </p>
    </section>
    <BudBottomNav active='verificar' />
  </BoletaPageShell>
)

const ReceiptRow = ({ label, value }: { label: string; value: string }) => (
  <div className='flex items-center justify-between gap-3'>
    <span className='text-xs tracking-[0.16em] text-slate-500 uppercase'>
      {label}
    </span>
    <span className='font-semibold'>{value}</span>
  </div>
)

const formatReceiptDate = (value: string) =>
  new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))

const formatReceiptTime = (value: string) =>
  new Intl.DateTimeFormat('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  }).format(new Date(value))

const BoletaIntroSplash = () => (
  <main
    className='grid min-h-svh place-items-center overflow-hidden bg-[#fdfcfa] px-6 text-foreground'
    aria-label='Cargando Boleta Única Digital'
  >
    <div className='flex flex-col items-center gap-4 text-center'>
      <img
        src={budFingerprint}
        alt=''
        aria-hidden='true'
        className='animate-bud-squash size-28 object-contain sm:size-36'
      />
      <div className='space-y-1'>
        <p className='text-sm font-medium tracking-[0.24em] text-[#2f6f9f] uppercase'>
          Preparando la votación...
        </p>
      </div>
    </div>
  </main>
)

const BoletaSkeleton = () => (
  <div className='flex flex-col gap-6' aria-busy='true' aria-live='polite'>
    <p className='text-sm text-muted-foreground'>Cargando boleta digital…</p>
    <Skeleton className='h-36 rounded-3xl' />
    <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className='h-44 rounded-xl' />
      ))}
    </div>
  </div>
)
