import { useEffect, useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Search,
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

/**
 * VOTAR-366: public individual vote verifier (E2E).
 * Queries blockchain directly from the client without revealing vote content.
 */
export const VerificadorRecibo = ({
  initialTxHash = '',
}: VerificadorReciboProps) => {
  const [txHash, setTxHash] = useState(initialTxHash)
  const [validationError, setValidationError] = useState<string | null>(null)
  const autoVerifyStarted = useRef(false)

  const verificarMutation = useMutation({
    mutationFn: (hash: string) => verificarInclusionVotoLocal(hash),
  })
  const { mutate: verificar } = verificarMutation

  useEffect(() => {
    const trimmed = initialTxHash.trim()
    if (!trimmed || autoVerifyStarted.current) return
    if (!TX_HASH_REGEX.test(trimmed)) return
    autoVerifyStarted.current = true
    verificar(trimmed)
  }, [initialTxHash, verificar])

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
    verificarMutation.mutate(cleaned)
  }

  const handleReset = () => {
    setTxHash('')
    setValidationError(null)
    verificarMutation.reset()
  }

  const errorMessage = (() => {
    if (!verificarMutation.error) return null
    if (verificarMutation.error instanceof VoteInclusionNotFoundError) {
      return VOTO_NO_ENCONTRADO_MENSAJE
    }
    if (verificarMutation.error instanceof VoteInclusionInvalidHashError) {
      return verificarMutation.error.message
    }
    if (verificarMutation.error instanceof Error) {
      return verificarMutation.error.message
    }
    return 'Error desconocido al verificar.'
  })()

  return (
    <main className='container mx-auto min-h-screen max-w-3xl px-4 py-12'>
      <div className='space-y-8'>
        <div className='space-y-3 text-center'>
          <h1 className='text-4xl font-bold text-slate-900'>
            Verificador de voto individual
          </h1>
          <p className='mx-auto max-w-2xl text-lg text-slate-600'>
            Ingrese el hash de su recibo criptográfico para corroborar de forma
            matemática que su sufragio está incluido en la urna electrónica, sin
            revelar el candidato que eligió.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Hash del recibo</CardTitle>
            <CardDescription>
              Encontrará este TransactionHash en su comprobante PDF o en la
              pantalla de confirmación de voto.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='tx-hash-verificacion'>
                  Hash de transacción
                </Label>
                <Input
                  id='tx-hash-verificacion'
                  type='text'
                  placeholder='0x...'
                  value={txHash}
                  onChange={(event) => setTxHash(event.target.value)}
                  className='font-mono text-sm'
                  aria-label='Ingrese el TransactionHash de verificación'
                  aria-describedby='tx-hash-help'
                  aria-invalid={Boolean(validationError)}
                  disabled={verificarMutation.isPending}
                />
                <p id='tx-hash-help' className='text-xs text-slate-500'>
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

              <div className='flex gap-3'>
                <Button
                  type='submit'
                  className='flex-1'
                  disabled={verificarMutation.isPending || !txHash.trim()}
                  aria-busy={verificarMutation.isPending}
                >
                  {verificarMutation.isPending ? (
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
                {(verificarMutation.data || verificarMutation.isError) && (
                  <Button type='button' variant='outline' onClick={handleReset}>
                    Nueva búsqueda
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {errorMessage && (
          <Alert variant='destructive' role='alert'>
            <AlertCircle className='size-4' />
            <AlertTitle>Registro no encontrado</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {verificarMutation.data && (
          <ResultadoVerificacion resultado={verificarMutation.data} />
        )}

        <Card className='bg-slate-50'>
          <CardHeader>
            <CardTitle className='text-sm font-medium'>
              Privacidad garantizada
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-2 text-sm text-slate-600'>
            <p>
              La consulta se realiza de forma local contra la blockchain; no se
              revela su voto ni su identidad personal.
            </p>
            <p>
              Solo confirma que el hash de su recibo está incluido en el
              registro de votos.
            </p>
            <p>Cumple con la Ley 25.326 de Protección de Datos Personales.</p>
          </CardContent>
        </Card>
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
    <Card className='border-green-200 bg-green-50/50' role='status'>
      <CardHeader>
        <div className='flex items-start gap-3'>
          <div className='rounded-full bg-green-100 p-2'>
            <CheckCircle2
              className='size-6 text-green-600'
              aria-hidden='true'
            />
          </div>
          <div>
            <CardTitle className='text-green-900'>
              Inclusión confirmada
            </CardTitle>
            <CardDescription className='text-green-700'>
              {resultado.mensaje}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div className='space-y-3'>
          <h3 className='font-semibold text-slate-900'>
            Certificación blockchain
          </h3>
          <div className='grid gap-3 text-sm'>
            <div className='space-y-1'>
              <span className='block text-slate-600'>Hash de transacción:</span>
              <code className='block rounded-lg bg-slate-100 px-3 py-2 text-xs break-all'>
                {resultado.txHash}
              </code>
            </div>
            <div className='flex justify-between gap-4'>
              <span className='text-slate-600'>Bloque:</span>
              <span className='font-mono'>#{resultado.blockNumber}</span>
            </div>
            <div className='flex justify-between gap-4'>
              <span className='text-slate-600'>Red:</span>
              <span className='font-semibold text-green-700'>
                {resultado.networkName}
              </span>
            </div>
            <div className='flex justify-between gap-4'>
              <span className='text-slate-600'>ID Elección:</span>
              <span className='font-mono'>#{resultado.idEleccion}</span>
            </div>
            <div className='flex justify-between gap-4'>
              <span className='text-slate-600'>Fecha y hora:</span>
              <span className='text-right'>
                {formatearFecha(resultado.timestamp)}
              </span>
            </div>
          </div>

          {resultado.explorerUrl && (
            <Button variant='outline' className='w-full' asChild>
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

        <Alert>
          <AlertCircle className='size-4' />
          <AlertTitle className='text-sm'>
            Privacidad del sufragio garantizada
          </AlertTitle>
          <AlertDescription className='text-xs'>
            Esta verificación solo confirma la inclusión del hash en la urna
            electrónica. No revela el contenido del voto ni la identidad del
            votante.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
