import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
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
import {
  getApiErrorMessage,
  getApiStructuredFieldErrors,
  isValidationError,
} from '@/lib/api-client'
import { crearEleccion } from '@/features/eleccion/api/eleccion-api'
import { CreateComicioTipoVotacionField } from '@/features/eleccion/components/create-comicio-tipo-votacion-field'
import {
  createComicioSchema,
  type CreateComicioInput,
} from '@/features/eleccion/data/schema'
import { MetodosAutenticacionField } from '@/features/eleccion/configuracion-comicio/components/metodos-autenticacion-field'
import { TIPOS_VOTACION } from '@/features/eleccion/lista/data/schema'
import { RolesCandidatoField } from '@/features/eleccion/lista/components/roles-candidato-field'

type CreateComicioFormProps = {
  onCreated: (idEleccion: number) => void
}

const defaultRol = { nombre: '', maximoPostulantes: 1 }

const mapApiErrorsToForm = (
  errors: { field: string; message: string }[],
  setError: ReturnType<typeof useForm<CreateComicioInput>>['setError'],
) => {
  for (const error of errors) {
    if (
      error.field === 'fechaInicio' ||
      error.field === 'fechaFin' ||
      error.field === 'roles' ||
      error.field === 'metodosAutenticacion'
    ) {
      setError(error.field, { message: error.message })
    }
  }
}

export const CreateComicioForm = ({ onCreated }: CreateComicioFormProps) => {
  const form = useForm<CreateComicioInput>({
    resolver: zodResolver(createComicioSchema),
    defaultValues: {
      nombre: '',
      descripcion: '',
      fechaInicio: '',
      fechaFin: '',
      tipoVotacion: TIPOS_VOTACION.POR_LISTA,
      roles: [{ ...defaultRol }],
      metodosAutenticacion: [],
    },
  })

  const handleSubmit = async (values: CreateComicioInput) => {
    try {
      const eleccion = await crearEleccion(values)
      toast.success(
        `Comicio creado (ID ${eleccion.idEleccion}, estado ${eleccion.estado})`,
      )
      onCreated(eleccion.idEleccion)
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
        className='space-y-10'
        aria-label='Formulario de creación de comicio'
      >
        <section className='space-y-6' aria-labelledby='comicio-datos-heading'>
          <h2 id='comicio-datos-heading' className='text-lg font-semibold'>
            Datos generales
          </h2>
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
                  <Textarea rows={3} className='min-h-24 resize-y' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className='grid gap-6 lg:grid-cols-2'>
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
                const fechaInicio = form.watch('fechaInicio')
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

        <section
          className='space-y-6'
          aria-labelledby='comicio-modalidad-heading'
        >
          <h2 id='comicio-modalidad-heading' className='text-lg font-semibold'>
            Modalidad electoral
          </h2>
          <CreateComicioTipoVotacionField control={form.control} />
          <RolesCandidatoField control={form.control} />
        </section>

        <section className='space-y-6' aria-labelledby='comicio-auth-heading'>
          <h2 id='comicio-auth-heading' className='text-lg font-semibold'>
            Acceso de votantes
          </h2>
          <MetodosAutenticacionField control={form.control} />
        </section>

        <Button type='submit' disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Guardando…' : 'Crear comicio'}
        </Button>
      </form>
    </Form>
  )
}
