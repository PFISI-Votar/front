import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  AlertCircle,
  BadgeCheck,
  Eye,
  FileSpreadsheet,
  Pause,
  Pencil,
  Play,
  PlayCircle,
  Square,
  Trash2,
  Vote,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api-client'
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
import { ConfirmDialog } from '@/components/confirm-dialog'
import {
  eliminarEleccion,
  listarElecciones,
} from '@/features/eleccion/api/eleccion-api'
import { ComicioVentanaElectoral } from '@/features/eleccion/components/comicio-ventana-electoral'
import { EliminarComicioDialog } from '@/features/eleccion/components/eliminar-comicio-dialog'
import { PausarComicioDialog } from '@/features/eleccion/components/pausar-comicio-dialog'
import { ReanudarComicioDialog } from '@/features/eleccion/components/reanudar-comicio-dialog'
import type { EleccionEstado } from '@/features/eleccion/data/schema'
import { useAbrirEleccion } from '@/features/eleccion/hooks/use-abrir-eleccion'
import { useCerrarEleccion } from '@/features/eleccion/hooks/use-cerrar-eleccion'
import { useEleccionWebSocket } from '@/features/eleccion/hooks/use-eleccion-websocket'
import {
  getEstadoEleccionBadgeVariant,
  getEstadoEleccionLabel,
} from '@/features/eleccion/lib/estado-eleccion'
import { oficializarEleccion } from '@/features/eleccion/lista/api/lista-api'

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
  const { runInBackground, isRunning } = useAbrirEleccion(idEleccion, {
    onPreconditionError,
    padronPath: `/comicios/${idEleccion}/padron`,
  })

  const handleConfirm = () => {
    onOpenChange(false)
    runInBackground()
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
              recibir votos de forma oficial. La apertura continuará en segundo
              plano y podrá seguir navegando el panel. Asegúrese de que:
              <ul className='mt-2 list-inside list-disc space-y-1 text-sm'>
                <li>La raíz de Merkle del padrón esté publicada on-chain</li>
                <li>Los Smart Contracts estén disponibles en Sepolia</li>
                <li>La configuración del comicio sea correcta</li>
              </ul>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            <X />
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={isRunning}>
            <Play />
            Abrir comicio
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

type ComicioActionTarget = {
  open: boolean
  idEleccion: number | null
  nombreEleccion: string
}

const emptyActionTarget = (): ComicioActionTarget => ({
  open: false,
  idEleccion: null,
  nombreEleccion: '',
})

export const ComiciosList = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [abrirDialog, setAbrirDialog] =
    useState<ComicioActionTarget>(emptyActionTarget)
  const [cerrarDialog, setCerrarDialog] =
    useState<ComicioActionTarget>(emptyActionTarget)
  const [pausarDialog, setPausarDialog] =
    useState<ComicioActionTarget>(emptyActionTarget)
  const [reanudarDialog, setReanudarDialog] =
    useState<ComicioActionTarget>(emptyActionTarget)
  const [oficializarDialog, setOficializarDialog] =
    useState<ComicioActionTarget>(emptyActionTarget)
  const [eliminarDialog, setEliminarDialog] =
    useState<ComicioActionTarget>(emptyActionTarget)
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
    onEleccionPausada: () => {
      queryClient.invalidateQueries({ queryKey: ['elecciones'] })
    },
    onEleccionReanudada: () => {
      queryClient.invalidateQueries({ queryKey: ['elecciones'] })
    },
  })

  const oficializarMutation = useMutation({
    mutationFn: (idEleccion: number) => oficializarEleccion(idEleccion),
    onSuccess: async (_data, idEleccion) => {
      setOficializarDialog(emptyActionTarget())
      toast.success('Comicio oficializado')
      await queryClient.invalidateQueries({ queryKey: ['elecciones'] })
      await queryClient.invalidateQueries({
        queryKey: ['eleccion', idEleccion],
      })
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error))
    },
  })

  const eliminarMutation = useMutation({
    mutationFn: (idEleccion: number) => eliminarEleccion(idEleccion),
    onSuccess: async () => {
      setEliminarDialog(emptyActionTarget())
      toast.success('Comicio eliminado')
      await queryClient.invalidateQueries({ queryKey: ['elecciones'] })
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error))
    },
  })

  const goToOferta = (idEleccion: number) => {
    navigate({
      to: '/comicios/$idEleccion/oferta',
      params: { idEleccion: String(idEleccion) },
    })
  }

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

  const handleOpenPausarDialog = (
    idEleccion: number,
    nombreEleccion: string
  ) => {
    setPausarDialog({ open: true, idEleccion, nombreEleccion })
  }

  const handleOpenReanudarDialog = (
    idEleccion: number,
    nombreEleccion: string
  ) => {
    setReanudarDialog({ open: true, idEleccion, nombreEleccion })
  }

  const handleOpenOficializarDialog = (
    idEleccion: number,
    nombreEleccion: string
  ) => {
    setOficializarDialog({ open: true, idEleccion, nombreEleccion })
  }

  const handleOpenEliminarDialog = (
    idEleccion: number,
    nombreEleccion: string
  ) => {
    setEliminarDialog({ open: true, idEleccion, nombreEleccion })
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
            <Card
              className='cursor-pointer transition-colors hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none'
              role='link'
              tabIndex={0}
              aria-label={`Ver oferta de ${comicio.nombre}`}
              onClick={() => goToOferta(comicio.idEleccion)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  goToOferta(comicio.idEleccion)
                }
              }}
            >
              <CardHeader className='flex flex-row items-start justify-between gap-4 space-y-0'>
                <div className='space-y-1'>
                  <CardTitle className='text-lg'>{comicio.nombre}</CardTitle>
                  <CardDescription>ID {comicio.idEleccion}</CardDescription>
                  <ComicioVentanaElectoral
                    fechaInicio={comicio.fechaInicio}
                    fechaFin={comicio.fechaFin}
                  />
                </div>
                <div className='flex items-center gap-2'>
                  {comicio.pausada && (
                    <Badge
                      variant='destructive'
                      aria-label={`${comicio.nombre} está pausada`}
                    >
                      <Pause className='size-3' />
                      Pausada
                    </Badge>
                  )}
                  <Badge variant={estadoVariant(comicio.estado)}>
                    {getEstadoEleccionLabel(comicio.estado)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent
                className='flex flex-wrap items-end justify-between gap-3'
                onClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => event.stopPropagation()}
              >
                <div className='flex flex-wrap gap-2'>
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
                  <Button asChild variant='outline' size='sm'>
                    <Link
                      to='/comicios/$idEleccion/dashboard'
                      params={{ idEleccion: String(comicio.idEleccion) }}
                      aria-label={`Ver dashboard público de ${comicio.nombre}`}
                    >
                      <Eye />
                      Dashboard público
                    </Link>
                  </Button>
                  <Button asChild variant='outline' size='sm'>
                    <Link
                      to='/comicios/$idEleccion/votar'
                      params={{ idEleccion: String(comicio.idEleccion) }}
                      target='_blank'
                      rel='noopener noreferrer'
                      aria-label={`Abrir BUD de ${comicio.nombre}`}
                    >
                      <Vote />
                      Abrir BUD
                    </Link>
                  </Button>
                  {comicio.estado === 'BORRADOR' && (
                    <Button
                      size='sm'
                      onClick={() =>
                        handleOpenOficializarDialog(
                          comicio.idEleccion,
                          comicio.nombre
                        )
                      }
                      aria-label={`Oficializar comicio ${comicio.nombre}`}
                    >
                      <BadgeCheck />
                      Oficializar comicio
                    </Button>
                  )}
                  {comicio.estado === 'CONFIGURADA' && (
                    <Button
                      size='sm'
                      onClick={() =>
                        handleOpenAbrirDialog(
                          comicio.idEleccion,
                          comicio.nombre
                        )
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
                        handleOpenCerrarDialog(
                          comicio.idEleccion,
                          comicio.nombre
                        )
                      }
                      aria-label={`Cerrar comicio ${comicio.nombre}`}
                    >
                      <Square />
                      Cerrar comicio
                    </Button>
                  )}
                  {comicio.estado === 'ABIERTA' && !comicio.pausada && (
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() =>
                        handleOpenPausarDialog(
                          comicio.idEleccion,
                          comicio.nombre
                        )
                      }
                      aria-label={`Pausar comicio ${comicio.nombre}`}
                    >
                      <Pause />
                      Pausar comicio
                    </Button>
                  )}
                  {comicio.pausada && (
                    <Button
                      size='sm'
                      onClick={() =>
                        handleOpenReanudarDialog(
                          comicio.idEleccion,
                          comicio.nombre
                        )
                      }
                      aria-label={`Reanudar comicio ${comicio.nombre}`}
                    >
                      <PlayCircle />
                      Reanudar comicio
                    </Button>
                  )}
                </div>
                {comicio.estado === 'BORRADOR' && (
                  <div className='ms-auto flex flex-wrap justify-end gap-2'>
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
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() =>
                        handleOpenEliminarDialog(
                          comicio.idEleccion,
                          comicio.nombre
                        )
                      }
                      aria-label={`Eliminar comicio ${comicio.nombre}`}
                    >
                      <Trash2 className='text-destructive' />
                      Eliminar
                    </Button>
                  </div>
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
            setAbrirDialog(emptyActionTarget())
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

      {pausarDialog.idEleccion !== null && (
        <PausarComicioDialog
          idEleccion={pausarDialog.idEleccion}
          nombreEleccion={pausarDialog.nombreEleccion}
          open={pausarDialog.open}
          onOpenChange={(open) =>
            setPausarDialog((prev) => ({
              ...prev,
              open,
              ...(open ? {} : { idEleccion: null, nombreEleccion: '' }),
            }))
          }
        />
      )}

      {reanudarDialog.idEleccion !== null && (
        <ReanudarComicioDialog
          idEleccion={reanudarDialog.idEleccion}
          nombreEleccion={reanudarDialog.nombreEleccion}
          open={reanudarDialog.open}
          onOpenChange={(open) =>
            setReanudarDialog((prev) => ({
              ...prev,
              open,
              ...(open ? {} : { idEleccion: null, nombreEleccion: '' }),
            }))
          }
        />
      )}

      <ConfirmDialog
        open={oficializarDialog.open}
        onOpenChange={(open) =>
          setOficializarDialog((prev) =>
            open ? { ...prev, open } : emptyActionTarget()
          )
        }
        title='¿Oficializar el comicio?'
        desc={
          <>
            Esta operación es <strong>irreversible</strong>. Una vez
            oficializado, no podrás crear, editar ni eliminar listas ni
            candidatos del comicio{' '}
            <strong>{oficializarDialog.nombreEleccion}</strong>.
          </>
        }
        cancelBtnText='Cancelar'
        confirmText='Sí, oficializar comicio'
        destructive
        isLoading={oficializarMutation.isPending}
        handleConfirm={() => {
          if (oficializarDialog.idEleccion !== null) {
            oficializarMutation.mutate(oficializarDialog.idEleccion)
          }
        }}
      />

      <EliminarComicioDialog
        open={eliminarDialog.open}
        onOpenChange={(open) =>
          setEliminarDialog((prev) =>
            open ? { ...prev, open } : emptyActionTarget()
          )
        }
        nombreEleccion={eliminarDialog.nombreEleccion}
        isLoading={eliminarMutation.isPending}
        onConfirm={() => {
          if (eliminarDialog.idEleccion !== null) {
            eliminarMutation.mutate(eliminarDialog.idEleccion)
          }
        }}
      />
    </>
  )
}
