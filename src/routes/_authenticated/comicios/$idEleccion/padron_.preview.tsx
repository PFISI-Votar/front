import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { PadronPreviewTable } from '@/features/padron/components/padron-preview-table'
import type { ImportarPadronResponse } from '@/features/padron/hooks/use-importar-padron'
import {
  leerPreview,
  limpiarPreview,
} from '@/features/padron/lib/preview-storage'

export const Route = createFileRoute(
  '/_authenticated/comicios/$idEleccion/padron_/preview'
)({
  component: PadronPreviewRoute,
})

function PadronPreviewRoute() {
  const { idEleccion: idParam } = Route.useParams()
  const idEleccion = Number(idParam)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  // Se lee el padrón en texto plano una sola vez al montar. Los re-renders no
  // vuelven a tocar sessionStorage, así el cleanup de abajo no puede dejar la
  // vista en estado vacío mientras sigue montada.
  const [preview] = useState(() => leerPreview(idEleccion))

  // Privacidad (Ley 25.326): el padrón en texto plano vive sólo en
  // sessionStorage. Se limpia al salir de la preview por cualquier vía —botón,
  // back del navegador o navegación SPA—. Un recargar (F5) remonta la ruta y
  // relee el storage antes de este cleanup, preservando la restauración.
  useEffect(() => () => limpiarPreview(idEleccion), [idEleccion])

  const volverAlPadron = () =>
    navigate({
      to: '/comicios/$idEleccion/padron',
      params: { idEleccion: idParam },
    })

  if (!preview || preview.registros.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No hay padrón para previsualizar</CardTitle>
          <CardDescription>
            Volvé a la página del comicio y cargá un archivo CSV o Excel.
          </CardDescription>
          <Button variant='outline' className='w-fit' onClick={volverAlPadron}>
            <ArrowLeft className='size-4' />
            Volver al padrón
          </Button>
        </CardHeader>
      </Card>
    )
  }

  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: ['padron-resumen', idEleccion] })
    queryClient.invalidateQueries({ queryKey: ['padron-votantes', idEleccion] })
    queryClient.invalidateQueries({ queryKey: ['eleccion', idEleccion] })
    queryClient.invalidateQueries({ queryKey: ['elecciones'] })
  }

  const onConfirmado = (resultado: ImportarPadronResponse) => {
    limpiarPreview(idEleccion)
    invalidar()
    const omitidos =
      resultado.totalOmitidos > 0
        ? ` (${resultado.totalOmitidos} omitidas)`
        : ''
    toast.success(
      `Se importaron ${resultado.totalImportados} identidades${omitidos}.`
    )
    volverAlPadron()
  }

  const onCancelar = () => {
    limpiarPreview(idEleccion)
    volverAlPadron()
  }

  return (
    <div className='space-y-6'>
      <div className='space-y-1'>
        <Button
          variant='ghost'
          size='sm'
          className='-ms-2'
          onClick={volverAlPadron}
        >
          <ArrowLeft className='size-4' />
          Volver al padrón
        </Button>
        <h1 className='text-2xl font-bold tracking-tight'>
          Previsualizar padrón
        </h1>
        <p className='text-muted-foreground'>
          Revisá, editá o borrá registros antes de importar. Las identidades se
          hashean recién al confirmar.
        </p>
      </div>
      <PadronPreviewTable
        idEleccion={idEleccion}
        registrosIniciales={preview.registros}
        campos={preview.campos}
        onConfirmado={onConfirmado}
        onCancelar={onCancelar}
      />
    </div>
  )
}
