import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import {
  FileSpreadsheet,
  LayoutList,
  Vote,
  Play,
  Square,
  Pencil,
  AlertCircle,
  X,
} from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
import { ComicioVentanaElectoral } from '@/features/eleccion/components/comicio-ventana-electoral'
import type { EleccionEstado } from '@/features/eleccion/data/schema'
import { useAbrirEleccion } from '@/features/eleccion/hooks/use-abrir-eleccion'
import { useCerrarEleccion } from '@/features/eleccion/hooks/use-cerrar-eleccion'
import { useEleccionWebSocket } from '@/features/eleccion/hooks/use-eleccion-websocket'
import {
  getEstadoEleccionBadgeVariant,
  getEstadoEleccionLabel,
} from '@/features/eleccion/lib/estado-eleccion'

const estadoVariant = (estado: EleccionEstado) =>
  getEstadoEleccionBadgeVariant(estado)

interface AbrirComicioDialogProps {
  idEleccion: number
  nombreEleccion: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onPreconditionError: (message: string) => void
}

const AbrirComicioDialog = ({
  idEleccion,
  nombreEleccion,
  open,
  onOpenChange,
  onPreconditionError,
}: AbrirComicioDialogProps) => {
  const { mutate: abrirEleccion, isPending } = useAbrirEleccion(
    idEleccion,
    onPreconditionError
  )

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
          <DialogDescription asChild>
            <div>
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
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            <X />
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={isPending}>
            <Play />
            {isPending ? 'Abriendo...' : 'Abrir comicio'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface CerrarComicioDialogProps {
  idEleccion: number
  nombreEleccion: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

const CerrarComicioDialog = ({
  idEleccion,
  nombreEleccion,
  open,
  onOpenChange,
}: CerrarComicioDialogProps) => {
  const { mutate: cerrarEleccion, isPending } = useCerrarEleccion(idEleccion)

  const handleConfirm = () => {
    cerrarEleccion(undefined, {
      onSuccess: () => {
        onOpenChange(false)
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cerrar comicio</DialogTitle>
          <DialogDescription asChild>
            <div>
              ¿Está seguro de que desea cerrar el comicio "{nombreEleccion}"?
              <br />
              <br />
              Esta acción bloqueará la urna on-chain (estado CLOSED), responderá
              HTTP 410 ante nuevos sufragios y congelará el Dashboard Público
              con resultados definitivos.
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            <X />
            Cancelar
          </Button>
          <Button
            variant='destructive'
            onClick={handleConfirm}
            disabled={isPending}
          >
            <Square />
            {isPending ? 'Cerrando...' : 'Cerrar comicio'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export const ComiciosList = () => {
  const queryClient = useQueryClient()
  const [abrirDialog, setAbrirDialog] = useState<{
    open: boolean
    idEleccion: number | null
    nombreEleccion: string
  }>({
    open: false,
    idEleccion: null,
    nombreEleccion: '',
  })
  const [cerrarDialog, setCerrarDialog] = useState<{
    open: boolean
    idEleccion: number | null
    nombreEleccion: string
  }>({
    open: false,
    idEleccion: null,
    nombreEleccion: '',
  })
  const [preconditionError, setPreconditionError] = useState<string | null>(
    null
  )

  const {
    data: comicios,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['elecciones'],
    queryFn: listarElecciones,
  })

  useEleccionWebSocket({
    onEleccionAbierta: () => {
      queryClient.invalidateQueries({ queryKey: ['elecciones'] })
    },
    onEleccionCerrada: () => {
      queryClient.invalidateQueries({ queryKey: ['elecciones'] })
    },
  })

  const handleOpenAbrirDialog = (
    idEleccion: number,
    nombreEleccion: string
  ) => {
    setAbrirDialog({ open: true, idEleccion, nombreEleccion })
    setPreconditionError(null)
  }

  const handleOpenCerrarDialog = (
    idEleccion: number,
    nombreEleccion: string
  ) => {
    setCerrarDialog({ open: true, idEleccion, nombreEleccion })
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
            <Link to='/comicios/nuevo'>
              <Vote />
              Crear comicio
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {preconditionError && (
        <Alert variant='destructive' className='mb-4'>
          <AlertCircle className='size-4' />
          <AlertTitle>
            Fallo de Precondición: Raíz de Merkle no detectada en la red
            descentralizada
          </AlertTitle>
          <AlertDescription>{preconditionError}</AlertDescription>
        </Alert>
      )}
      <ul className='grid gap-4' aria-label='Listado de comicios'>
        {comicios.map((comicio) => (
          <li key={comicio.idEleccion}>
            <Card>
              <CardHeader className='flex flex-row items-start justify-between gap-4 space-y-0'>
                <div className='space-y-1'>
                  <CardTitle className='text-lg'>{comicio.nombre}</CardTitle>
                  <CardDescription>ID {comicio.idEleccion}</CardDescription>
                  <ComicioVentanaElectoral
                    fechaInicio={comicio.fechaInicio}
                    fechaFin={comicio.fechaFin}
                  />
                </div>
                <Badge variant={estadoVariant(comicio.estado)}>
                  {getEstadoEleccionLabel(comicio.estado)}
                </Badge>
              </CardHeader>
              <CardContent className='flex flex-wrap gap-2'>
                <Button asChild variant='outline' size='sm'>
                  <Link
                    to='/comicios/$idEleccion/oferta'
                    params={{ idEleccion: String(comicio.idEleccion) }}
                    aria-label={`Ver oferta de ${comicio.nombre}`}
                  >
                    <LayoutList />
                    Ver oferta
                  </Link>
                </Button>
                <Button asChild variant='outline' size='sm'>
                  <Link
                    to='/comicios/$idEleccion/padron'
                    params={{ idEleccion: String(comicio.idEleccion) }}
                    aria-label={`Ver padrón de ${comicio.nombre}`}
                  >
                    <FileSpreadsheet />
                    Ver padrón
                  </Link>
                </Button>
                {comicio.estado === 'BORRADOR' && (
                  <Button asChild variant='outline' size='sm'>
                    <Link
                      to='/comicios/$idEleccion/editar'
                      params={{ idEleccion: String(comicio.idEleccion) }}
                      aria-label={`Editar ${comicio.nombre}`}
                    >
                      <Pencil />
                      Editar
                    </Link>
                  </Button>
                )}
                {comicio.estado === 'CONFIGURADA' && (
                  <Button
                    variant='default'
                    size='sm'
                    onClick={() =>
                      handleOpenAbrirDialog(comicio.idEleccion, comicio.nombre)
                    }
                    aria-label={`Abrir comicio ${comicio.nombre}`}
                  >
                    <Play />
                    Abrir comicio
                  </Button>
                )}
                {comicio.estado === 'ABIERTA' && (
                  <Button
                    variant='destructive'
                    size='sm'
                    onClick={() =>
                      handleOpenCerrarDialog(comicio.idEleccion, comicio.nombre)
                    }
                    aria-label={`Cerrar comicio ${comicio.nombre}`}
                  >
                    <Square />
                    Cerrar comicio
                  </Button>
                )}
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>

      {abrirDialog.idEleccion !== null && (
        <AbrirComicioDialog
          idEleccion={abrirDialog.idEleccion}
          nombreEleccion={abrirDialog.nombreEleccion}
          open={abrirDialog.open}
          onOpenChange={(open) =>
            setAbrirDialog((prev) => ({
              ...prev,
              open,
              ...(open ? {} : { idEleccion: null, nombreEleccion: '' }),
            }))
          }
          onPreconditionError={(message) => {
            setPreconditionError(message)
            setAbrirDialog({
              open: false,
              idEleccion: null,
              nombreEleccion: '',
            })
          }}
        />
      )}

      {cerrarDialog.idEleccion !== null && (
        <CerrarComicioDialog
          idEleccion={cerrarDialog.idEleccion}
          nombreEleccion={cerrarDialog.nombreEleccion}
          open={cerrarDialog.open}
          onOpenChange={(open) =>
            setCerrarDialog((prev) => ({
              ...prev,
              open,
              ...(open ? {} : { idEleccion: null, nombreEleccion: '' }),
            }))
          }
        />
      )}
    </>
  )
}
