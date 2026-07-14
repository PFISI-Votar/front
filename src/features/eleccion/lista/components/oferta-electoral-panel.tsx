import { useMemo, useState } from 'react'
import { isAxiosError } from 'axios'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  ChevronDown,
  Lock,
  Pencil,
  Plus,
  Square,
  Trash2,
  UserPen,
  Vote,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  type ApiRulesViolation,
  getApiErrorMessage,
  getApiRulesViolations,
  isConflictError,
  isValidationError,
  isPreconditionFailedError,
} from '@/lib/api-client'
import { resolveMediaUrl } from '@/lib/media-url'
import { cn } from '@/lib/utils'
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Separator } from '@/components/ui/separator'
import { ConfirmDialog } from '@/components/confirm-dialog'
import {
  eliminarEleccion,
  obtenerEleccion,
  abrirEleccion,
  cerrarEleccion,
} from '@/features/eleccion/api/eleccion-api'
import { obtenerConfiguracionDatosCandidato } from '@/features/eleccion/candidato/api/configuracion-datos-candidato-api'
import { CandidatoFormDialog } from '@/features/eleccion/candidato/components/candidato-form-dialog'
import { ConfiguracionDatosCandidatoPanel } from '@/features/eleccion/candidato/components/configuracion-datos-candidato-panel'
import type { Candidato } from '@/features/eleccion/candidato/data/schema'
import { buildResumenDatosAdicionales } from '@/features/eleccion/candidato/utils/format-datos-adicionales'
import { CategoriasPanel } from '@/features/eleccion/categoria/components/categorias-panel'
import { ComicioVentanaElectoral } from '@/features/eleccion/components/comicio-ventana-electoral'
import { useEleccionWebSocket } from '@/features/eleccion/hooks/use-eleccion-websocket'
import {
  getEstadoEleccionBadgeVariant,
  getEstadoEleccionLabel,
} from '@/features/eleccion/lib/estado-eleccion'
import {
  actualizarLista,
  crearLista,
  eliminarLista,
  listarListas,
  oficializarEleccion,
  obtenerMapeoListas,
} from '@/features/eleccion/lista/api/lista-api'
import { ListaFormDialog } from '@/features/eleccion/lista/components/lista-form-dialog'
import type { Lista } from '@/features/eleccion/lista/data/schema'
import { usePadronResumen } from '@/features/padron/hooks/use-padron'

type CandidatoDialogState = {
  lista: Lista
  candidato: Candidato | null
}

type OfertaElectoralPanelProps = {
  idEleccion: number
}

