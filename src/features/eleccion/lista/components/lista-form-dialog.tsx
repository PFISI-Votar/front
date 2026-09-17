import { useEffect, useState } from 'react'
import { AxiosError } from 'axios'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { getApiErrorMessage } from '@/lib/api-client'
import { resolveMediaUrl } from '@/lib/media-url'
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
  createListaSchema,
  type CreateListaInput,
  type Lista,
} from '@/features/eleccion/lista/data/schema'
import {
  IMAGE_FILE_REQUIREMENTS,
  formatRejectedImageError,
  isElectoralImageRejectionMessage,
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

type ListaFormDialogContentProps = {
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

const ListaFormDialogContent = ({
  onOpenChange,
  onSubmit,
  lista,
}: ListaFormDialogContentProps) => {
  const isEditMode = lista != null
  const [localLogoPreview, setLocalLogoPreview] = useState<string | null>(null)
  const [hasRemovedLogo, setHasRemovedLogo] = useState(false)
  const [logoError, setLogoError] = useState<string | null>(null)
  const [logoInputKey, setLogoInputKey] = useState(0)

  const form = useForm<CreateListaInput>({
    resolver: zodResolver(createListaSchema),
    defaultValues: toFormValues(lista),
  })

  const nombreLista = useWatch({
    control: form.control,
    name: 'nombre',
  })

  const logoPreview =
    localLogoPreview ??
    (hasRemovedLogo ? undefined : resolveMediaUrl(lista?.logoUrl))

  useEffect(() => {
    return () => {
      if (localLogoPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(localLogoPreview)
      }
    }
  }, [localLogoPreview])

  const keepsPreviousLogo = () =>
    Boolean(form.getValues('logoFile')) ||
    Boolean(lista?.logoUrl && !hasRemovedLogo)

  const handleLogoChange = async (file?: File, input?: HTMLInputElement) => {
    if (!file) {
      if (localLogoPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(localLogoPreview)
      }
      form.setValue('logoFile', null)
      setLocalLogoPreview(null)
      setHasRemovedLogo(false)
      setLogoError(null)
      return
    }

    const validationError = await validateElectoralImageFile(file)
    if (validationError) {
      if (input) input.value = ''
      setLogoError(
        formatRejectedImageError(validationError, keepsPreviousLogo())
      )
      return
    }

    if (localLogoPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(localLogoPreview)
    }
    form.setValue('logoFile', file)
    form.setValue('removeLogo', false)
    setHasRemovedLogo(false)
    setLocalLogoPreview(URL.createObjectURL(file))
    setLogoError(null)
  }

  const handleRemoveLogo = () => {
    if (localLogoPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(localLogoPreview)
    }
    form.setValue('logoFile', null)
    form.setValue('removeLogo', Boolean(lista?.logoUrl))
    setLocalLogoPreview(null)
    setHasRemovedLogo(true)
    setLogoError(null)
  }

  const handleSubmit = async (values: CreateListaInput) => {
    try {
      await onSubmit(values)
      onOpenChange(false)
    } catch (error) {
      const message = getApiErrorMessage(error)
      if (
        error instanceof AxiosError &&
        error.response?.status === 400 &&
        values.logoFile &&
        isElectoralImageRejectionMessage(message)
      ) {
        setLogoInputKey((key) => key + 1)
        if (localLogoPreview?.startsWith('blob:')) {
          URL.revokeObjectURL(localLogoPreview)
        }
        form.setValue('logoFile', null)
        setLocalLogoPreview(null)
        setLogoError(
          formatRejectedImageError(
            message,
            Boolean(lista?.logoUrl && !hasRemovedLogo)
          )
        )
        return
      }
      throw error
    }
  }

  return (
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
                <p className='mt-4 text-xs text-muted-foreground'>
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
                alt={`Logotipo de ${nombreLista || 'la lista'}`}
                className='h-28 w-full rounded-md border bg-muted object-cover'
              />
            ) : (
              <div className='grid h-28 place-items-center rounded-md border bg-muted text-sm text-muted-foreground'>
                Sin logotipo
              </div>
            )}
            <Input
              key={logoInputKey}
              type='file'
              accept='image/png,image/jpeg,.png,.jpg,.jpeg'
              onChange={(event) => {
                void handleLogoChange(
                  event.target.files?.[0],
                  event.currentTarget
                )
              }}
            />
            {logoError && (
              <p className='text-sm text-destructive' role='alert'>
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
  )
}

export const ListaFormDialog = ({
  open,
  onOpenChange,
  onSubmit,
  lista,
}: ListaFormDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {open ? (
        <ListaFormDialogContent
          key={lista?.idLista ?? 'create'}
          lista={lista}
          onOpenChange={onOpenChange}
          onSubmit={onSubmit}
        />
      ) : null}
    </Dialog>
  )
}
