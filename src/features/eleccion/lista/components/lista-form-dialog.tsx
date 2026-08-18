import { useEffect, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { resolveMediaUrl, toSafeImageSrc } from '@/lib/media-url'
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

  const form = useForm<CreateListaInput>({
    resolver: zodResolver(createListaSchema),
    defaultValues: toFormValues(lista),
  })

  const nombreLista = useWatch({
    control: form.control,
    name: 'nombre',
  })

  const logoPreview = toSafeImageSrc(
    localLogoPreview ??
      (hasRemovedLogo ? undefined : resolveMediaUrl(lista?.logoUrl))
  )

  useEffect(() => {
    return () => {
      if (localLogoPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(localLogoPreview)
      }
    }
  }, [localLogoPreview])

  const handleLogoChange = (file?: File) => {
    if (localLogoPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(localLogoPreview)
    }
    if (!file) {
      form.setValue('logoFile', null)
      setLocalLogoPreview(null)
      setHasRemovedLogo(false)
      setLogoError(null)
      return
    }

    const validationError = validateElectoralImageFile(file)
    if (validationError) {
      form.setValue('logoFile', null)
      setLocalLogoPreview(null)
      setHasRemovedLogo(false)
      setLogoError(validationError)
      return
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
    if (logoError) {
      return
    }
    await onSubmit(values)
    onOpenChange(false)
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
            {logoPreview &&
            (logoPreview.startsWith('blob:') ||
              logoPreview.startsWith('https:') ||
              logoPreview.startsWith('http:')) ? (
              <img
                src={logoPreview.replace(/[<>]/g, '')}
                alt={`Logotipo de ${nombreLista || 'la lista'}`}
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
              <p className='text-sm text-destructive' role='alert'>
                {logoError}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type='submit'
              disabled={form.formState.isSubmitting || Boolean(logoError)}
            >
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
