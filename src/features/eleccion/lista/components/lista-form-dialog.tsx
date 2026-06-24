import { useEffect, useState } from 'react'
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
import { resolveMediaUrl } from '@/lib/media-url'
import { createListaSchema, type CreateListaInput, type Lista } from '@/features/eleccion/lista/data/schema'
import {
  IMAGE_FILE_REQUIREMENTS,
  validateElectoralImageFile,
} from '@/features/eleccion/shared/utils/image-file'

const EMPTY_VALUES: CreateListaInput = {
  nombre: '',
  sigla: '',
  color: '#2563eb',
  logoFile: null,
  removeLogo: false,
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
  const [logoPreview, setLogoPreview] = useState<string | undefined>()
  const [logoError, setLogoError] = useState<string | null>(null)

  const form = useForm<CreateListaInput>({
    resolver: zodResolver(createListaSchema),
    defaultValues: EMPTY_VALUES,
  })

  useEffect(() => {
    if (open) {
      form.reset(toFormValues(lista))
      setLogoPreview(resolveMediaUrl(lista?.logoUrl))
      setLogoError(null)
    }
  }, [open, lista, form])

  useEffect(() => {
    return () => {
      if (logoPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(logoPreview)
      }
    }
  }, [logoPreview])

  const handleLogoChange = (file?: File) => {
    if (logoPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(logoPreview)
    }
    if (!file) {
      form.setValue('logoFile', null)
      setLogoPreview(resolveMediaUrl(lista?.logoUrl))
      setLogoError(null)
      return
    }

    const validationError = validateElectoralImageFile(file)
    if (validationError) {
      form.setValue('logoFile', null)
      setLogoPreview(resolveMediaUrl(lista?.logoUrl))
      setLogoError(validationError)
      return
    }

    form.setValue('logoFile', file)
    form.setValue('removeLogo', false)
    setLogoPreview(URL.createObjectURL(file))
    setLogoError(null)
  }

  const handleRemoveLogo = () => {
    if (logoPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(logoPreview)
    }
    form.setValue('logoFile', null)
    form.setValue('removeLogo', Boolean(lista?.logoUrl))
    setLogoPreview(undefined)
    setLogoError(null)
  }

  const handleSubmit = async (values: CreateListaInput) => {
    if (logoError) {
      return
    }
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
            <div className='grid gap-3 rounded-lg border border-dashed p-3'>
              <div className='flex items-start justify-between gap-3'>
                <div>
                  <FormLabel>Logotipo de lista</FormLabel>
                  <p className='mt-4 text-muted-foreground text-xs'>
                    <span>{IMAGE_FILE_REQUIREMENTS}</span>
                    <span className='block'>Se normaliza a 800x400 px.</span>
                  </p>
                </div>
                {logoPreview && (
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={handleRemoveLogo}
                  >
                    Quitar
                  </Button>
                )}
              </div>
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt={`Logotipo de ${form.watch('nombre') || 'la lista'}`}
                  className='h-28 w-full rounded-md border bg-muted object-cover'
                />
              ) : (
                <div className='grid h-28 place-items-center rounded-md border bg-muted text-sm text-muted-foreground'>
                  Sin logotipo
                </div>
              )}
              <Input
                type='file'
                accept='image/png,image/jpeg,.png,.jpg,.jpeg'
                onChange={(event) => handleLogoChange(event.target.files?.[0])}
              />
              {logoError && (
                <p className='text-destructive text-sm' role='alert'>
                  {logoError}
                </p>
              )}
            </div>
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
