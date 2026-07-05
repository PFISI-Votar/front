import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ArrowRight, FileSpreadsheet, Vote, Play } from 'lucide-react'
import { formatDateTimeForDisplay } from '@/lib/datetime'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { listarElecciones } from '@/features/eleccion/api/eleccion-api'
import { useAbrirEleccion } from '@/features/eleccion/hooks/use-abrir-eleccion'
import { useEleccionWebSocket } from '@/features/eleccion/hooks/use-eleccion-websocket'
import type { EleccionEstado } from '@/features/eleccion/data/schema'

const estadoVariant = (estado: EleccionEstado) => {
  if (estado === 'BORRADOR') return 'secondary' as const
  if (estado === 'CONFIGURADA') return 'default' as const
  if (estado === 'ABIERTA') return 'default' as const
  return 'outline' as const
}

interface AbrirComicioDialogProps {
  idEleccion: number
  nombreEleccion: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

const AbrirComicioDialog = ({
  idEleccion,
  nombreEleccion,
  open,
  onOpenChange,
}: AbrirComicioDialogProps) => {
  const { mutate: abrirEleccion, isPending } = useAbrirEleccion(idEleccion)

  const handleConfirm = () => {
    abrirEleccion(undefined, {
      onSuccess: () => {
        onOpenChange(false)
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Abrir comicio</DialogTitle>
          <DialogDescription>
            ¿Está seguro de que desea abrir el comicio "{nombreEleccion}"?
            <br />
            <br />
            Esta acción habilitará la interfaz de votación (BUD) y comenzará a
            recibir votos de forma oficial. Asegúrese de que:
            <ul className='mt-2 list-inside list-disc space-y-1 text-sm'>
              <li>La raíz de Merkle del padrón esté publicada on-chain</li>
              <li>Los Smart Contracts estén disponibles en Sepolia</li>
              <li>La configuración del comicio sea correcta</li>
            </ul>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={isPending}>
            {isPending ? 'Abriendo...' : 'Abrir comicio'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export const ComiciosList = () => {
  const queryClient = useQueryClient()
  const [dialogState, setDialogState] = useState<{
    open: boolean
    idEleccion: number | null
    nombreEleccion: string
  }>({
    open: false,
    idEleccion: null,
    nombreEleccion: '',
  })

  const {
    data: comicios,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['elecciones'],
    queryFn: listarElecciones,
  })

  // Conectar WebSocket y actualizar lista cuando se abre un comicio
  useEleccionWebSocket({
    onEleccionAbierta: () => {
      // Invalidar cache para refrescar lista de elecciones
      queryClient.invalidateQueries({ queryKey: ['elecciones'] })
    },
  })

  const handleOpenDialog = (idEleccion: number, nombreEleccion: string) => {
    setDialogState({ open: true, idEleccion, nombreEleccion })
  }

  const handleCloseDialog = () => {
    setDialogState({ open: false, idEleccion: null, nombreEleccion: '' })
  }

  if (isLoading) {
    return (
      <p className='text-sm text-muted-foreground' aria-live='polite'>
        Cargando comicios…
      </p>
    )
  }

  if (isError) {
    return (
      <p className='text-sm text-destructive' role='alert'>
        No se pudo cargar el listado de comicios. Verifique que el backend esté
        en ejecución.
      </p>
    )
  }

  if (!comicios?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-lg'>
            <Vote className='size-5' />
            Sin comicios registrados
          </CardTitle>
          <CardDescription>
            Cree un comicio en estado BORRADOR para comenzar a cargar listas y
            candidatos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link to='/comicios/nuevo'>Crear comicio</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <ul className='grid gap-4' aria-label='Listado de comicios'>
        {comicios.map((comicio) => (
          <li key={comicio.idEleccion}>
            <Card>
              <CardHeader className='flex flex-row items-start justify-between gap-4 space-y-0'>
                <div className='space-y-1'>
                  <CardTitle className='text-lg'>{comicio.nombre}</CardTitle>
                  <CardDescription>
                    ID {comicio.idEleccion} · Apertura{' '}
                    {formatDateTimeForDisplay(comicio.fechaInicio)}
                  </CardDescription>
                </div>
                <Badge variant={estadoVariant(comicio.estado)}>
                  {comicio.estado}
                </Badge>
              </CardHeader>
              <CardContent className='flex flex-wrap gap-2'>
                <Button asChild variant='outline' size='sm'>
                  <Link
                    to='/comicios/$idEleccion/oferta'
                    params={{ idEleccion: String(comicio.idEleccion) }}
                    aria-label={`Ver oferta de ${comicio.nombre}`}
                  >
                    Ver oferta
                    <ArrowRight className='ms-2 size-4' />
                  </Link>
                </Button>
                <Button asChild variant='outline' size='sm'>
                  <Link
                    to='/comicios/$idEleccion/padron'
                    params={{ idEleccion: String(comicio.idEleccion) }}
                    aria-label={`Ver padrón de ${comicio.nombre}`}
                  >
                    <FileSpreadsheet className='me-2 size-4' />
                    Ver padrón
                  </Link>
                </Button>
                {comicio.estado === 'BORRADOR' && (
                  <>
                    <Button asChild variant='outline' size='sm'>
                      <Link
                        to='/comicios/$idEleccion/editar'
                        params={{ idEleccion: String(comicio.idEleccion) }}
                        aria-label={`Editar ${comicio.nombre}`}
                      >
                        Editar
                      </Link>
                    </Button>
                  </>
                )}
                {comicio.estado === 'CONFIGURADA' && (
                  <Button
                    variant='default'
                    size='sm'
                    onClick={() =>
                      handleOpenDialog(comicio.idEleccion, comicio.nombre)
                    }
                    aria-label={`Abrir comicio ${comicio.nombre}`}
                  >
                    <Play className='me-2 size-4' />
                    Abrir comicio
                  </Button>
                )}
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>

      {dialogState.idEleccion !== null && (
        <AbrirComicioDialog
          idEleccion={dialogState.idEleccion}
          nombreEleccion={dialogState.nombreEleccion}
          open={dialogState.open}
          onOpenChange={handleCloseDialog}
        />
      )}
    </>
  )
}
