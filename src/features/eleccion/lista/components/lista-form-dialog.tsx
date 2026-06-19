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
import { createListaSchema, type CreateListaInput, type Lista } from '@/features/eleccion/lista/data/schema'

const EMPTY_VALUES: CreateListaInput = {
  nombre: '',
  sigla: '',
  color: '#2563eb',
}

type ListaFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: CreateListaInput) => Promise<void>
  lista?: Lista | null
}

const toFormValues = (lista?: Lista | null): CreateListaInput => {
  if (!lista) {
    return EMPTY_VALUES
  }
  return {
    nombre: lista.nombre,
    sigla: lista.sigla,
    color: lista.color ?? '#2563eb',
  }
}

export const ListaFormDialog = ({
  open,
  onOpenChange,
  onSubmit,
  lista,
}: ListaFormDialogProps) => {
  const isEditMode = lista != null

  const form = useForm<CreateListaInput>({
    resolver: zodResolver(createListaSchema),
    defaultValues: EMPTY_VALUES,
  })

  useEffect(() => {
    if (open) {
      form.reset(toFormValues(lista))
    }
  }, [open, lista, form])

  const handleSubmit = async (values: CreateListaInput) => {
    await onSubmit(values)
    form.reset(EMPTY_VALUES)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Editar lista electoral' : 'Nueva lista electoral'}
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
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='sigla'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sigla</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='color'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <Input type='color' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type='submit' disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? 'Guardando…'
                  : isEditMode
                    ? 'Guardar cambios'
                    : 'Crear lista'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
