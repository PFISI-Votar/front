import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  createCategoriaSchema,
  type CreateCategoriaInput,
  type Categoria,
} from '@/features/eleccion/categoria/data/schema'

const EMPTY_VALUES: CreateCategoriaInput = {
  nombre: '',
  descripcion: '',
  cantidadCargos: 1,
  orden: 1,
}

const toFormValues = (categoria?: Categoria | null): CreateCategoriaInput => {
  if (!categoria) return EMPTY_VALUES
  return {
    nombre: categoria.nombre,
    descripcion: categoria.descripcion ?? '',
    cantidadCargos: categoria.cantidadCargos,
    orden: categoria.orden,
  }
}

type CategoriaFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: CreateCategoriaInput) => Promise<void>
  categoria?: Categoria | null
}

export const CategoriaFormDialog = ({
  open,
  onOpenChange,
  onSubmit,
  categoria,
}: CategoriaFormDialogProps) => {
  const isEditMode = categoria != null

  const form = useForm<CreateCategoriaInput>({
    resolver: zodResolver(createCategoriaSchema),
    defaultValues: EMPTY_VALUES,
  })

  useEffect(() => {
    if (open) {
      form.reset(toFormValues(categoria))
    }
  }, [open, categoria, form])

  const handleSubmit = async (values: CreateCategoriaInput) => {
    await onSubmit(values)
    form.reset(EMPTY_VALUES)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Editar categoría' : 'Nueva categoría electoral'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='nombre'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder='Ej: Presidente' {...field} />
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
                  <FormLabel>Descripción <span className='text-muted-foreground'>(opcional)</span></FormLabel>
                  <FormControl>
                    <Input placeholder='Ej: Cargo principal del centro estudiantil' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='cantidadCargos'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cantidad de cargos</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        min={1}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='orden'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Orden en boleta</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        min={1}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type='submit' disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? 'Guardando…'
                  : isEditMode
                    ? 'Guardar cambios'
                    : 'Crear categoría'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}