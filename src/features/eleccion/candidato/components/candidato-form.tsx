import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  getApiErrorMessage,
  getApiFieldErrors,
  isConflictError,
} from '@/lib/api-client'
import { resolveMediaUrl } from '@/lib/media-url'
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
import { CandidatoCamposDinamicos } from '@/features/eleccion/candidato/components/candidato-campos-dinamicos'
import { CandidatoCategoriaField } from '@/features/eleccion/candidato/components/candidato-categoria-field'
import {
  createCandidatoFormSchema,
  type CampoCandidatoDefinicion,
  type Candidato,
  type CreateCandidatoInput,
} from '@/features/eleccion/candidato/data/schema'
import { getCategoriasDisponibles } from '@/features/eleccion/candidato/utils/categorias-disponibles'
import { mapApiFieldErrorsToForm } from '@/features/eleccion/candidato/utils/map-api-field-errors-to-form'
import type { CategoriaElectoral } from '@/features/eleccion/categoria/data/schema'
import {
  IMAGE_FILE_REQUIREMENTS,
  validateElectoralImageFile,
} from '@/features/eleccion/shared/utils/image-file'

type CandidatoFormProps = {
  categorias: CategoriaElectoral[]
  candidatosEnLista: Pick<Candidato, 'idCategoria' | 'idCandidato'>[]
  candidatosEnComicio: Pick<Candidato, 'idCandidato' | 'datosAdicionales'>[]
  excludeCandidatoId?: number
  camposConfig: CampoCandidatoDefinicion[]
  defaultValues?: CreateCandidatoInput
  currentFotoUrl?: string | null
  submitLabel: string
  onSubmit: (values: CreateCandidatoInput) => Promise<void>
  onConflictError?: (message: string) => void
}

const buildDefaultDatosAdicionales = (
  campos: CampoCandidatoDefinicion[],
  existing?: Record<string, unknown>
): Record<string, unknown> => {
  const datos: Record<string, unknown> = { ...existing }
  for (const campo of campos) {
    if (datos[campo.clave] !== undefined) {
      continue
    }
    if (campo.tipo === 'booleano') {
      datos[campo.clave] = false
    } else if (campo.tipo === 'numero') {
      datos[campo.clave] = ''
    } else {
      datos[campo.clave] = ''
    }
  }
  return datos
}

const buildDefaultValues = (
  categoriasDisponibles: CategoriaElectoral[],
  camposConfig: CampoCandidatoDefinicion[],
  values?: CreateCandidatoInput
): CreateCandidatoInput =>
  values ?? {
    nombre: '',
    apellido: '',
    idCategoria: categoriasDisponibles[0]?.idCategoria ?? 0,
    orden: 1,
    datosAdicionales: buildDefaultDatosAdicionales(camposConfig),
  }

