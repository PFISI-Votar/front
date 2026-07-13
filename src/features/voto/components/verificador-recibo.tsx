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
import { verificarRecibo } from '@/features/voto/api/recibo-api'
import type { VerificarReciboResponse } from '@/features/voto/data/schema'
import { TX_HASH_REGEX } from '@/features/voto/lib/recibo-canonical'

type VerificadorReciboProps = {
  initialTxHash?: string
}

/**
 * VOTAR-360: public participation verification portal.
 * Confirms on-chain inclusion without revealing vote content (UAT-01/02/03).
 */
export const VerificadorRecibo = ({
  initialTxHash = '',
}: VerificadorReciboProps) => {
  const [txHash, setTxHash] = useState(initialTxHash)
  const [validationError, setValidationError] = useState<string | null>(null)
  const autoVerifyStarted = useRef(false)

  const verificarMutation = useMutation({
    mutationFn: (hash: string) => verificarRecibo(hash),
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

  return (
    <main className='container mx-auto min-h-screen max-w-3xl px-4 py-12'>
      <div className='space-y-8'>
        <div className='space-y-3 text-center'>
          <h1 className='text-4xl font-bold text-slate-900'>
            Verificador de Participación Electoral
          </h1>
          <p className='mx-auto max-w-2xl text-lg text-slate-600'>
            Ingrese el TransactionHash de su comprobante para confirmar que su
            participación fue registrada en la blockchain, sin revelar el
            contenido del sufragio.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>TransactionHash</CardTitle>
            <CardDescription>
              Encontrará este hash en su comprobante PDF o en la pantalla de
              confirmación de voto.
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
                      Verificar participación
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

        {verificarMutation.isError && (
          <Alert variant='destructive'>
            <AlertCircle className='size-4' />
            <AlertTitle>No se pudo verificar el comprobante</AlertTitle>
            <AlertDescription>
              {verificarMutation.error instanceof Error
                ? verificarMutation.error.message
                : 'Error desconocido al verificar.'}
            </AlertDescription>
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
            <p>Este portal no revela su voto ni su identidad personal.</p>
            <p>
              Solo confirma que su participación fue registrada en la
              blockchain.
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
  resultado: VerificarReciboResponse
}) => {
  const formatearFecha = (fecha: string) =>
    new Intl.DateTimeFormat('es-AR', {
      dateStyle: 'full',
      timeStyle: 'long',
    }).format(new Date(fecha))

  return (
    <Card className='border-green-200 bg-green-50/50'>
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
              Participación confirmada
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
            Información de la elección
          </h3>
          <div className='grid gap-3 text-sm'>
            <div className='flex justify-between gap-4'>
              <span className='text-slate-600'>Elección:</span>
              <span className='text-right font-semibold'>
                {resultado.nombreEleccion}
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
        </div>

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
              <span className='text-slate-600'>Estado:</span>
              <span className='font-semibold text-green-700'>
                {resultado.estadoTx}
              </span>
            </div>
          </div>

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
        </div>

        <Alert>
          <AlertCircle className='size-4' />
          <AlertTitle className='text-sm'>
            Privacidad del sufragio garantizada
          </AlertTitle>
          <AlertDescription className='text-xs'>
            Esta verificación solo confirma la participación electoral. No
            revela el contenido del voto ni la identidad del votante.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
