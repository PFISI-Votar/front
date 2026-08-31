import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from '@tanstack/react-router'
import { AlertCircle, Pencil, Plus, Trash2, UserPen } from 'lucide-react'
import { toast } from 'sonner'
import { getApiErrorMessage, isConflictError } from '@/lib/api-client'
import { resolveMediaUrl } from '@/lib/media-url'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
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
import { Separator } from '@/components/ui/separator'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { obtenerEleccion } from '@/features/eleccion/api/eleccion-api'
import {
  eliminarCandidato,
  listarCandidatos,
} from '@/features/eleccion/candidato/api/candidato-api'
import { obtenerConfiguracionDatosCandidato } from '@/features/eleccion/candidato/api/configuracion-datos-candidato-api'
import { CandidatoFormDialog } from '@/features/eleccion/candidato/components/candidato-form-dialog'
import type { Candidato } from '@/features/eleccion/candidato/data/schema'
import { buildResumenDatosAdicionales } from '@/features/eleccion/candidato/utils/format-datos-adicionales'
import {
  actualizarLista,
  eliminarLista,
  listarListas,
} from '@/features/eleccion/lista/api/lista-api'
import { ListaFormDialog } from '@/features/eleccion/lista/components/lista-form-dialog'

const ESTADOS_COMICIO_FINALIZADO = [
  'CERRADA',
  'ESCRUTADA',
  'ARCHIVADA',
] as const

type ListaDetailPanelProps = {
  idEleccion: number
  idLista: number
}