export const CandidatoForm = ({
  categorias,
  candidatosEnLista,
  candidatosEnComicio,
  excludeCandidatoId,
  camposConfig,
  defaultValues,
  currentFotoUrl,
  submitLabel,
  onSubmit,
  onConflictError,
}: CandidatoFormProps) => {
  const [fotoPreview, setFotoPreview] = useState<string | undefined>(
    resolveMediaUrl(currentFotoUrl)
  )
  const [fotoError, setFotoError] = useState<string | null>(null)
  const categoriasDisponibles = useMemo(
    () =>
      getCategoriasDisponibles(categorias, candidatosEnLista, {
        excludeCandidatoId,
        includeCategoriaId: defaultValues?.idCategoria,
      }),
    [
      categorias,
      candidatosEnLista,
      excludeCandidatoId,
      defaultValues?.idCategoria,
    ]
  )

  const schema = useMemo(
    () =>
      createCandidatoFormSchema({
        camposConfig,
        candidatosEnComicio,
        excludeCandidatoId,
      }),
    [camposConfig, candidatosEnComicio, excludeCandidatoId]
  )

  const form = useForm<CreateCandidatoInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      ...buildDefaultValues(categoriasDisponibles, camposConfig, defaultValues),
      fotoFile: null,
      removeFoto: false,
      datosAdicionales: buildDefaultDatosAdicionales(
        camposConfig,
        defaultValues?.datosAdicionales
      ),
    },
  })

  useEffect(() => {
    setFotoPreview(resolveMediaUrl(currentFotoUrl))
    setFotoError(null)
  }, [currentFotoUrl])

  useEffect(() => {
    return () => {
      if (fotoPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(fotoPreview)
      }
    }
  }, [fotoPreview])

  const handleFotoChange = (file?: File) => {
    if (fotoPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(fotoPreview)
    }
    if (!file) {
      form.setValue('fotoFile', null)
      setFotoPreview(resolveMediaUrl(currentFotoUrl))
      setFotoError(null)
      return
    }

    const validationError = validateElectoralImageFile(file)
    if (validationError) {
      form.setValue('fotoFile', null)
      setFotoPreview(resolveMediaUrl(currentFotoUrl))
      setFotoError(validationError)
      return
    }

    form.setValue('fotoFile', file)
    form.setValue('removeFoto', false)
    setFotoPreview(URL.createObjectURL(file))
    setFotoError(null)
  }

  const handleRemoveFoto = () => {
    if (fotoPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(fotoPreview)
    }
    form.setValue('fotoFile', null)
    form.setValue('removeFoto', Boolean(currentFotoUrl))
    setFotoPreview(undefined)
    setFotoError(null)
  }

  const handleSubmit = async (values: CreateCandidatoInput) => {
    if (categorias.length === 0) {
      toast.error('No hay categorías configuradas para este comicio')
      return
    }
    if (!values.idCategoria) {
      toast.error('Seleccione la categoría electoral del candidato')
      return
    }
    if (categoriasDisponibles.length === 0) {
      toast.error(
        'Todas las categorías ya alcanzaron su cupo máximo en esta lista'
      )
      return
    }
    if (fotoError) {
      return
    }
    try {
      await onSubmit(values)
    } catch (error) {
      if (isConflictError(error)) {
        onConflictError?.(getApiErrorMessage(error))
        return
      }
      const fieldErrors = getApiFieldErrors(error)
      if (fieldErrors.length > 0) {
        mapApiFieldErrorsToForm(fieldErrors, form.setError)
        return
      }
      toast.error(getApiErrorMessage(error))
    }
  }

  const canSubmit =
    categorias.length > 0 &&
    categoriasDisponibles.length > 0 &&
    Boolean(form.watch('idCategoria')) &&
    !fotoError

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className='flex flex-col gap-8'
        aria-label='Formulario de candidato'
      >
        {categorias.length === 0 ? (
          <p className='text-sm text-destructive' role='alert'>
            Este comicio no tiene categorías electorales. Configúrelas en la
            oferta electoral antes de registrar candidatos.
          </p>
        ) : (
          <CandidatoCategoriaField
            control={form.control}
            categoriasDisponibles={categoriasDisponibles}
          />
        )}
        <div className='grid gap-4 sm:grid-cols-2'>
          <FormField
            control={form.control}
            name='nombre'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input {...field} required />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='apellido'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Apellido</FormLabel>
                <FormControl>
                  <Input {...field} required />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className='grid gap-3 rounded-lg border border-dashed p-3'>
          <div className='flex items-start justify-between gap-3'>
            <div>
              <FormLabel>Fotografía del candidato</FormLabel>
              <p className='mt-4 text-xs text-muted-foreground'>
                <span>{IMAGE_FILE_REQUIREMENTS}</span>
                <span className='block'>Se normaliza a 400x400 px.</span>
              </p>
            </div>
            {fotoPreview && (
              <Button
                type='button'
                variant='ghost'
                size='sm'
                onClick={handleRemoveFoto}
              >
                Quitar
              </Button>
            )}
          </div>
          {fotoPreview ? (
            <img
              src={fotoPreview}
              alt='Vista previa de la fotografía del candidato'
              className='size-32 rounded-xl border bg-muted object-cover'
            />
          ) : (
            <div className='grid size-32 place-items-center rounded-xl border bg-muted text-center text-sm text-muted-foreground'>
              Sin foto
            </div>
          )}
          <Input
            type='file'
            accept='image/png,image/jpeg,.png,.jpg,.jpeg'
            onChange={(event) => handleFotoChange(event.target.files?.[0])}
          />
          {fotoError && (
            <p className='text-sm text-destructive' role='alert'>
              {fotoError}
            </p>
          )}
        </div>
        <CandidatoCamposDinamicos
          control={form.control}
          campos={camposConfig}
        />
        <Button
          type='submit'
          disabled={form.formState.isSubmitting || !canSubmit}
        >
          {form.formState.isSubmitting ? 'Guardando…' : submitLabel}
        </Button>
      </form>
    </Form>
  )
}
