import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AlertCircle, ArrowRight, ChevronDown, Lock, Pencil, Plus, Trash2, UserPen } from 'lucide-react'
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
import { cn } from '@/lib/utils'
import {
  getApiErrorMessage,
  getApiRulesViolations,
  isConflictError,
  isValidationError,
} from '@/lib/api-client'
import { eliminarEleccion, obtenerEleccion } from '@/features/eleccion/api/eleccion-api'
import { obtenerConfiguracionDatosCandidato } from '@/features/eleccion/candidato/api/configuracion-datos-candidato-api'
import {
  actualizarLista,
  crearLista,
  eliminarLista,
  listarListas,
  oficializarEleccion,
  obtenerMapeoListas,
} from '@/features/eleccion/lista/api/lista-api'
import type { Lista } from '@/features/eleccion/lista/data/schema'
import type { ApiRulesViolation } from '@/lib/api-client'
import { ListaFormDialog } from '@/features/eleccion/lista/components/lista-form-dialog'
import { CategoriasPanel } from '@/features/eleccion/categoria/components/categorias-panel'
import { ConfiguracionDatosCandidatoPanel } from '@/features/eleccion/candidato/components/configuracion-datos-candidato-panel'
import { buildResumenDatosAdicionales } from '@/features/eleccion/candidato/utils/format-datos-adicionales'

type OfertaElectoralPanelProps = {
  idEleccion: number
}

