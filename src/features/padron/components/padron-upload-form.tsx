import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { isAxiosError } from 'axios'
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  FileCheck2,
  FileDown,
  Loader2,
  UploadCloud,
  Upload,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { descargarReporteNovedades } from '../lib/descargar-reporte'
import { useElecciones } from '../hooks/use-elecciones'
import {
  useImportarPadron,
  type ImportarPadronResponse,
} from '../hooks/use-importar-padron'

const formSchema = z.object({
  idEleccion: z
    .number({ error: 'Ingrese el ID de la elección.' })
    .int('El ID debe ser un número entero.')
    .positive('El ID debe ser un número positivo.'),
  archivo: z
    .instanceof(File, { error: 'Seleccione un archivo CSV.' })
    .refine(
      (file) => file.name.toLowerCase().endsWith('.csv'),
      'El archivo debe tener extensión .csv'
    ),
})

type PadronUploadValues = z.infer<typeof formSchema>

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** Extrae el mensaje de error del backend NestJS ({ message, error, statusCode }). */
function extraerMensajeError(error: unknown): string {
  if (isAxiosError(error)) {
    const message = error.response?.data?.message as string | string[] | undefined
    if (Array.isArray(message)) return message.join(' ')
    if (typeof message === 'string' && message.length > 0) return message
  }
  return 'Ocurrió un error al importar el padrón. Verifique la conexión.'
}

interface PadronUploadFormProps {
  /** Si se provee, el comicio queda fijo y se oculta el selector. */
  idEleccionFijo?: number
  /** Se invoca tras una importación exitosa con el resultado (totales + novedades). */
  onImported?: (resultado: ImportarPadronResponse) => void
}