export const OfertaElectoralPanel = ({
  idEleccion,
}: OfertaElectoralPanelProps) => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [conflictMessage, setConflictMessage] = useState<string | null>(null)
  const [oficializacionViolations, setOficializacionViolations] = useState<
    ApiRulesViolation[]
  >([])
  const [oficializacionBlockMessage, setOficializacionBlockMessage] = useState<
    string | null
  >(null)
  const [preconditionError, setPreconditionError] = useState<string | null>(
    null
  )
  const [listaDialogOpen, setListaDialogOpen] = useState(false)
  const [editingLista, setEditingLista] = useState<Lista | null>(null)
  const [candidatoDialog, setCandidatoDialog] =
    useState<CandidatoDialogState | null>(null)
  const [oficializarDialogOpen, setOficializarDialogOpen] = useState(false)
  const [abrirDialogOpen, setAbrirDialogOpen] = useState(false)
  const [cerrarDialogOpen, setCerrarDialogOpen] = useState(false)
  const [eliminarDialogOpen, setEliminarDialogOpen] = useState(false)
  const [listaAEliminar, setListaAEliminar] = useState<Lista | null>(null)

  const eleccionQuery = useQuery({
    queryKey: ['eleccion', idEleccion],
    queryFn: () => obtenerEleccion(idEleccion),
  })

  const listasQuery = useQuery({
    queryKey: ['listas', idEleccion],
    queryFn: () => listarListas(idEleccion),
  })

  const configQuery = useQuery({
    queryKey: ['config-datos-candidato', idEleccion],
    queryFn: () => obtenerConfiguracionDatosCandidato(idEleccion),
  })

  const padronResumenQuery = usePadronResumen(idEleccion)

  const mapeoQuery = useQuery({
    queryKey: ['listas-mapeo', idEleccion],
    queryFn: () => obtenerMapeoListas(idEleccion),
    enabled: eleccionQuery.data?.estado !== 'BORRADOR',
    retry: false,
  })

  const isEditable = eleccionQuery.data?.estado === 'BORRADOR'
  const sinPadronCargado =
    padronResumenQuery.isError &&
    isAxiosError(padronResumenQuery.error) &&
    padronResumenQuery.error.response?.status === 404
  const tienePadronCargado =
    Boolean(padronResumenQuery.data) && !sinPadronCargado
  const camposConfig = configQuery.data?.campos ?? []
  const candidatosEnComicio = useMemo(
    () => (listasQuery.data ?? []).flatMap((lista) => lista.candidatos ?? []),
    [listasQuery.data]
  )

  const invalidateOferta = async () => {
    await queryClient.invalidateQueries({ queryKey: ['listas', idEleccion] })
    await queryClient.invalidateQueries({ queryKey: ['eleccion', idEleccion] })
  }

  // Escuchar eventos WebSocket para actualizar en tiempo real
  useEleccionWebSocket({
    onEleccionAbierta: (data) => {
      if (data.idEleccion === idEleccion) {
        invalidateOferta()
        queryClient.invalidateQueries({ queryKey: ['elecciones'] })
      }
    },
    onEleccionCerrada: (data) => {
      if (data.idEleccion === idEleccion) {
        invalidateOferta()
        queryClient.invalidateQueries({ queryKey: ['elecciones'] })
      }
    },
  })

  const handleApiError = (error: unknown) => {
    if (isConflictError(error)) {
      const message = getApiErrorMessage(error)
      setConflictMessage(message)
      toast.error(message)
      return
    }
    toast.error(getApiErrorMessage(error))
  }

  const crearListaMutation = useMutation({
    mutationFn: (input: Parameters<typeof crearLista>[1]) =>
      crearLista(idEleccion, input),
    onSuccess: async () => {
      setConflictMessage(null)
      toast.success('Lista creada correctamente')
      await invalidateOferta()
    },
    onError: handleApiError,
  })

  const actualizarListaMutation = useMutation({
    mutationFn: ({
      idLista,
      input,
    }: {
      idLista: number
      input: Parameters<typeof actualizarLista>[1]
    }) => actualizarLista(idLista, input),
    onSuccess: async () => {
      setConflictMessage(null)
      toast.success('Lista actualizada')
      await invalidateOferta()
    },
    onError: handleApiError,
  })

  const eliminarListaMutation = useMutation({
    mutationFn: eliminarLista,
    onSuccess: async () => {
      setListaAEliminar(null)
      toast.success('Lista eliminada')
      await invalidateOferta()
    },
    onError: handleApiError,
  })

  const handleConfirmEliminarLista = () => {
    if (listaAEliminar) {
      eliminarListaMutation.mutate(listaAEliminar.idLista)
    }
  }

  const oficializarMutation = useMutation({
    mutationFn: () => oficializarEleccion(idEleccion),
    onSuccess: async (data) => {
      setOficializarDialogOpen(false)
      setOficializacionViolations([])
      setOficializacionBlockMessage(null)
      toast.success('Comicio oficializado')
      await invalidateOferta()
      await queryClient.invalidateQueries({
        queryKey: ['listas-mapeo', idEleccion],
      })
      toast.info(
        `Mapeo generado: ${data.mapeo.map((m) => `${m.sigla}→list_id ${m.listId}`).join(', ')}`
      )
    },
    onError: (error) => {
      setOficializarDialogOpen(false)
      if (isValidationError(error)) {
        const violations = getApiRulesViolations(error)
        if (violations.length > 0) {
          setOficializacionViolations(violations)
          setOficializacionBlockMessage(null)
          toast.error(getApiErrorMessage(error))
          return
        }
        const message = getApiErrorMessage(error)
        setOficializacionBlockMessage(message)
        setOficializacionViolations([])
        toast.error(message)
        return
      }
      handleApiError(error)
    },
  })

  const handleConfirmOficializar = () => {
    setOficializacionViolations([])
    setOficializacionBlockMessage(null)
    oficializarMutation.mutate()
  }

  const abrirComicioMutation = useMutation({
    mutationFn: () => abrirEleccion(idEleccion),
    onSuccess: async () => {
      setAbrirDialogOpen(false)
      setPreconditionError(null)
      toast.success('Comicio abierto exitosamente')
      await invalidateOferta()
      await queryClient.invalidateQueries({ queryKey: ['elecciones'] })
    },
    onError: (error) => {
      setAbrirDialogOpen(false)
      if (isPreconditionFailedError(error)) {
        const message = getApiErrorMessage(error)
        setPreconditionError(message)
        return
      }
      handleApiError(error)
    },
  })

  const handleConfirmAbrir = () => {
    setPreconditionError(null)
    abrirComicioMutation.mutate()
  }

  const cerrarComicioMutation = useMutation({
    mutationFn: () => cerrarEleccion(idEleccion),
    onSuccess: async () => {
      setCerrarDialogOpen(false)
      toast.success('Comicio cerrado exitosamente')
      await invalidateOferta()
      await queryClient.invalidateQueries({ queryKey: ['elecciones'] })
    },
    onError: handleApiError,
  })

  const handleConfirmCerrar = () => {
    cerrarComicioMutation.mutate()
  }

  const eliminarComicioMutation = useMutation({
    mutationFn: () => eliminarEleccion(idEleccion),
    onSuccess: async () => {
      setEliminarDialogOpen(false)
      toast.success('Comicio eliminado')
      await queryClient.invalidateQueries({ queryKey: ['elecciones'] })
      navigate({ to: '/comicios' })
    },
    onError: handleApiError,
  })

  const handleConfirmEliminarComicio = () => {
    eliminarComicioMutation.mutate()
  }

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div className='flex flex-col gap-1'>
          <h1 className='text-2xl font-bold tracking-tight md:text-3xl'>
            Oferta electoral
          </h1>
          <p className='text-muted-foreground'>
            Comicio #{idEleccion}
            {eleccionQuery.data ? ` - ${eleccionQuery.data.nombre}` : ''}
          </p>
          {eleccionQuery.data && eleccionQuery.data.estado !== 'BORRADOR' ? (
            <ComicioVentanaElectoral
              fechaInicio={eleccionQuery.data.fechaInicio}
              fechaFin={eleccionQuery.data.fechaFin}
            />
          ) : null}
        </div>
        <div className='flex flex-wrap items-center gap-3'>
          {eleccionQuery.data && (
            <Badge
              variant={getEstadoEleccionBadgeVariant(eleccionQuery.data.estado)}
            >
              {getEstadoEleccionLabel(eleccionQuery.data.estado)}
            </Badge>
          )}
          <Button asChild variant='outline'>
            <Link
              to='/comicios/$idEleccion/votar'
              params={{ idEleccion: String(idEleccion) }}
              target='_blank'
              rel='noopener noreferrer'
            >
              <Vote className='me-2 size-4' />
              Abrir BUD
            </Link>
          </Button>
          {isEditable && (
            <Button
              onClick={() => setOficializarDialogOpen(true)}
              disabled={
                oficializarMutation.isPending ||
                padronResumenQuery.isLoading ||
                !tienePadronCargado
              }
              aria-haspopup='dialog'
              aria-label='Oficializar comicio'
            >
              <BadgeCheck className='me-2 size-4' />
              Oficializar comicio
            </Button>
          )}
          {eleccionQuery.data?.estado === 'CONFIGURADA' && (
            <Button
              onClick={() => setAbrirDialogOpen(true)}
              disabled={abrirComicioMutation.isPending}
              aria-haspopup='dialog'
              aria-label='Abrir comicio'
            >
              <Vote className='me-2 size-4' />
              Abrir comicio
            </Button>
          )}
          {eleccionQuery.data?.estado === 'ABIERTA' && (
            <Button
              variant='destructive'
              onClick={() => setCerrarDialogOpen(true)}
              disabled={cerrarComicioMutation.isPending}
              aria-haspopup='dialog'
              aria-label='Cerrar comicio'
            >
              <Square className='me-2 size-4' />
              Cerrar comicio
            </Button>
          )}
        </div>
      </div>

      {isEditable && (
        <div className='flex flex-wrap gap-2'>
          <Button asChild variant='outline'>
            <Link
              to='/comicios/$idEleccion/editar'
              params={{ idEleccion: String(idEleccion) }}
              aria-label='Editar datos del comicio'
            >
              <Pencil className='me-2 size-4' />
              Editar comicio
            </Link>
          </Button>
          <Button
            variant='outline'
            onClick={() => setEliminarDialogOpen(true)}
            aria-haspopup='dialog'
            aria-label='Eliminar comicio'
          >
            <Trash2 className='me-2 size-4 text-destructive' />
            Eliminar comicio
          </Button>
        </div>
      )}

      {!isEditable && (
        <Alert>
          <Lock className='size-4' />
          <AlertTitle>Oferta congelada</AlertTitle>
          <AlertDescription>
            El comicio fue oficializado. El mismo no puede ser modificado ni
            eliminado.
          </AlertDescription>
        </Alert>
      )}

      {preconditionError && (
        <Alert variant='destructive'>
          <AlertCircle className='size-4' />
          <AlertTitle>
            Fallo de Precondición: Raíz de Merkle no detectada en la red
            descentralizada
          </AlertTitle>
          <AlertDescription>{preconditionError}</AlertDescription>
        </Alert>
      )}

      {isEditable && sinPadronCargado && !padronResumenQuery.isLoading && (
        <Alert variant='destructive'>
          <AlertCircle className='size-4' />
          <AlertTitle>Padrón electoral requerido</AlertTitle>
          <AlertDescription>
            Debe cargar el padrón electoral antes de oficializar el comicio.{' '}
            <Link
              to='/comicios/$idEleccion/padron'
              params={{ idEleccion: String(idEleccion) }}
              className='font-medium underline underline-offset-4'
            >
              Ir a carga de padrón
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {conflictMessage && (
        <Alert variant='destructive'>
          <AlertCircle className='size-4' />
          <AlertTitle>Operación denegada (409 Conflict)</AlertTitle>
          <AlertDescription>{conflictMessage}</AlertDescription>
        </Alert>
      )}

      {oficializacionBlockMessage && (
        <Alert variant='destructive'>
          <AlertCircle className='size-4' />
          <AlertTitle>No se puede oficializar el comicio</AlertTitle>
          <AlertDescription>{oficializacionBlockMessage}</AlertDescription>
        </Alert>
      )}

      {oficializacionViolations.length > 0 && (
        <Alert variant='destructive'>
          <AlertCircle className='size-4' />
          <AlertTitle>No se puede oficializar el comicio</AlertTitle>
          <AlertDescription>
            <ul className='mt-2 list-disc space-y-1 ps-4'>
              {oficializacionViolations.map((violation) => (
                <li key={`${violation.idLista}-${violation.idCategoria}`}>
                  {violation.message}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <ConfiguracionDatosCandidatoPanel
        idEleccion={idEleccion}
        isEditable={isEditable}
      />

      <CategoriasPanel idEleccion={idEleccion} isEditable={isEditable} />

      {isEditable && (
        <div>
          <Button
            onClick={() => {
              setEditingLista(null)
              setListaDialogOpen(true)
            }}
            aria-label='Crear nueva lista electoral'
          >
            <Plus className='me-2 size-4' />
            Nueva lista
          </Button>
        </div>
      )}

      {listasQuery.isLoading && (
        <p className='text-sm text-muted-foreground'>Cargando listas…</p>
      )}

      <div className='grid gap-4'>
        {(listasQuery.data ?? []).map((lista) => {
          const candidatos = lista.candidatos ?? []

          return (
            <Collapsible key={lista.idLista}>
              <Card>
                <CardHeader className='flex flex-row items-start justify-between gap-4 space-y-0 pb-3'>
                  <CollapsibleTrigger asChild>
                    <button
                      type='button'
                      className='group/trigger flex min-w-0 flex-1 flex-col gap-1 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                      aria-label={`${candidatos.length > 0 ? 'Ocultar' : 'Mostrar'} candidatos de ${lista.nombre}`}
                    >
                      <CardTitle className='flex flex-wrap items-center gap-2 text-lg'>
                        <ChevronDown
                          className={cn(
                            'size-4 shrink-0 text-muted-foreground transition-transform duration-200',
                            'group-data-[state=open]/trigger:rotate-180'
                          )}
                          aria-hidden='true'
                        />
                        {lista.color && (
                          <span
                            className='inline-block size-3 rounded-full'
                            style={{ backgroundColor: lista.color }}
                            aria-hidden='true'
                          />
                        )}
                        {lista.logoUrl && (
                          <img
                            src={resolveMediaUrl(lista.logoUrl)}
                            alt={`Logotipo de ${lista.nombre}`}
                            className='h-10 w-20 rounded-md border bg-muted object-cover'
                          />
                        )}
                        {lista.nombre}{' '}
                        <span className='text-base font-normal text-muted-foreground'>
                          ({lista.sigla})
                        </span>
                      </CardTitle>
                      <CardDescription>
                        {candidatos.length} candidato
                        {candidatos.length === 1 ? '' : 's'} · Estado:{' '}
                        {lista.estado}
                        {lista.listId != null
                          ? ` · Identificador de lista: ${lista.listId}`
                          : ''}
                      </CardDescription>
                    </button>
                  </CollapsibleTrigger>
                  <div className='flex shrink-0 gap-2'>
                    <Button asChild size='sm' variant='outline'>
                      <Link
                        to='/comicios/$idEleccion/listas/$idLista'
                        params={{
                          idEleccion: String(idEleccion),
                          idLista: String(lista.idLista),
                        }}
                        aria-label={`Ver detalle de ${lista.nombre}`}
                      >
                        Ver detalle
                        <ArrowRight className='ms-2 size-4' />
                      </Link>
                    </Button>
                    {isEditable && (
                      <>
                        <Button
                          size='sm'
                          variant='ghost'
                          onClick={() => {
                            setEditingLista(lista)
                            setListaDialogOpen(true)
                          }}
                          aria-label={`Editar lista ${lista.nombre}`}
                        >
                          <Pencil className='size-4' />
                        </Button>
                        <Button
                          size='sm'
                          variant='ghost'
                          onClick={() => setListaAEliminar(lista)}
                          aria-label={`Eliminar lista ${lista.nombre}`}
                        >
                          <Trash2 className='size-4 text-destructive' />
                        </Button>
                      </>
                    )}
                  </div>
                </CardHeader>
                <CollapsibleContent>
                  <Separator />
                  <CardContent className='pt-4'>
                    {candidatos.length === 0 ? (
                      <div className='flex flex-col gap-3'>
                        <p className='text-sm text-muted-foreground'>
                          Esta lista aún no tiene candidatos registrados.
                        </p>
                        {isEditable && (
                          <Button
                            size='sm'
                            variant='outline'
                            className='w-fit'
                            onClick={() =>
                              setCandidatoDialog({ lista, candidato: null })
                            }
                            aria-label={`Registrar candidato en ${lista.nombre}`}
                          >
                            <Plus className='me-2 size-4' />
                            Registrar candidato
                          </Button>
                        )}
                      </div>
                    ) : (
                      <ul
                        className='flex flex-col gap-2'
                        aria-label={`Candidatos de ${lista.nombre}`}
                      >
                        {candidatos.map((candidato) => (
                          <li
                            key={candidato.idCandidato}
                            className='flex flex-wrap items-start justify-between gap-3 rounded-lg border p-3'
                          >
                            <div className='flex min-w-0 items-center gap-3'>
                              {candidato.fotoUrl ? (
                                <img
                                  src={resolveMediaUrl(candidato.fotoUrl)}
                                  alt={`Foto de ${candidato.nombre} ${candidato.apellido}`}
                                  className='size-12 rounded-xl border bg-muted object-cover'
                                />
                              ) : (
                                <div className='grid size-12 place-items-center rounded-xl border bg-muted text-xs text-muted-foreground'>
                                  Sin foto
                                </div>
                              )}
                              <div className='flex min-w-0 flex-col gap-0.5'>
                                <p className='font-medium'>
                                  {candidato.nombre} {candidato.apellido}
                                </p>
                                <p className='text-sm text-muted-foreground'>
                                  {candidato.categoriaNombre
                                    ? `${candidato.categoriaNombre} · `
                                    : ''}
                                  {buildResumenDatosAdicionales(
                                    candidato.datosAdicionales,
                                    camposConfig
                                  )}
                                </p>
                              </div>
                            </div>
                            {isEditable && (
                              <Button
                                size='sm'
                                variant='ghost'
                                onClick={() =>
                                  setCandidatoDialog({ lista, candidato })
                                }
                                aria-label={`Editar ${candidato.nombre} ${candidato.apellido}`}
                              >
                                <UserPen className='size-4' />
                              </Button>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )
        })}
      </div>

      {mapeoQuery.data && mapeoQuery.data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Mapeo Identificador de lista (Web3)</CardTitle>
            <CardDescription>
              Identificadores estáticos para BUD y smart contracts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className='flex flex-col gap-1 text-sm'>
              {mapeoQuery.data.map((item) => (
                <li key={item.idLista}>
                  <code className='rounded bg-muted px-1'>
                    list_id={item.listId}
                  </code>{' '}
                  → {item.nombre} ({item.sigla})
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <ListaFormDialog
        open={listaDialogOpen}
        onOpenChange={(open) => {
          setListaDialogOpen(open)
          if (!open) {
            setEditingLista(null)
          }
        }}
        lista={editingLista}
        onSubmit={async (values) => {
          if (editingLista) {
            await actualizarListaMutation.mutateAsync({
              idLista: editingLista.idLista,
              input: values,
            })
            return
          }
          await crearListaMutation.mutateAsync(values)
        }}
      />

      {candidatoDialog && (
        <CandidatoFormDialog
          open={candidatoDialog != null}
          onOpenChange={(open) => {
            if (!open) {
              setCandidatoDialog(null)
            }
          }}
          idEleccion={idEleccion}
          idLista={candidatoDialog.lista.idLista}
          listaNombre={candidatoDialog.lista.nombre}
          listaSigla={candidatoDialog.lista.sigla}
          candidatosEnLista={candidatoDialog.lista.candidatos ?? []}
          candidatosEnComicio={candidatosEnComicio}
          candidato={candidatoDialog.candidato}
        />
      )}

      <ConfirmDialog
        open={abrirDialogOpen}
        onOpenChange={setAbrirDialogOpen}
        title='¿Abrir el comicio?'
        desc={
          <>
            Esta operación transicionará el comicio al estado{' '}
            <strong>ABIERTA</strong> y sincronizará el estado con la blockchain.
            Se validarán las precondiciones criptográficas (padrón cargado,
            Merkle publicado on-chain). Una vez abierto, el sistema comenzará a
            recibir votos.
          </>
        }
        cancelBtnText='Cancelar'
        confirmText='Sí, abrir comicio'
        isLoading={abrirComicioMutation.isPending}
        handleConfirm={handleConfirmAbrir}
      />

      <ConfirmDialog
        open={cerrarDialogOpen}
        onOpenChange={setCerrarDialogOpen}
        title='¿Cerrar el comicio?'
        desc={
          <>
            Esta operación transicionará el comicio al estado{' '}
            <strong>CERRADA</strong>, bloqueará nuevos sufragios (HTTP 410) y
            congelará el Dashboard Público con resultados definitivos.
          </>
        }
        cancelBtnText='Cancelar'
        confirmText='Sí, cerrar comicio'
        destructive
        isLoading={cerrarComicioMutation.isPending}
        handleConfirm={handleConfirmCerrar}
      />

      <ConfirmDialog
        open={oficializarDialogOpen}
        onOpenChange={setOficializarDialogOpen}
        title='¿Oficializar el comicio?'
        desc={
          <>
            Esta operación es <strong>irreversible</strong>. Una vez
            oficializado, no podrás crear, editar ni eliminar listas ni
            candidatos. Se generará el mapeo de identificadores de lista (
            <code>list_id</code>) para la integración Web3.
            {(listasQuery.data?.length ?? 0) > 0 && (
              <>
                {' '}
                Se oficializarán{' '}
                <strong>{listasQuery.data?.length} lista(s)</strong> con la
                oferta actual.
              </>
            )}
          </>
        }
        cancelBtnText='Cancelar'
        confirmText='Sí, oficializar comicio'
        destructive
        isLoading={oficializarMutation.isPending}
        handleConfirm={handleConfirmOficializar}
      />

      <ConfirmDialog
        open={eliminarDialogOpen}
        onOpenChange={setEliminarDialogOpen}
        title='¿Eliminar el comicio?'
        desc={
          <>
            Esta acción es <strong>irreversible</strong>. Se eliminarán todas
            las listas, candidatos y configuraciones asociadas al comicio{' '}
            <strong>{eleccionQuery.data?.nombre}</strong>.
          </>
        }
        cancelBtnText='Cancelar'
        confirmText='Sí, eliminar comicio'
        destructive
        isLoading={eliminarComicioMutation.isPending}
        handleConfirm={handleConfirmEliminarComicio}
      />

      <ConfirmDialog
        open={listaAEliminar !== null}
        onOpenChange={(open) => {
          if (!open) {
            setListaAEliminar(null)
          }
        }}
        title='¿Eliminar la lista?'
        desc={
          listaAEliminar ? (
            <>
              Esta acción es <strong>irreversible</strong>. Se eliminará la lista{' '}
              <strong>{listaAEliminar.nombre}</strong>
              {listaAEliminar.sigla ? ` (${listaAEliminar.sigla})` : ''} y todos
              sus candidatos asociados.
            </>
          ) : (
            ''
          )
        }
        cancelBtnText='Cancelar'
        confirmText='Sí, eliminar lista'
        destructive
        isLoading={eliminarListaMutation.isPending}
        handleConfirm={handleConfirmEliminarLista}
      />
    </div>
  )
}
