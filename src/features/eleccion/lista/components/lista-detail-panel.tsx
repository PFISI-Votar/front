import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, Pencil, Plus, Trash2, UserPen } from 'lucide-react'
import { toast } from 'sonner'
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
import {
  getApiErrorMessage,
  isConflictError,
} from '@/lib/api-client'
import { eliminarCandidato, listarCandidatos } from '@/features/eleccion/candidato/api/candidato-api'
import { obtenerConfiguracionDatosCandidato } from '@/features/eleccion/candidato/api/configuracion-datos-candidato-api'
import { obtenerEleccion } from '@/features/eleccion/api/eleccion-api'
import { actualizarLista, eliminarLista, listarListas } from '@/features/eleccion/lista/api/lista-api'
import { ListaFormDialog } from '@/features/eleccion/lista/components/lista-form-dialog'
import { buildResumenDatosAdicionales } from '@/features/eleccion/candidato/utils/format-datos-adicionales'

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
      toast.success('Lista eliminada')
      await queryClient.invalidateQueries({ queryKey: ['listas', idEleccion] })
      navigate({
        to: '/comicios/$idEleccion/oferta',
        params: { idEleccion: String(idEleccion) },
      })
    },
    onError: handleApiError,
  })

  if (listasQuery.isLoading || candidatosQuery.isLoading || configQuery.isLoading) {
    return (
      <p className='text-muted-foreground text-sm' aria-live='polite'>
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
            <span className='text-muted-foreground text-xl font-normal'>
              ({lista.sigla})
            </span>
          </h1>
          <p className='text-muted-foreground'>
            Comicio #{idEleccion}
            {eleccionQuery.data ? ` — ${eleccionQuery.data.nombre}` : ''}
          </p>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <Badge variant={isEditable ? 'secondary' : 'default'}>
            {lista.estado}
          </Badge>
          {lista.listId != null && (
            <Badge variant='outline'>list_id {lista.listId}</Badge>
          )}
        </div>
      </div>

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
            <p className='text-muted-foreground text-xs uppercase tracking-wide'>
              Nombre
            </p>
            <p className='font-medium'>{lista.nombre}</p>
          </div>
          <div>
            <p className='text-muted-foreground text-xs uppercase tracking-wide'>
              Sigla
            </p>
            <p className='font-medium'>{lista.sigla}</p>
          </div>
          <div>
            <p className='text-muted-foreground text-xs uppercase tracking-wide'>
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
            <p className='text-muted-foreground text-xs uppercase tracking-wide'>
              Candidatos
            </p>
            <p className='font-medium'>{candidatos.length}</p>
          </div>
        </CardContent>
      </Card>

      <div className='flex flex-wrap items-end justify-between gap-3'>
        <div>
          <h2 className='text-xl font-semibold tracking-tight'>Candidatos</h2>
          <p className='text-muted-foreground text-sm'>
            Integrantes registrados en esta lista electoral.
          </p>
        </div>
        <div className='flex flex-wrap gap-2'>
          <Button
            variant='outline'
            disabled={!isEditable}
            onClick={() => setListaDialogOpen(true)}
            aria-label={`Editar lista ${lista.nombre}`}
          >
            <Pencil className='me-2 size-4' />
            Editar lista
          </Button>
          <Button asChild disabled={!isEditable}>
            <Link
              to='/comicios/$idEleccion/listas/$idLista/candidatos/nuevo'
              params={{
                idEleccion: String(idEleccion),
                idLista: String(idLista),
              }}
            >
              <Plus className='me-2 size-4' />
              Registrar candidato
            </Link>
          </Button>
          <Button
            variant='outline'
            disabled={!isEditable || eliminarListaMutation.isPending}
            onClick={() => {
              if (
                window.confirm(
                  `¿Eliminar la lista ${lista.nombre}? Esta acción no se puede deshacer.`
                )
              ) {
                eliminarListaMutation.mutate(idLista)
              }
            }}
          >
            <Trash2 className='me-2 size-4 text-destructive' />
            Eliminar lista
          </Button>
        </div>
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
            <Button asChild disabled={!isEditable}>
              <Link
                to='/comicios/$idEleccion/listas/$idLista/candidatos/nuevo'
                params={{
                  idEleccion: String(idEleccion),
                  idLista: String(idLista),
                }}
              >
                <Plus className='me-2 size-4' />
                Registrar candidato
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ul className='grid gap-3' aria-label={`Candidatos de ${lista.nombre}`}>
          {candidatos.map((candidato) => (
            <li key={candidato.idCandidato}>
              <Card>
                <CardHeader className='flex flex-row items-start justify-between gap-4 space-y-0'>
                  <div className='flex flex-col gap-1'>
                    <CardTitle className='text-base'>
                      {candidato.nombre} {candidato.apellido}
                    </CardTitle>
                    <CardDescription>
                      {candidato.categoriaNombre
                        ? `${candidato.categoriaNombre} · `
                        : ''}
                      {buildResumenDatosAdicionales(
                        candidato.datosAdicionales,
                        camposConfig,
                      )}
                    </CardDescription>
                  </div>
                  <div className='flex gap-2'>
                    <Button asChild size='sm' variant='outline' disabled={!isEditable}>
                      <Link
                        to='/comicios/$idEleccion/listas/$idLista/candidatos/$idCandidato'
                        params={{
                          idEleccion: String(idEleccion),
                          idLista: String(idLista),
                          idCandidato: String(candidato.idCandidato),
                        }}
                        aria-label={`Editar ${candidato.nombre} ${candidato.apellido}`}
                      >
                        <UserPen className='size-4' />
                      </Link>
                    </Button>
                    <Button
                      size='sm'
                      variant='ghost'
                      disabled={!isEditable}
                      onClick={() =>
                        eliminarCandidatoMutation.mutate(candidato.idCandidato)
                      }
                      aria-label={`Eliminar ${candidato.nombre} ${candidato.apellido}`}
                    >
                      <Trash2 className='size-4 text-destructive' />
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {!isEditable && (
        <p className='text-muted-foreground text-sm'>
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
    </div>
  )
}
