import { useEffect, useState } from 'react'
import { AxiosError } from 'axios'
import { useMutation } from '@tanstack/react-query'
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Search,
} from 'lucide-react'
import { getApiErrorMessage } from '@/lib/api-client'
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

/**
 * VOTAR-360: Portal público de verificación de recibos electorales.
 *
 * Permite a ciudadanos, fiscales y auditores verificar la autenticidad
 * de un comprobante de participación electoral sin revelar el voto ni
 * la identidad del votante.
 *
 * Cumple UAT-01, UAT-02 y UAT-03 de VOTAR-360.
 *
 * @param codigoInicial - Código opcional desde URL para autocarga (UAT-03)
 */
export const VerificadorRecibo = ({
  codigoInicial,
}: {
  codigoInicial?: string
}) => {
  const [codigo, setCodigo] = useState(codigoInicial ?? '')

  const verificarMutation = useMutation({
    mutationFn: (codigo: string) => verificarRecibo(codigo),
    onError: (_error) => {
      // console.error('Error verificando recibo:', _error)
    },
  })

  // VOTAR-360 UAT-03: Autocarga y verificación desde URL (QR offline)
  useEffect(() => {
    if (
      codigoInicial &&
      !verificarMutation.data &&
      !verificarMutation.isError
    ) {
      // Validar formato básico antes de llamar al backend
      const esFormatoValido =
        // UUID format
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          codigoInicial
        ) ||
        // Ethereum txHash format (0x + 64 hex chars)
        /^0x[0-9a-fA-F]{64}$/i.test(codigoInicial)

      if (esFormatoValido) {
        verificarMutation.mutate(codigoInicial)
      }
    }
  }, [codigoInicial]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const codigoLimpio = codigo.trim()

    if (!codigoLimpio) {
      alert('Por favor ingrese un código de verificación')
      return
    }

    // Validar formato: UUID o Ethereum txHash
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const txHashRegex = /^0x[0-9a-fA-F]{64}$/i

    const esFormatoValido =
      uuidRegex.test(codigoLimpio) || txHashRegex.test(codigoLimpio)

    if (!esFormatoValido) {
      alert(
        'El código ingresado no tiene el formato correcto. Debe ser un UUID válido o un hash de transacción Ethereum (0x...).'
      )
      return
    }

    verificarMutation.mutate(codigoLimpio)
  }

  const handleReset = () => {
    setCodigo('')
    verificarMutation.reset()
  }

  return (
    <main className='container mx-auto min-h-screen max-w-3xl px-4 py-12'>
      <div className='space-y-8'>
        {/* Encabezado */}
        <div className='space-y-3 text-center'>
          <h1 className='text-4xl font-bold text-slate-900'>
            Verificador de Participación Electoral
          </h1>
          <p className='mx-auto max-w-2xl text-lg text-slate-600'>
            Ingrese el código de verificación E2E de su comprobante para
            confirmar que su participación fue registrada exitosamente en la
            blockchain.
          </p>
        </div>

        {/* Formulario de búsqueda */}
        <Card>
          <CardHeader>
            <CardTitle>Código de Verificación E2E</CardTitle>
            <CardDescription>
              Encontrará este código en su comprobante PDF descargado o en la
              pantalla de confirmación de voto.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='codigo-verificacion'>
                  Código de Verificación E2E
                </Label>
                <Input
                  id='codigo-verificacion'
                  type='text'
                  placeholder='UUID o txHash (0x...)'
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  className='font-mono text-sm'
                  aria-label='Ingrese el código de verificación E2E'
                  aria-describedby='codigo-help'
                  disabled={verificarMutation.isPending}
                />
                <p id='codigo-help' className='text-xs text-slate-500'>
                  Ejemplo UUID: a1b2c3d4-5678-90ab-cdef-1234567890ab
                  <br />
                  Ejemplo txHash: 0x1234...abcd (66 caracteres)
                </p>
              </div>

              <div className='flex gap-3'>
                <Button
                  type='submit'
                  className='flex-1'
                  disabled={verificarMutation.isPending || !codigo.trim()}
                >
                  {verificarMutation.isPending ? (
                    <>
                      <Loader2 className='mr-2 size-4 animate-spin' />
                      Verificando...
                    </>
                  ) : (
                    <>
                      <Search className='mr-2 size-4' />
                      Verificar Comprobante
                    </>
                  )}
                </Button>
                {verificarMutation.data && (
                  <Button type='button' variant='outline' onClick={handleReset}>
                    Nueva Búsqueda
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Resultado: Error */}
        {verificarMutation.isError && (
          <Alert variant='destructive'>
            <AlertCircle className='size-4' />
            <AlertTitle>No se pudo verificar el comprobante</AlertTitle>
            <AlertDescription>
              {verificarMutation.error instanceof AxiosError &&
              verificarMutation.error.response?.status === 404
                ? 'Código de verificación no encontrado. Verifique que el código sea correcto.'
                : verificarMutation.error instanceof AxiosError &&
                    verificarMutation.error.response?.status === 429
                  ? 'Demasiados intentos de verificación. Espere un momento y vuelva a intentar.'
                  : getApiErrorMessage(verificarMutation.error)}
            </AlertDescription>
          </Alert>
        )}

        {/* Resultado: Éxito */}
        {verificarMutation.data && (
          <ResultadoVerificacion resultado={verificarMutation.data} />
        )}

        {/* Información adicional */}
        <Card className='bg-slate-50'>
          <CardHeader>
            <CardTitle className='text-sm font-medium'>
              Privacidad Garantizada
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-2 text-sm text-slate-600'>
            <p>✓ Este portal NO revela su voto ni su identidad personal.</p>
            <p>
              ✓ Solo confirma que su participación fue registrada en la
              blockchain.
            </p>
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
  const formatearFecha = (fecha: string) => {
    return new Intl.DateTimeFormat('es-AR', {
      dateStyle: 'full',
      timeStyle: 'long',
    }).format(new Date(fecha))
  }

  const getEstadoColor = (estado?: string) => {
    if (!estado) return 'text-slate-600'
    if (estado === 'CONFIRMADA') return 'text-green-600'
    if (estado === 'PENDIENTE') return 'text-yellow-600'
    if (estado === 'FALLIDA') return 'text-red-600'
    return 'text-slate-600'
  }

  const getEstadoTexto = (estado?: string) => {
    if (!estado) return 'Confirmado'
    if (estado === 'CONFIRMADA') return 'Confirmada'
    if (estado === 'PENDIENTE') return 'Pendiente'
    if (estado === 'FALLIDA') return 'Fallida'
    return estado
  }

  return (
    <Card className='border-green-200 bg-green-50/50'>
      <CardHeader>
        <div className='flex items-start gap-3'>
          <div className='rounded-full bg-green-100 p-2'>
            <CheckCircle2 className='size-6 text-green-600' />
          </div>
          <div>
            <CardTitle className='text-green-900'>
              Participación Confirmada
            </CardTitle>
            <CardDescription className='text-green-700'>
              Su voto fue registrado exitosamente en la blockchain electoral
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* Información de la elección */}
        <div className='space-y-3'>
          <h3 className='font-semibold text-slate-900'>
            Información de la Elección
          </h3>
          <div className='grid gap-3 text-sm'>
            <div className='flex justify-between'>
              <span className='text-slate-600'>Elección:</span>
              <span className='text-right font-semibold'>
                {resultado.nombreEleccion}
              </span>
            </div>
            <div className='flex justify-between'>
              <span className='text-slate-600'>ID Elección:</span>
              <span className='font-mono'>#{resultado.idEleccion}</span>
            </div>
            <div className='flex justify-between'>
              <span className='text-slate-600'>Fecha y Hora:</span>
              <span className='text-right'>
                {formatearFecha(resultado.recibidoEn)}
              </span>
            </div>
          </div>
        </div>

        {/* Información blockchain */}
        {resultado.txHash && (
          <div className='space-y-3'>
            <h3 className='font-semibold text-slate-900'>
              Certificación Blockchain
            </h3>
            <div className='grid gap-3 text-sm'>
              <div className='space-y-1'>
                <span className='block text-slate-600'>
                  Hash de Transacción:
                </span>
                <code className='block rounded-lg bg-slate-100 px-3 py-2 text-xs break-all'>
                  {resultado.txHash}
                </code>
              </div>
              {resultado.blockNumber && (
                <div className='flex justify-between'>
                  <span className='text-slate-600'>Bloque:</span>
                  <span className='font-mono'>#{resultado.blockNumber}</span>
                </div>
              )}
              <div className='flex justify-between'>
                <span className='text-slate-600'>Estado:</span>
                <span
                  className={`font-semibold ${getEstadoColor(resultado.estadoTx)}`}
                >
                  {getEstadoTexto(resultado.estadoTx)}
                </span>
              </div>
            </div>

            {resultado.urlExploradorBlockchain && (
              <Button variant='outline' className='w-full' asChild>
                <a
                  href={resultado.urlExploradorBlockchain}
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  <ExternalLink className='mr-2 size-4' />
                  Ver en Explorador de Bloques (Etherscan)
                </a>
              </Button>
            )}
          </div>
        )}

        {/* Hash del comprobante */}
        <div className='space-y-3'>
          <h3 className='font-semibold text-slate-900'>
            Comprobante Off-Chain
          </h3>
          <div className='space-y-1'>
            <span className='block text-sm text-slate-600'>
              Hash del Comprobante:
            </span>
            <code className='block rounded-lg bg-slate-100 px-3 py-2 text-xs break-all'>
              {resultado.comprobanteHash}
            </code>
          </div>
        </div>

        {/* Disclaimer final */}
        <Alert>
          <AlertCircle className='size-4' />
          <AlertTitle className='text-sm'>
            Privacidad del Sufragio Garantizada
          </AlertTitle>
          <AlertDescription className='text-xs'>
            Esta verificación solo confirma la participación electoral. NO
            revela el contenido del voto ni la identidad del votante.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