export const OfertaElectoralPanel = ({ idEleccion }: OfertaElectoralPanelProps) => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [conflictMessage, setConflictMessage] = useState<string | null>(null)
  const [oficializacionViolations, setOficializacionViolations] = useState<
    ApiRulesViolation[]
  >([])
  const [oficializacionBlockMessage, setOficializacionBlockMessage] = useState<
    string | null
  >(null)
  const [listaDialogOpen, setListaDialogOpen] = useState(false)
  const [editingLista, setEditingLista] = useState<Lista | null>(null)
  const [oficializarDialogOpen, setOficializarDialogOpen] = useState(false)
  const [eliminarDialogOpen, setEliminarDialogOpen] = useState(false)

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

  const mapeoQuery = useQuery({
    queryKey: ['listas-mapeo', idEleccion],
    queryFn: () => obtenerMapeoListas(idEleccion),
    enabled: eleccionQuery.data?.estado !== 'BORRADOR',
    retry: false,
  })

  const isEditable = eleccionQuery.data?.estado === 'BORRADOR'
  const camposConfig = configQuery.data?.campos ?? []

  const invalidateOferta = async () => {
    await queryClient.invalidateQueries({ queryKey: ['listas', idEleccion] })
    await queryClient.invalidateQueries({ queryKey: ['eleccion', idEleccion] })
  }

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
      toast.success('Lista eliminada')
      await invalidateOferta()
    },
    onError: handleApiError,
  })

  const oficializarMutation = useMutation({
    mutationFn: () => oficializarEleccion(idEleccion),
    onSuccess: async (data) => {
      setOficializarDialogOpen(false)
      setOficializacionViolations([])
      setOficializacionBlockMessage(null)
      toast.success('Comicio oficializado')
      await invalidateOferta()
      await queryClient.invalidateQueries({ queryKey: ['listas-mapeo', idEleccion] })
      toast.info(
        `Mapeo generado: ${data.mapeo.map((m) => `${m.sigla}→list_id ${m.listId}`).join(', ')}`,
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
            {eleccionQuery.data ? ` — ${eleccionQuery.data.nombre}` : ''}
          </p>
        </div>
        {eleccionQuery.data && (
          <Badge variant={isEditable ? 'secondary' : 'default'}>
            {eleccionQuery.data.estado}
          </Badge>
        )}
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
            El comicio fue oficializado. El mismo no puede ser modificado ni eliminado.
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

      <div className='flex flex-wrap gap-2'>
        <Button
          onClick={() => {
            setEditingLista(null)
            setListaDialogOpen(true)
          }}
          disabled={!isEditable}
          aria-label='Crear nueva lista electoral'
        >
          <Plus className='me-2 size-4' />
          Nueva lista
        </Button>
        <Button
          variant='outline'
          onClick={() => setOficializarDialogOpen(true)}
          disabled={!isEditable || oficializarMutation.isPending}
          aria-haspopup='dialog'
        >
          Oficializar comicio
        </Button>
      </div>

      {listasQuery.isLoading && (
        <p className='text-muted-foreground text-sm'>Cargando listas…</p>
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
                            'text-muted-foreground size-4 shrink-0 transition-transform duration-200',
                            'group-data-[state=open]/trigger:rotate-180',
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
                        {lista.nombre}{' '}
                        <span className='text-muted-foreground text-base font-normal'>
                          ({lista.sigla})
                        </span>
                      </CardTitle>
                      <CardDescription>
                        {candidatos.length} candidato
                        {candidatos.length === 1 ? '' : 's'} · Estado: {lista.estado}
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
                    <Button
                      size='sm'
                      variant='ghost'
                      disabled={!isEditable}
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
                      disabled={!isEditable}
                      onClick={() => eliminarListaMutation.mutate(lista.idLista)}
                      aria-label={`Eliminar lista ${lista.nombre}`}
                    >
                      <Trash2 className='size-4 text-destructive' />
                    </Button>
                  </div>
                </CardHeader>
                <CollapsibleContent>
                  <Separator />
                  <CardContent className='pt-4'>
                    {candidatos.length === 0 ? (
                      <div className='flex flex-col gap-3'>
                        <p className='text-muted-foreground text-sm'>
                          Esta lista aún no tiene candidatos registrados.
                        </p>
                        {isEditable && (
                          <Button asChild size='sm' variant='outline' className='w-fit'>
                            <Link
                              to='/comicios/$idEleccion/listas/$idLista/candidatos/nuevo'
                              params={{
                                idEleccion: String(idEleccion),
                                idLista: String(lista.idLista),
                              }}
                            >
                              <Plus className='me-2 size-4' />
                              Registrar candidato
                            </Link>
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
                            <div className='flex min-w-0 flex-col gap-0.5'>
                              <p className='font-medium'>
                                {candidato.nombre} {candidato.apellido}
                              </p>
                              <p className='text-muted-foreground text-sm'>
                                {candidato.categoriaNombre
                                  ? `${candidato.categoriaNombre} · `
                                  : ''}
                                {buildResumenDatosAdicionales(
                                  candidato.datosAdicionales,
                                  camposConfig,
                                )}
                              </p>
                            </div>
                            {isEditable && (
                              <Button asChild size='sm' variant='ghost'>
                                <Link
                                  to='/comicios/$idEleccion/listas/$idLista/candidatos/$idCandidato'
                                  params={{
                                    idEleccion: String(idEleccion),
                                    idLista: String(lista.idLista),
                                    idCandidato: String(candidato.idCandidato),
                                  }}
                                  aria-label={`Editar ${candidato.nombre} ${candidato.apellido}`}
                                >
                                  <UserPen className='size-4' />
                                </Link>
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
                  <code className='rounded bg-muted px-1'>list_id={item.listId}</code>{' '}
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

      <ConfirmDialog
        open={oficializarDialogOpen}
        onOpenChange={setOficializarDialogOpen}
        title='¿Oficializar el comicio?'
        desc={
          <>
            Esta operación es <strong>irreversible</strong>. Una vez oficializado,
            no podrás crear, editar ni eliminar listas ni candidatos. Se generará
            el mapeo de identificadores de lista (<code>list_id</code>) para la
            integración Web3.
            {(listasQuery.data?.length ?? 0) > 0 && (
              <>
                {' '}
                Se oficializarán{' '}
                <strong>{listasQuery.data?.length} lista(s)</strong> con la oferta
                actual.
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
            Esta acción es <strong>irreversible</strong>. Se eliminarán todas las
            listas, candidatos y configuraciones asociadas al comicio{' '}
            <strong>{eleccionQuery.data?.nombre}</strong>.
          </>
        }
        cancelBtnText='Cancelar'
        confirmText='Sí, eliminar comicio'
        destructive
        isLoading={eliminarComicioMutation.isPending}
        handleConfirm={handleConfirmEliminarComicio}
      />
    </div>
  )
}
