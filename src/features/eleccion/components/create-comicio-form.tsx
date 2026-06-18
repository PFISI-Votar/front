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
import { getApiErrorMessage } from '@/lib/api-client'
import { crearEleccion } from '../api/eleccion-api'
import { createComicioSchema, type CreateComicioInput } from '../data/schema'

type CreateComicioFormProps = {
  onCreated: (idEleccion: number) => void
}

export const CreateComicioForm = ({ onCreated }: CreateComicioFormProps) => {
  const form = useForm<CreateComicioInput>({
    resolver: zodResolver(createComicioSchema),
    defaultValues: {
      nombre: '',
      descripcion: '',
      fechaInicio: '',
      fechaFin: '',
    },
  })

  const handleSubmit = async (values: CreateComicioInput) => {
    try {
      const eleccion = await crearEleccion(values)
      toast.success(`Comicio creado (ID ${eleccion.idEleccion}, estado ${eleccion.estado})`)
      onCreated(eleccion.idEleccion)
    } catch (error) {
      toast.error(getApiErrorMessage(error))
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className='space-y-8'
        aria-label='Formulario de creación de comicio'
      >
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
        <Button type='submit' disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? 'Guardando…' : 'Crear comicio'}
        </Button>
      </form>
    </Form>
  )
}
