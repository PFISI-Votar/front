import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Search,
  ShieldCheck,
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  VOTAR_LIGHT_SURFACE_CLASS,
  VotarLoginBackground,
} from '@/features/auth/sign-in/components/login-screen-shared'
import {
  verificarInclusionVotoLocal,
  VoteInclusionInvalidHashError,
  VoteInclusionNotFoundError,
  VOTO_NO_ENCONTRADO_MENSAJE,
  type VoteInclusionResult,
} from '@/features/voto/crypto/verificar-voto-inclusion'
import { TX_HASH_REGEX } from '@/features/voto/lib/recibo-canonical'

type VerificadorReciboProps = {
  initialTxHash?: string
}

const normalizeInitialHash = (value: string): string => {
  const trimmed = value.trim()
  return TX_HASH_REGEX.test(trimmed) ? trimmed : ''
}

/**
 * VOTAR-366: public individual vote verifier (E2E).
 * Queries blockchain directly from the client without revealing vote content.
 * UI aligned with BUD public surfaces (VOTAR-424).
 */
export const VerificadorRecibo = ({
  initialTxHash = '',
}: VerificadorReciboProps) => {
  const [txHash, setTxHash] = useState(initialTxHash)
  const [submittedHash, setSubmittedHash] = useState(() =>
    normalizeInitialHash(initialTxHash)
  )
  const [validationError, setValidationError] = useState<string | null>(null)

  const verificarQuery = useQuery({
    queryKey: ['verificar-voto-inclusion', submittedHash],
    queryFn: () => verificarInclusionVotoLocal(submittedHash),
    enabled: Boolean(submittedHash),
    retry: false,
  })

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const cleaned = txHash.trim()
    if (!cleaned) {
      setValidationError('Ingrese el TransactionHash del comprobante.')
      return
    }
    if (!TX_HASH_REGEX.test(cleaned)) {
      setValidationError(
        'El hash debe ser un TransactionHash Ethereum válido (0x + 64 caracteres hex).'
      )
      return
    }
    setValidationError(null)
    setSubmittedHash(cleaned)
  }

  const handleReset = () => {
    setTxHash('')
    setSubmittedHash('')
    setValidationError(null)
  }

  const errorMessage = (() => {
    if (!verificarQuery.error) return null
    if (verificarQuery.error instanceof VoteInclusionNotFoundError) {
      return VOTO_NO_ENCONTRADO_MENSAJE
    }
    if (verificarQuery.error instanceof VoteInclusionInvalidHashError) {
      return verificarQuery.error.message
    }
    if (verificarQuery.error instanceof Error) {
      return verificarQuery.error.message
    }
    return 'Error desconocido al verificar.'
  })()

  return (
    <main
      className={`relative min-h-svh overflow-hidden bg-[#fdfcfa] ${VOTAR_LIGHT_SURFACE_CLASS}`}
    >
      <VotarLoginBackground />
      <div className='relative mx-auto flex min-h-svh w-full max-w-3xl flex-col px-4 py-10 sm:px-6 sm:py-14'>
        <div className='mb-10 flex items-center justify-between gap-4'>
          <p className='text-2xl leading-none font-extrabold tracking-tight text-[#2f6f9f]'>
            VOTAR
          </p>
          <p className='text-xs font-medium tracking-wide text-[#80868b] uppercase'>
            Verificación pública
          </p>
        </div>

        <div className='space-y-6'>
          <header className='space-y-3'>
            <div className='inline-flex items-center gap-1.5 rounded-full border border-[#d0e3f0] bg-[#2f6f9f]/8 px-2.5 py-1 text-[0.7rem] font-semibold tracking-wide text-[#2f6f9f] uppercase'>
              <ShieldCheck className='size-3.5' aria-hidden='true' />
              Acceso público
            </div>
            <h1 className='text-3xl font-extrabold tracking-tight text-[#202124] sm:text-4xl'>
              Verificador de voto individual
            </h1>
            <p className='max-w-2xl text-sm leading-relaxed text-[#5f6368] sm:text-base'>
              Ingrese el hash de su recibo criptográfico para corroborar de
              forma matemática que su sufragio está incluido en la urna
              electrónica, sin revelar el candidato que eligió.
            </p>
          </header>

          <Card className='gap-0 rounded-2xl border-[#e4e7eb] bg-white/95 py-0 shadow-[0_1rem_3rem_rgba(30,64,95,0.08)] backdrop-blur-sm'>
            <CardHeader className='space-y-1.5 px-6 pt-6 pb-0 sm:px-8'>
              <CardTitle className='text-xl font-bold tracking-tight text-[#202124]'>
                Hash del recibo
              </CardTitle>
              <CardDescription className='text-sm leading-relaxed text-[#55575d]'>
                Encontrará este TransactionHash en su comprobante PDF o en la
                pantalla de confirmación de voto.
              </CardDescription>
            </CardHeader>
            <CardContent className='px-6 pt-5 pb-6 sm:px-8 sm:pb-8'>
              <form onSubmit={handleSubmit} className='space-y-4'>
                <div className='space-y-2'>
                  <Label
                    htmlFor='tx-hash-verificacion'
                    className='text-sm font-semibold text-[#4b4f56]'
                  >
                    Hash de transacción
                  </Label>
                  <Input
                    id='tx-hash-verificacion'
                    type='text'
                    placeholder='0x...'
                    value={txHash}
                    onChange={(event) => setTxHash(event.target.value)}
                    className='h-11 rounded-lg border-[#c9cdd2] bg-white font-mono text-sm shadow-none placeholder:text-[#9aa0a6] focus-visible:border-[#2f6f9f] focus-visible:ring-[#2f6f9f]/20'
                    aria-label='Ingrese el TransactionHash de verificación'
                    aria-describedby='tx-hash-help'
                    aria-invalid={Boolean(validationError)}
                    disabled={verificarQuery.isFetching}
                  />
                  <p id='tx-hash-help' className='text-xs text-[#80868b]'>
                    Formato: 0x seguido de 64 caracteres hexadecimales.
                  </p>
                </div>

                {validationError && (
                  <Alert variant='destructive'>
                    <AlertCircle className='size-4' />
                    <AlertTitle>Dato inválido</AlertTitle>
                    <AlertDescription>{validationError}</AlertDescription>
                  </Alert>
                )}

                <div className='flex flex-col gap-3 sm:flex-row'>
                  <Button
                    type='submit'
                    className='h-11 flex-1 rounded-lg bg-[#2f6f9f] text-white hover:bg-[#285f88]'
                    disabled={verificarQuery.isFetching || !txHash.trim()}
                    aria-busy={verificarQuery.isFetching}
                  >
                    {verificarQuery.isFetching ? (
                      <>
                        <Loader2 className='mr-2 size-4 animate-spin' />
                        Verificando...
                      </>
                    ) : (
                      <>
                        <Search className='mr-2 size-4' />
                        Verificar inclusión
                      </>
                    )}
                  </Button>
                  {(verificarQuery.data || verificarQuery.isError) && (
                    <Button
                      type='button'
                      variant='outline'
                      className='h-11 rounded-lg border-[#cfd3d7] bg-white text-[#2f3337] shadow-none hover:bg-slate-50'
                      onClick={handleReset}
                    >
                      Nueva búsqueda
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          {errorMessage && (
            <Alert
              variant='destructive'
              role='alert'
              className='rounded-2xl border-red-200 bg-white/95 shadow-[0_1rem_3rem_rgba(30,64,95,0.08)]'
            >
              <AlertCircle className='size-4' />
              <AlertTitle>Registro no encontrado</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {verificarQuery.data && (
            <ResultadoVerificacion resultado={verificarQuery.data} />
          )}

          <Card className='gap-0 rounded-2xl border-[#e4e7eb] bg-white/95 py-0 shadow-[0_1rem_3rem_rgba(30,64,95,0.08)] backdrop-blur-sm'>
            <CardHeader className='space-y-1 px-6 pt-5 pb-0 sm:px-8'>
              <CardTitle className='text-sm font-semibold tracking-wide text-[#2f6f9f] uppercase'>
                Privacidad garantizada
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-2 px-6 pt-3 pb-5 text-sm leading-relaxed text-[#5f6368] sm:px-8 sm:pb-6'>
              <p>
                La consulta se realiza de forma local contra la blockchain; no
                se revela su voto ni su identidad personal.
              </p>
              <p>
                Solo confirma que el hash de su recibo está incluido en el
                registro de votos.
              </p>
              <p>Cumple con la Ley 25.326 de Protección de Datos Personales.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}

const ResultadoVerificacion = ({
  resultado,
}: {
  resultado: VoteInclusionResult
}) => {
  const formatearFecha = (fecha: string) =>
    new Intl.DateTimeFormat('es-AR', {
      dateStyle: 'full',
      timeStyle: 'long',
    }).format(new Date(fecha))

  return (
    <Card
      className='gap-0 rounded-2xl border-[#b7d7c4] bg-white/95 py-0 shadow-[0_1rem_3rem_rgba(30,64,95,0.08)] backdrop-blur-sm'
      role='status'
    >
      <CardHeader className='space-y-0 px-6 pt-6 pb-0 sm:px-8'>
        <div className='flex items-start gap-3'>
          <div className='rounded-full bg-[#e8f5ee] p-2'>
            <CheckCircle2
              className='size-6 text-[#1f7a4d]'
              aria-hidden='true'
            />
          </div>
          <div>
            <CardTitle className='text-xl font-bold tracking-tight text-[#1b4332]'>
              Inclusión confirmada
            </CardTitle>
            <CardDescription className='mt-1 text-sm leading-relaxed text-[#2d6a4f]'>
              {resultado.mensaje}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className='space-y-6 px-6 pt-5 pb-6 sm:px-8 sm:pb-8'>
        <div className='space-y-3'>
          <h3 className='text-sm font-semibold tracking-wide text-[#2f6f9f] uppercase'>
            Certificación blockchain
          </h3>
          <div className='grid gap-3 text-sm'>
            <div className='space-y-1'>
              <span className='block text-[#5f6368]'>Hash de transacción:</span>
              <code className='block rounded-lg border border-[#e4e7eb] bg-[#f8fafb] px-3 py-2 text-xs break-all text-[#202124]'>
                {resultado.txHash}
              </code>
            </div>
            <div className='flex justify-between gap-4'>
              <span className='text-[#5f6368]'>Bloque:</span>
              <span className='font-mono text-[#202124]'>
                #{resultado.blockNumber}
              </span>
            </div>
            <div className='flex justify-between gap-4'>
              <span className='text-[#5f6368]'>Red:</span>
              <span className='font-semibold text-[#1f7a4d]'>
                {resultado.networkName}
              </span>
            </div>
            <div className='flex justify-between gap-4'>
              <span className='text-[#5f6368]'>ID Elección:</span>
              <span className='font-mono text-[#202124]'>
                #{resultado.idEleccion}
              </span>
            </div>
            <div className='flex justify-between gap-4'>
              <span className='text-[#5f6368]'>Fecha y hora:</span>
              <span className='text-right text-[#202124]'>
                {formatearFecha(resultado.timestamp)}
              </span>
            </div>
          </div>

          {resultado.explorerUrl && (
            <Button
              variant='outline'
              className='h-11 w-full rounded-lg border-[#cfd3d7] bg-white text-[#2f3337] shadow-none hover:bg-slate-50'
              asChild
            >
              <a
                href={resultado.explorerUrl}
                target='_blank'
                rel='noopener noreferrer'
                aria-label='Ver transacción en el explorador de bloques'
              >
                <ExternalLink className='mr-2 size-4' />
                Ver en explorador de bloques
              </a>
            </Button>
          )}
        </div>

        <Alert className='rounded-xl border-[#d0e3f0] bg-[#2f6f9f]/5'>
          <AlertCircle className='size-4 text-[#2f6f9f]' />
          <AlertTitle className='text-sm text-[#202124]'>
            Privacidad del sufragio garantizada
          </AlertTitle>
          <AlertDescription className='text-xs text-[#5f6368]'>
            Esta verificación solo confirma la inclusión del hash en la urna
            electrónica. No revela el contenido del voto ni la identidad del
            votante.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
