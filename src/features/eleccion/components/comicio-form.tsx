import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Check, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  getApiErrorMessage,
  getApiStructuredFieldErrors,
  isValidationError,
} from '@/lib/api-client'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { DateTimePicker } from '@/components/datetime-picker'
import { CreateComicioTipoVotacionField } from '@/features/eleccion/components/create-comicio-tipo-votacion-field'
import { MetodosAutenticacionField } from '@/features/eleccion/configuracion-comicio/components/metodos-autenticacion-field'
import {
  createComicioSchema,
  type CreateComicioInput,
  type Eleccion,
} from '@/features/eleccion/data/schema'
import { TIPOS_VOTACION } from '@/features/eleccion/lista/data/schema'

type ComicioFormProps = {
  mode: 'create' | 'edit'
  defaultValues?: Eleccion
  submitLabel: string
  onSubmit: (values: CreateComicioInput) => Promise<void>
  onCancel: () => void
}

const mapApiErrorsToForm = (
  errors: { field: string; message: string }[],
  setError: ReturnType<typeof useForm<CreateComicioInput>>['setError']
) => {
  for (const error of errors) {
    if (
      error.field === 'fechaInicio' ||
      error.field === 'fechaFin' ||
      error.field === 'metodosAutenticacion'
    ) {
      setError(error.field, { message: error.message })
    }
  }
}

const buildFormDefaults = (
  mode: ComicioFormProps['mode'],
  eleccion?: Eleccion
): CreateComicioInput => {
  if (mode === 'edit' && eleccion) {
    return {
      nombre: eleccion.nombre,
      descripcion: eleccion.descripcion ?? '',
      fechaInicio: eleccion.fechaInicio,
      fechaFin: eleccion.fechaFin,
      tipoVotacion: eleccion.tipoVotacion,
      metodosAutenticacion: eleccion.metodosAutenticacion,
    }
  }
  return {
    nombre: '',
    descripcion: '',
    fechaInicio: '',
    fechaFin: '',
    tipoVotacion: TIPOS_VOTACION.POR_LISTA,
    metodosAutenticacion: [],
  }
}

export const ComicioForm = ({
  mode,
  defaultValues,
  submitLabel,
  onSubmit,
  onCancel,
}: ComicioFormProps) => {
  const form = useForm<CreateComicioInput>({
    resolver: zodResolver(createComicioSchema),
    defaultValues: buildFormDefaults(mode, defaultValues),
  })

  const fechaInicio = useWatch({
    control: form.control,
    name: 'fechaInicio',
  })

  const handleSubmit = async (values: CreateComicioInput) => {
    try {
      await onSubmit(values)
    } catch (error) {
      if (isValidationError(error)) {
        const fieldErrors = getApiStructuredFieldErrors(error)
        if (fieldErrors.length > 0) {
          mapApiErrorsToForm(fieldErrors, form.setError)
        }
      }
      toast.error(getApiErrorMessage(error))
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className='space-y-8'
        aria-label={
          mode === 'create'
            ? 'Formulario de creación de comicio'
            : 'Formulario de edición de comicio'
        }
      >
        <section className='space-y-6' aria-labelledby='comicio-datos-heading'>
          <h2 id='comicio-datos-heading' className='text-lg font-semibold'>
            Datos generales
          </h2>
          <div className='grid gap-6 lg:grid-cols-2'>
            <FormField
              control={form.control}
              name='nombre'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input
                      className='h-10'
                      placeholder='Elección CEUTI 2026'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='descripcion'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      className='min-h-24 resize-y'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='fechaInicio'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apertura</FormLabel>
                  <FormControl>
                    <DateTimePicker
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      minDate={new Date()}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='fechaFin'
              render={({ field }) => {
                const minDate = fechaInicio ? new Date(fechaInicio) : undefined

                return (
                  <FormItem>
                    <FormLabel>Cierre</FormLabel>
                    <FormControl>
                      <DateTimePicker
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        minDate={minDate}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )
              }}
            />
          </div>
        </section>

        <div className='grid gap-8 lg:grid-cols-2'>
          <section
            className='space-y-6'
            aria-labelledby='comicio-modalidad-heading'
          >
            <h2
              id='comicio-modalidad-heading'
              className='text-lg font-semibold'
            >
              Modalidad electoral
            </h2>
            <CreateComicioTipoVotacionField control={form.control} />
            {mode === 'create' && (
              <p className='text-sm text-muted-foreground'>
                Las categorías electorales (cargos a cubrir) se configuran en la
                oferta electoral después de crear el comicio.
              </p>
            )}
          </section>

          <section className='space-y-6' aria-labelledby='comicio-auth-heading'>
            <h2 id='comicio-auth-heading' className='text-lg font-semibold'>
              Acceso de votantes
            </h2>
            <MetodosAutenticacionField control={form.control} />
          </section>
        </div>

        <div className='flex flex-wrap gap-2'>
          <Button
            type='button'
            variant='outline'
            onClick={onCancel}
            disabled={form.formState.isSubmitting}
          >
            <X />
            Cancelar
          </Button>
          <Button type='submit' disabled={form.formState.isSubmitting}>
            <Check />
            {form.formState.isSubmitting ? 'Guardando…' : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  )
}
