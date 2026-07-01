import { useState } from 'react'
import { isAxiosError } from 'axios'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import {
  ArrowLeft,
  ChevronDown,
  FileDown,
  FileSpreadsheet,
  ListChecks,
  Trash2,
  Upload,
} from 'lucide-react'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/api-client'
import { formatDateTimeForDisplay } from '@/lib/datetime'
import { cn } from '@/lib/utils'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { obtenerEleccion } from '@/features/eleccion/api/eleccion-api'
import { eliminarPadron, obtenerReporteNovedades } from '../api/padron-api'
import {
  PADRON_PAGE_SIZES,
  usePadronResumen,
  usePadronVotantes,
} from '../hooks/use-padron'
import { descargarReporteNovedades } from '../lib/descargar-reporte'
import { PadronUploadForm } from './padron-upload-form'

type PadronComicioPageProps = {
  idEleccion: number
}

function esError404(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 404
}

export const PadronComicioPage = ({ idEleccion }: PadronComicioPageProps) => {
  const queryClient = useQueryClient()
  const [modalAbierto, setModalAbierto] = useState(false)
  const [tablaAbierta, setTablaAbierta] = useState(false)
  const [eliminarAbierto, setEliminarAbierto] = useState(false)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(50)
  const invalidarPadron = () => {
    queryClient.invalidateQueries({ queryKey: ['padron-resumen', idEleccion] })
    queryClient.invalidateQueries({ queryKey: ['padron-votantes', idEleccion] })
    queryClient.invalidateQueries({ queryKey: ['eleccion', idEleccion] })
    queryClient.invalidateQueries({ queryKey: ['elecciones'] })
  }

  const descargarReporteMutation = useMutation({
    mutationFn: () => obtenerReporteNovedades(idEleccion),
    onSuccess: (reporte) => descargarReporteNovedades(reporte),
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })

  const eliminarMutation = useMutation({
    mutationFn: () => eliminarPadron(idEleccion),
    onSuccess: () => {
      toast.success('Padrón eliminado correctamente.')
      setEliminarAbierto(false)
      setTablaAbierta(false)
      setPage(1)
      invalidarPadron()
    },
    onError: (error) => toast.error(getApiErrorMessage(error)),
  })

  const eleccionQuery = useQuery({
    queryKey: ['eleccion', idEleccion],
    queryFn: () => obtenerEleccion(idEleccion),
  })
  const resumenQuery = usePadronResumen(idEleccion)
  const votantesQuery = usePadronVotantes(idEleccion, page, limit, tablaAbierta)

  const esBorrador = eleccionQuery.data?.estado === 'BORRADOR'
  const sinPadron = resumenQuery.isError && esError404(resumenQuery.error)
  const puedeCargar = esBorrador && sinPadron

  const onCambiarLimit = (nuevoLimit: number) => {
    setLimit(nuevoLimit)
    setPage(1)
  }

  const totalPaginas = votantesQuery.data
    ? Math.max(1, Math.ceil(votantesQuery.data.total / limit))
    : 1

  return (
    <div className='space-y-6'>
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div className='space-y-1'>
          <Button asChild variant='ghost' size='sm' className='-ms-2'>
            <Link to='/comicios'>
              <ArrowLeft className='size-4' />
              Volver a comicios
            </Link>
          </Button>
          <h1 className='flex items-center gap-2 text-2xl font-bold tracking-tight'>
            <FileSpreadsheet className='size-6' />
            Padrón electoral
          </h1>
          <p className='text-muted-foreground'>
            {eleccionQuery.data
              ? eleccionQuery.data.nombre
              : `Comicio #${idEleccion}`}
            {eleccionQuery.data && (
              <Badge variant='outline' className='ms-2 align-middle'>
                {eleccionQuery.data.estado}
              </Badge>
            )}
          </p>
        </div>

        {puedeCargar && (
          <Dialog open={modalAbierto} onOpenChange={setModalAbierto}>
            <DialogTrigger asChild>
              <Button>
                <Upload className='size-4' />
                Cargar padrón electoral
              </Button>
            </DialogTrigger>
            <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-2xl'>
              <DialogHeader>
                <DialogTitle>Cargar padrón electoral</DialogTitle>
                <DialogDescription>
                  Las identidades se anonimizan al momento de la carga: nunca se
                  persiste el dato en texto plano.
                </DialogDescription>
              </DialogHeader>
              <PadronUploadForm idEleccionFijo={idEleccion} />
            </DialogContent>
          </Dialog>
        )}

        {esBorrador && resumenQuery.data && !sinPadron && (
          <Button
            variant='destructive'
            onClick={() => setEliminarAbierto(true)}
          >
            <Trash2 className='size-4' />
            Eliminar padrón
          </Button>
        )}
      </div>

      {resumenQuery.isLoading && (
        <Card>
          <CardHeader>
            <Skeleton className='h-5 w-48' />
            <Skeleton className='h-4 w-72' />
          </CardHeader>
          <CardContent className='grid gap-3 sm:grid-cols-2'>
            <Skeleton className='h-12' />
            <Skeleton className='h-12' />
          </CardContent>
        </Card>
      )}

      {sinPadron && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-lg'>
              <FileSpreadsheet className='size-5' />
              Aún no se cargó el padrón
            </CardTitle>
            <CardDescription>
              {esBorrador
                ? 'Use “Cargar padrón electoral” para importar la totalidad de votantes habilitados desde un archivo CSV.'
                : 'Este comicio no tiene padrón cargado y ya no está en estado BORRADOR, por lo que no admite carga.'}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {resumenQuery.isError && !sinPadron && (
        <p className='text-sm text-destructive' role='alert'>
          No se pudo cargar el resumen del padrón. Verifique que el backend esté
          en ejecución.
        </p>
      )}

      {resumenQuery.data && !sinPadron && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Resumen del padrón</CardTitle>
              <CardDescription>
                Padrón #{resumenQuery.data.idPadron} · generado el{' '}
                {formatDateTimeForDisplay(resumenQuery.data.fechaGeneracion)}
              </CardDescription>
            </CardHeader>
            <CardContent className='grid gap-4 sm:grid-cols-2'>
              <div>
                <p className='text-sm text-muted-foreground'>
                  Votantes habilitados
                </p>
                <p className='text-2xl font-semibold'>
                  {resumenQuery.data.totalVotantesHabilitados.toLocaleString(
                    'es-AR'
                  )}
                </p>
              </div>
              <div>
                <p className='text-sm text-muted-foreground'>Estado</p>
                <Badge variant='secondary'>{resumenQuery.data.estado}</Badge>
              </div>
              <div className='sm:col-span-2'>
                <p className='text-sm text-muted-foreground'>
                  Hash del padrón (Keccak-256)
                </p>
                <p
                  className='font-mono text-xs break-all'
                  title={resumenQuery.data.hashPadron}
                >
                  {resumenQuery.data.hashPadron}
                </p>
              </div>
              {resumenQuery.data.totalOmitidos > 0 && (
                <div className='flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 sm:col-span-2'>
                  <p className='text-sm'>
                    <span className='font-medium text-amber-700 dark:text-amber-400'>
                      {resumenQuery.data.totalOmitidos.toLocaleString('es-AR')}{' '}
                      registros omitidos
                    </span>{' '}
                    de{' '}
                    {resumenQuery.data.totalProcesados.toLocaleString('es-AR')}{' '}
                    procesados durante la importación.
                  </p>
                  <Button
                    variant='outline'
                    size='sm'
                    disabled={descargarReporteMutation.isPending}
                    onClick={() => descargarReporteMutation.mutate()}
                  >
                    <FileDown className='size-4' />
                    Descargar reporte de novedades
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Collapsible
            open={tablaAbierta}
            onOpenChange={setTablaAbierta}
            className='rounded-lg border'
          >
            <CollapsibleTrigger asChild>
              <Button
                variant='ghost'
                className='flex w-full items-center justify-between p-4'
              >
                <span className='flex items-center gap-2 font-medium'>
                  <ListChecks className='size-4' />
                  Ver hashes del padrón
                </span>
                <ChevronDown
                  className={cn(
                    'size-4 transition-transform',
                    tablaAbierta && 'rotate-180'
                  )}
                />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className='border-t p-4'>
              {votantesQuery.isLoading && (
                <div className='space-y-2'>
                  <Skeleton className='h-8' />
                  <Skeleton className='h-8' />
                  <Skeleton className='h-8' />
                </div>
              )}

              {votantesQuery.isError && (
                <p className='text-sm text-destructive' role='alert'>
                  No se pudieron cargar las hojas del padrón.
                </p>
              )}

              {votantesQuery.data && (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className='w-24'>Índice</TableHead>
                        <TableHead>Hash de la hoja (Keccak-256)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {votantesQuery.data.items.map((votante) => (
                        <TableRow key={votante.indiceHoja}>
                          <TableCell className='font-mono'>
                            {votante.indiceHoja}
                          </TableCell>
                          <TableCell className='font-mono text-xs break-all'>
                            {votante.hashHoja}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  <div className='mt-4 flex flex-wrap items-center justify-between gap-3'>
                    <div className='flex items-center gap-3'>
                      <p className='text-sm text-muted-foreground'>
                        Página {votantesQuery.data.page} de {totalPaginas} ·{' '}
                        {votantesQuery.data.total.toLocaleString('es-AR')} hojas
                      </p>
                      <div className='flex items-center gap-2'>
                        <span className='text-sm text-muted-foreground'>
                          Filas por página
                        </span>
                        <Select
                          value={limit.toString()}
                          onValueChange={(value) =>
                            onCambiarLimit(Number(value))
                          }
                        >
                          <SelectTrigger size='sm' className='w-20'>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PADRON_PAGE_SIZES.map((size) => (
                              <SelectItem key={size} value={size.toString()}>
                                {size}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className='flex gap-2'>
                      <Button
                        variant='outline'
                        size='sm'
                        disabled={page <= 1 || votantesQuery.isFetching}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                      >
                        Anterior
                      </Button>
                      <Button
                        variant='outline'
                        size='sm'
                        disabled={
                          page >= totalPaginas || votantesQuery.isFetching
                        }
                        onClick={() => setPage((p) => p + 1)}
                      >
                        Siguiente
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CollapsibleContent>
          </Collapsible>
        </>
      )}

      <ConfirmDialog
        open={eliminarAbierto}
        onOpenChange={setEliminarAbierto}
        destructive
        isLoading={eliminarMutation.isPending}
        title='¿Eliminar el padrón?'
        desc={
          <>
            Esta acción <strong>elimina todas las hojas del padrón</strong> (
            {resumenQuery.data?.totalVotantesHabilitados.toLocaleString(
              'es-AR'
            )}{' '}
            votantes habilitados) del comicio{' '}
            <strong>{eleccionQuery.data?.nombre}</strong>. Sólo es posible
            mientras la elección está en estado BORRADOR. Deberá volver a
            cargarse desde cero.
          </>
        }
        cancelBtnText='Cancelar'
        confirmText='Eliminar padrón'
        handleConfirm={() => eliminarMutation.mutate()}
      />
    </div>
  )
}