export const ListaDetailPanel = ({
  idEleccion,
  idLista,
}: ListaDetailPanelProps) => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [conflictMessage, setConflictMessage] = useState<string | null>(null)
  const [listaDialogOpen, setListaDialogOpen] = useState(false)
  const [candidatoDialogOpen, setCandidatoDialogOpen] = useState(false)
  const [editingCandidato, setEditingCandidato] = useState<Candidato | null>(
    null
  )
  const [eliminarListaDialogOpen, setEliminarListaDialogOpen] = useState(false)

  const eleccionQuery = useQuery({
    queryKey: ['eleccion', idEleccion],
    queryFn: () => obtenerEleccion(idEleccion),
  })

  const listasQuery = useQuery({
    queryKey: ['listas', idEleccion],
    queryFn: () => listarListas(idEleccion),
  })

  const candidatosQuery = useQuery({
    queryKey: ['candidatos', idLista],
    queryFn: () => listarCandidatos(idLista),
  })

  const configQuery = useQuery({
    queryKey: ['config-datos-candidato', idEleccion],
    queryFn: () => obtenerConfiguracionDatosCandidato(idEleccion),
  })

  const lista = listasQuery.data?.find((item) => item.idLista === idLista)
  const candidatosEnComicio = useMemo(
    () => (listasQuery.data ?? []).flatMap((item) => item.candidatos ?? []),
    [listasQuery.data]
  )
  const isEditable = eleccionQuery.data?.estado === 'BORRADOR'

  const invalidateLista = async () => {
    await queryClient.invalidateQueries({ queryKey: ['candidatos', idLista] })
    await queryClient.invalidateQueries({ queryKey: ['listas', idEleccion] })
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

  const actualizarListaMutation = useMutation({
    mutationFn: (input: Parameters<typeof actualizarLista>[1]) =>
      actualizarLista(idLista, input),
    onSuccess: async () => {
      setConflictMessage(null)
      toast.success('Lista actualizada')
      await invalidateLista()
    },
    onError: handleApiError,
  })

  const eliminarCandidatoMutation = useMutation({
    mutationFn: eliminarCandidato,
    onSuccess: async () => {
      toast.success('Candidato eliminado')
      await invalidateLista()
      await queryClient.invalidateQueries({
        queryKey: ['config-datos-candidato', idEleccion],
      })
    },
    onError: handleApiError,
  })

  const eliminarListaMutation = useMutation({
    mutationFn: eliminarLista,
    onSuccess: async () => {
      setEliminarListaDialogOpen(false)
      toast.success('Lista eliminada')
      await queryClient.invalidateQueries({ queryKey: ['listas', idEleccion] })
      navigate({
        to: '/comicios/$idEleccion/oferta',
        params: { idEleccion: String(idEleccion) },
      })
    },
    onError: handleApiError,
  })

  if (
    listasQuery.isLoading ||
    candidatosQuery.isLoading ||
    configQuery.isLoading
  ) {
    return (
      <p className='text-sm text-muted-foreground' aria-live='polite'>
        Cargando lista…
      </p>
    )
  }

  if (!lista) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Lista no encontrada</CardTitle>
          <CardDescription>
            No existe una lista con ID {idLista} en este comicio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant='outline'>
            <Link
              to='/comicios/$idEleccion/oferta'
              params={{ idEleccion: String(idEleccion) }}
            >
              Volver a la oferta
            </Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  const candidatos = candidatosQuery.data ?? []
  const camposConfig = configQuery.data?.campos ?? []

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div className='flex items-start gap-4'>
          {lista.logoUrl && (
            <img
              src={resolveMediaUrl(lista.logoUrl)}
              alt={`Logotipo de ${lista.nombre}`}
              className='h-20 w-40 rounded-lg border bg-muted object-cover'
            />
          )}
          <div className='flex flex-col gap-1'>
            <h1 className='flex flex-wrap items-center gap-2 text-2xl font-bold tracking-tight md:text-3xl'>
              {lista.color && (
                <span
                  className='inline-block size-4 rounded-full'
                  style={{ backgroundColor: lista.color }}
                  aria-hidden='true'
                />
              )}
              {lista.nombre}
              <span className='text-xl font-normal text-muted-foreground'>
                ({lista.sigla})
              </span>
            </h1>
            <p className='text-muted-foreground'>
              Comicio #{idEleccion}
              {eleccionQuery.data ? ` - ${eleccionQuery.data.nombre}` : ''}
            </p>
          </div>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <Badge variant={isEditable ? 'secondary' : 'default'}>
            {ESTADOS_COMICIO_FINALIZADO.includes(
              eleccionQuery.data
                ?.estado as (typeof ESTADOS_COMICIO_FINALIZADO)[number]
            )
              ? eleccionQuery.data!.estado
              : lista.estado}
          </Badge>
        </div>
      </div>

      {listasQuery.data && listasQuery.data.length > 1 && (
        <Accordion type='single' collapsible>
          <AccordionItem value='listas-comicio'>
            <AccordionTrigger className='w-fit flex-none justify-start gap-2 text-sm font-medium hover:text-primary'>
              Ver listas del comicio ({listasQuery.data.length})
            </AccordionTrigger>
            <AccordionContent>
              <ul className='flex max-h-64 flex-col gap-1 overflow-y-auto'>
                {listasQuery.data.map((item) => {
                  const esListaActual = item.idLista === idLista
                  return (
                    <li key={item.idLista}>
                      {esListaActual ? (
                        <span
                          className='block rounded-md px-2 py-1.5 text-sm font-medium text-primary'
                          aria-current='page'
                        >
                          {item.nombre} ({item.sigla})
                        </span>
                      ) : (
                        <Link
                          to='/comicios/$idEleccion/listas/$idLista'
                          params={{
                            idEleccion: String(idEleccion),
                            idLista: String(item.idLista),
                          }}
                          className='block rounded-md px-2 py-1.5 text-sm hover:bg-muted'
                        >
                          {item.nombre} ({item.sigla})
                        </Link>
                      )}
                    </li>
                  )
                })}
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      {conflictMessage && (
        <Alert variant='destructive'>
          <AlertCircle className='size-4' />
          <AlertTitle>Operación denegada (409 Conflict)</AlertTitle>
          <AlertDescription>{conflictMessage}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className='text-lg'>Datos de la lista</CardTitle>
          <CardDescription>
            Información básica del partido o lista electoral registrada en la
            oferta.
          </CardDescription>
        </CardHeader>
        <CardContent className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
          <div>
            <p className='text-xs tracking-wide text-muted-foreground uppercase'>
              Nombre
            </p>
            <p className='font-medium'>{lista.nombre}</p>
          </div>
          <div>
            <p className='text-xs tracking-wide text-muted-foreground uppercase'>
              Sigla
            </p>
            <p className='font-medium'>{lista.sigla}</p>
          </div>
          <div>
            <p className='text-xs tracking-wide text-muted-foreground uppercase'>
              Color
            </p>
            <p className='flex items-center gap-2 font-medium'>
              {lista.color ? (
                <>
                  <span
                    className='inline-block size-3 rounded-full border'
                    style={{ backgroundColor: lista.color }}
                    aria-hidden='true'
                  />
                  {lista.color}
                </>
              ) : (
                'Sin color'
              )}
            </p>
          </div>
          <div>
            <p className='text-xs tracking-wide text-muted-foreground uppercase'>
              Candidatos
            </p>
            <p className='font-medium'>{candidatos.length}</p>
          </div>
        </CardContent>
      </Card>

      <div className='flex flex-wrap items-end justify-between gap-3'>
        <div>
          <h2 className='text-xl font-semibold tracking-tight'>Candidatos</h2>
          <p className='text-sm text-muted-foreground'>
            Integrantes registrados en esta lista electoral.
          </p>
        </div>
        {isEditable && (
          <div className='flex flex-wrap gap-2'>
            <Button
              variant='outline'
              onClick={() => setListaDialogOpen(true)}
              aria-label={`Editar lista ${lista.nombre}`}
            >
              <Pencil className='me-2 size-4' />
              Editar lista
            </Button>
            <Button
              onClick={() => {
                setEditingCandidato(null)
                setCandidatoDialogOpen(true)
              }}
              aria-label={`Registrar candidato en ${lista.nombre}`}
            >
              <Plus className='me-2 size-4' />
              Registrar candidato
            </Button>
            <Button
              variant='outline'
              disabled={eliminarListaMutation.isPending}
              onClick={() => setEliminarListaDialogOpen(true)}
              aria-label={`Eliminar lista ${lista.nombre}`}
            >
              <Trash2 className='me-2 size-4 text-destructive' />
              Eliminar lista
            </Button>
          </div>
        )}
      </div>

      <Separator />

      {candidatos.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className='text-lg'>Sin candidatos</CardTitle>
            <CardDescription>
              Todavía no hay candidatos en esta lista. Registre el primero para
              completar la oferta electoral.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isEditable && (
              <Button
                onClick={() => {
                  setEditingCandidato(null)
                  setCandidatoDialogOpen(true)
                }}
                aria-label={`Registrar candidato en ${lista.nombre}`}
              >
                <Plus className='me-2 size-4' />
                Registrar candidato
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <ul className='grid gap-3' aria-label={`Candidatos de ${lista.nombre}`}>
          {candidatos.map((candidato) => (
            <li key={candidato.idCandidato}>
              <Card>
                <CardHeader className='flex flex-row items-start justify-between gap-4 space-y-0'>
                  <div className='flex min-w-0 items-center gap-3'>
                    {candidato.fotoUrl ? (
                      <img
                        src={resolveMediaUrl(candidato.fotoUrl)}
                        alt={`Foto de ${candidato.nombre} ${candidato.apellido}`}
                        className='size-14 rounded-xl border bg-muted object-cover'
                      />
                    ) : (
                      <div className='grid size-14 place-items-center rounded-xl border bg-muted text-xs text-muted-foreground'>
                        Sin foto
                      </div>
                    )}
                    <div className='flex min-w-0 flex-col gap-1'>
                      <CardTitle className='text-base'>
                        {candidato.nombre} {candidato.apellido}
                      </CardTitle>
                      <CardDescription>
                        {candidato.categoriaNombre
                          ? `${candidato.categoriaNombre} · `
                          : ''}
                        {buildResumenDatosAdicionales(
                          candidato.datosAdicionales,
                          camposConfig
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  {isEditable && (
                    <div className='flex gap-2'>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => {
                          setEditingCandidato(candidato)
                          setCandidatoDialogOpen(true)
                        }}
                        aria-label={`Editar ${candidato.nombre} ${candidato.apellido}`}
                      >
                        <UserPen className='size-4' />
                      </Button>
                      <Button
                        size='sm'
                        variant='ghost'
                        onClick={() =>
                          eliminarCandidatoMutation.mutate(
                            candidato.idCandidato
                          )
                        }
                        aria-label={`Eliminar ${candidato.nombre} ${candidato.apellido}`}
                      >
                        <Trash2 className='size-4 text-destructive' />
                      </Button>
                    </div>
                  )}
                </CardHeader>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {!isEditable && (
        <p className='text-sm text-muted-foreground'>
          El comicio fue oficializado. No se pueden registrar ni modificar
          candidatos.
        </p>
      )}
      <ListaFormDialog
        open={listaDialogOpen}
        onOpenChange={setListaDialogOpen}
        lista={lista}
        onSubmit={async (values) => {
          await actualizarListaMutation.mutateAsync(values)
        }}
      />
      <CandidatoFormDialog
        open={candidatoDialogOpen}
        onOpenChange={(open) => {
          setCandidatoDialogOpen(open)
          if (!open) {
            setEditingCandidato(null)
          }
        }}
        idEleccion={idEleccion}
        idLista={idLista}
        listaNombre={lista.nombre}
        listaSigla={lista.sigla}
        candidatosEnLista={candidatos}
        candidatosEnComicio={candidatosEnComicio}
        candidato={editingCandidato}
      />

      <ConfirmDialog
        open={eliminarListaDialogOpen}
        onOpenChange={setEliminarListaDialogOpen}
        title='¿Eliminar la lista?'
        desc={
          <>
            Esta acción es <strong>irreversible</strong>. Se eliminará la lista{' '}
            <strong>{lista.nombre}</strong>
            {lista.sigla ? ` (${lista.sigla})` : ''} y todos sus candidatos
            asociados.
          </>
        }
        cancelBtnText='Cancelar'
        confirmText='Sí, eliminar lista'
        destructive
        isLoading={eliminarListaMutation.isPending}
        handleConfirm={() => eliminarListaMutation.mutate(idLista)}
      />
    </div>
  )
}
