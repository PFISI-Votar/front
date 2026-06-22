import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  FileCheck2,
  FileDown,
  Loader2,
  UploadCloud,
  Upload,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
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
import { parseCsvPadron, CsvColumnasError } from '../lib/parse-csv-padron'
import { guardarPreview } from '../lib/preview-storage'
import { useElecciones } from '../hooks/use-elecciones'

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

/** Descarga un CSV de ejemplo con la estructura correcta del padrón. */
function descargarCsvEjemplo(): void {
  const contenido = 'dni,email\n00000000,mail@prueba.com\n'
  const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = 'padron-ejemplo.csv'
  enlace.click()
  URL.revokeObjectURL(url)
}

interface PadronUploadFormProps {
  /** Si se provee, el comicio queda fijo y se oculta el selector. */
  idEleccionFijo?: number
}

export function PadronUploadForm({
  idEleccionFijo,
}: PadronUploadFormProps = {}) {
  const [isDragging, setIsDragging] = useState(false)
  const [procesando, setProcesando] = useState(false)
  const comicioFijo = idEleccionFijo !== undefined
  const { data: elecciones, isLoading: cargandoElecciones } = useElecciones({
    enabled: !comicioFijo,
  })
  const navigate = useNavigate()

  const form = useForm<PadronUploadValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { idEleccion: idEleccionFijo },
  })

  async function onSubmit(values: PadronUploadValues) {
    setProcesando(true)
    try {
      const texto = await values.archivo.text()
      const registros = parseCsvPadron(texto)
      if (registros.length === 0) {
        toast.error('El archivo CSV no contiene registros.')
        return
      }
      guardarPreview(values.idEleccion, registros)
      await navigate({
        to: '/comicios/$idEleccion/padron/preview',
        params: { idEleccion: String(values.idEleccion) },
      })
    } catch (error) {
      toast.error(
        error instanceof CsvColumnasError
          ? error.message
          : 'No se pudo leer el archivo CSV.',
      )
    } finally {
      setProcesando(false)
    }
  }

  return (
    <Form {...form}>
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

        <div className='flex items-center justify-between gap-3'>
          <Button type='submit' disabled={procesando} className='w-fit'>
            {procesando ? <Loader2 className='animate-spin' /> : <Upload />}
            Previsualizar padrón
          </Button>
          <Button
            type='button'
            variant='outline'
            className='w-fit'
            onClick={descargarCsvEjemplo}
          >
            <FileDown />
            Descargar CSV ejemplo
          </Button>
        </div>
      </form>
    </Form>
  )
}