export function PadronUploadForm({
  idEleccionFijo,
  onImported,
}: PadronUploadFormProps = {}) {
  const [resultado, setResultado] = useState<ImportarPadronResponse | null>(
    null
  )
  const [mensajeError, setMensajeError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const comicioFijo = idEleccionFijo !== undefined
  const { data: elecciones, isLoading: cargandoElecciones } = useElecciones({
    enabled: !comicioFijo,
  })
  const importarPadron = useImportarPadron()

  const form = useForm<PadronUploadValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { idEleccion: idEleccionFijo },
  })

  function onSubmit(values: PadronUploadValues) {
    setResultado(null)
    setMensajeError(null)
    importarPadron.mutate(values, {
      onSuccess: (data) => {
        setResultado(data)
        const detalleOmitidos =
          data.totalOmitidos > 0
            ? ` (${data.totalOmitidos} omitidas).`
            : '.'
        toast.success(
          `Se importaron ${data.totalImportados} identidades${detalleOmitidos}`
        )
        form.reset({ idEleccion: idEleccionFijo })
        onImported?.(data)
      },
      onError: (error) => {
        const mensaje = extraerMensajeError(error)
        setMensajeError(mensaje)
        toast.error(mensaje)
      },
    })
  }

  const isLoading = importarPadron.isPending

  return (
    <Form {...form}>
      {!resultado && (
        <form onSubmit={form.handleSubmit(onSubmit)} className='grid gap-4'>
        {!comicioFijo && (
          <FormField
            control={form.control}
            name='idEleccion'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Comicio</FormLabel>
                <Select
                  value={field.value ? field.value.toString() : ''}
                  onValueChange={(value) => field.onChange(Number(value))}
                  disabled={cargandoElecciones}
                >
                  <FormControl>
                    <SelectTrigger className='w-full'>
                      <SelectValue
                        placeholder={
                          cargandoElecciones
                            ? 'Cargando comicios...'
                            : 'Seleccione un comicio'
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {elecciones?.map((eleccion) => (
                      <SelectItem
                        key={eleccion.idEleccion}
                        value={eleccion.idEleccion.toString()}
                        disabled={eleccion.estado !== 'BORRADOR'}
                      >
                        {eleccion.nombre} · {eleccion.estado}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Sólo los comicios en estado BORRADOR admiten carga de padrón.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name='archivo'
          render={({ field: { value, onChange, ref, name, onBlur } }) => (
            <FormItem>
              <FormLabel>Archivo CSV del padrón</FormLabel>
              <FormControl>
                <label
                  htmlFor='padron-file'
                  onDragOver={(event) => {
                    event.preventDefault()
                    setIsDragging(true)
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(event) => {
                    event.preventDefault()
                    setIsDragging(false)
                    const dropped = event.dataTransfer.files?.[0]
                    if (dropped) onChange(dropped)
                  }}
                  className={cn(
                    'flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors',
                    isDragging
                      ? 'border-primary bg-primary/5'
                      : 'border-input hover:bg-accent/40',
                    value && 'border-green-500/50 bg-green-500/5 hover:bg-green-500/10'
                  )}
                >
                  {value ? (
                    <div className='flex w-full items-center gap-3'>
                      <FileCheck2 className='h-8 w-8 shrink-0 text-green-600' />
                      <div className='min-w-0 flex-1 text-left'>
                        <p className='truncate font-medium'>{value.name}</p>
                        <p className='text-xs text-muted-foreground'>
                          {formatBytes(value.size)} · listo para importar
                        </p>
                      </div>
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        className='shrink-0'
                        aria-label='Quitar archivo'
                        onClick={(event) => {
                          event.preventDefault()
                          event.stopPropagation()
                          onChange(undefined)
                        }}
                      >
                        <X className='h-4 w-4' />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <UploadCloud className='h-8 w-8 text-muted-foreground' />
                      <div>
                        <p className='font-medium'>
                          Haga clic o arrastre el archivo aquí
                        </p>
                        <p className='text-xs text-muted-foreground'>
                          Sólo archivos .csv
                        </p>
                      </div>
                    </>
                  )}
                  <input
                    id='padron-file'
                    type='file'
                    accept='.csv'
                    className='sr-only'
                    name={name}
                    ref={ref}
                    onBlur={onBlur}
                    onChange={(event) => onChange(event.target.files?.[0])}
                  />
                </label>
              </FormControl>
              <FormDescription>
                Columnas requeridas: <code>dni</code>, <code>email</code>.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type='submit' disabled={isLoading} className='w-fit'>
          {isLoading ? <Loader2 className='animate-spin' /> : <Upload />}
          Importar padrón
        </Button>
        </form>
      )}

      {mensajeError && (
        <div className='mt-2 flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4'>
          <AlertCircle className='mt-0.5 h-5 w-5 shrink-0 text-destructive' />
          <div>
            <p className='font-medium text-destructive'>
              No se pudo importar el padrón
            </p>
            <p className='text-sm text-muted-foreground'>{mensajeError}</p>
          </div>
        </div>
      )}

      {resultado && (
        <div className='space-y-3'>
          <div className='flex items-center gap-3 rounded-lg border border-green-500/30 bg-green-500/10 p-4'>
            <CheckCircle2 className='h-6 w-6 shrink-0 text-green-600' />
            <div>
              <p className='font-medium text-green-700 dark:text-green-400'>
                {resultado.totalImportados} importados ·{' '}
                {resultado.totalOmitidos} omitidos de{' '}
                {resultado.totalProcesados} procesados
              </p>
              <p className='text-sm text-muted-foreground'>
                {resultado.idPadron
                  ? `Padrón #${resultado.idPadron} · Elección #${resultado.idEleccion} · Estado ${resultado.estado}`
                  : `Elección #${resultado.idEleccion} · No se generó padrón (sin identidades válidas)`}
              </p>
            </div>
          </div>

          {resultado.novedades.length > 0 && (
            <Collapsible className='rounded-lg border border-amber-500/30 bg-amber-500/5'>
              <div className='flex items-center justify-between gap-3 p-3'>
                <CollapsibleTrigger asChild>
                  <button
                    type='button'
                    className='group flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-400'
                  >
                    <ChevronDown className='h-4 w-4 transition-transform group-data-[state=open]:rotate-180' />
                    Ver detalle de novedades ({resultado.novedades.length})
                  </button>
                </CollapsibleTrigger>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => descargarReporteNovedades(resultado)}
                >
                  <FileDown className='h-4 w-4' />
                  Descargar reporte (.log)
                </Button>
              </div>
              <CollapsibleContent>
                <ul className='max-h-48 space-y-1 overflow-auto border-t border-amber-500/20 px-3 py-2 text-sm text-muted-foreground'>
                  {resultado.novedades.map((novedad) => (
                    <li
                      key={novedad.linea}
                      className='border-b border-border/40 py-1 last:border-b-0'
                    >
                      {novedad.motivo}
                    </li>
                  ))}
                </ul>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      )}
    </Form>
  )
}
