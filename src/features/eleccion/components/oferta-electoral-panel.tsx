import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { AlertCircle, ArrowRight, Lock, Plus, Trash2 } from 'lucide-react'
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
  getApiErrorMessage,
  isConflictError,
} from '@/lib/api-client'
import { obtenerEleccion } from '../api/eleccion-api'
import {
  crearLista,
  eliminarLista,
  listarListas,
  oficializarEleccion,
  obtenerMapeoListas,
} from '../api/lista-api'
import { ListaFormDialog } from './lista-form-dialog'
import { ConfiguracionDatosCandidatoPanel } from './configuracion-datos-candidato-panel'

type OfertaElectoralPanelProps = {
  idEleccion: number
}

export const OfertaElectoralPanel = ({ idEleccion }: OfertaElectoralPanelProps) => {
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

  const mapeoQuery = useQuery({
    queryKey: ['listas-mapeo', idEleccion],
    queryFn: () => obtenerMapeoListas(idEleccion),
    enabled: eleccionQuery.data?.estado !== 'BORRADOR',
    retry: false,
  })

  const isEditable = eleccionQuery.data?.estado === 'BORRADOR'

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
      toast.success('Comicio oficializado')
      await invalidateOferta()
      await queryClient.invalidateQueries({ queryKey: ['listas-mapeo', idEleccion] })
      toast.info(
        `Mapeo generado: ${data.mapeo.map((m) => `${m.sigla}→list_id ${m.listId}`).join(', ')}`,
      )
    },
    onError: handleApiError,
  })

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

      {!isEditable && (
        <Alert>
          <Lock className='size-4' />
          <AlertTitle>Oferta congelada</AlertTitle>
          <AlertDescription>
            El comicio fue oficializado. Las operaciones de alta, baja y
            modificación están bloqueadas (HTTP 409).
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

      <ConfiguracionDatosCandidatoPanel
        idEleccion={idEleccion}
        isEditable={isEditable}
      />

      <div className='flex flex-wrap gap-2'>
        <Button
          onClick={() => setListaDialogOpen(true)}
          disabled={!isEditable}
          aria-label='Crear nueva lista electoral'
        >
          <Plus className='me-2 size-4' />
          Nueva lista
        </Button>
        <Button
          variant='outline'
          onClick={() => oficializarMutation.mutate()}
          disabled={!isEditable || oficializarMutation.isPending}
        >
          Oficializar comicio
        </Button>
      </div>

      {listasQuery.isLoading && (
        <p className='text-muted-foreground text-sm'>Cargando listas…</p>
      )}

      <div className='grid gap-4'>
        {(listasQuery.data ?? []).map((lista) => (
          <Card key={lista.idLista}>
            <CardHeader className='flex flex-row items-start justify-between gap-4 space-y-0'>
              <div className='flex flex-col gap-1'>
                <CardTitle className='flex flex-wrap items-center gap-2 text-lg'>
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
                  {(lista.candidatos ?? []).length} candidato
                  {(lista.candidatos ?? []).length === 1 ? '' : 's'} · Estado:{' '}
                  {lista.estado}
                  {lista.listId != null ? ` · list_id: ${lista.listId}` : ''}
                </CardDescription>
              </div>
              <div className='flex gap-2'>
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
                  onClick={() => eliminarListaMutation.mutate(lista.idLista)}
                  aria-label={`Eliminar lista ${lista.nombre}`}
                >
                  <Trash2 className='size-4 text-destructive' />
                </Button>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {mapeoQuery.data && mapeoQuery.data.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Mapeo list_id (Web3)</CardTitle>
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
        onOpenChange={setListaDialogOpen}
        onSubmit={async (values) => {
          await crearListaMutation.mutateAsync(values)
        }}
      />
    </div>
  )
}
