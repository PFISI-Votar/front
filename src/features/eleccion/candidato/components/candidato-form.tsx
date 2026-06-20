import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { useForm } from 'react-hook-form'
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
import { getApiErrorMessage, getApiFieldErrors } from '@/lib/api-client'
import {
  CandidatoCamposDinamicos,
  mapApiFieldErrorsToForm,
} from '@/features/eleccion/candidato/components/candidato-campos-dinamicos'
import { CandidatoRolField } from '@/features/eleccion/candidato/components/candidato-rol-field'
import {
  createCandidatoSchema,
  type CampoCandidatoDefinicion,
  type Candidato,
  type CreateCandidatoInput,
} from '@/features/eleccion/candidato/data/schema'
import { getRolesDisponibles } from '@/features/eleccion/candidato/utils/roles-disponibles'
import type { RolCandidato } from '@/features/eleccion/data/schema'
import { toast } from 'sonner'

type CandidatoFormProps = {
  roles: RolCandidato[]
  candidatosEnLista: Pick<Candidato, 'idCategoria' | 'idCandidato'>[]
  excludeCandidatoId?: number
  camposConfig: CampoCandidatoDefinicion[]
  defaultValues?: CreateCandidatoInput
  submitLabel: string
  onSubmit: (values: CreateCandidatoInput) => Promise<void>
}

const buildDefaultDatosAdicionales = (
  campos: CampoCandidatoDefinicion[],
  existing?: Record<string, unknown>,
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
  rolesDisponibles: RolCandidato[],
  camposConfig: CampoCandidatoDefinicion[],
  values?: CreateCandidatoInput,
): CreateCandidatoInput =>
  values ?? {
    nombre: '',
    apellido: '',
    idCategoria:
      rolesDisponibles.length === 1 ? rolesDisponibles[0].idCategoria : 0,
    orden: 1,
    datosAdicionales: buildDefaultDatosAdicionales(camposConfig),
  }

export const CandidatoForm = ({
  roles,
  candidatosEnLista,
  excludeCandidatoId,
  camposConfig,
  defaultValues,
  submitLabel,
  onSubmit,
}: CandidatoFormProps) => {
  const rolesDisponibles = useMemo(
    () =>
      getRolesDisponibles(roles, candidatosEnLista, {
        excludeCandidatoId,
        includeCategoriaId: defaultValues?.idCategoria,
      }),
    [roles, candidatosEnLista, excludeCandidatoId, defaultValues?.idCategoria],
  )

  const form = useForm<CreateCandidatoInput>({
    resolver: zodResolver(createCandidatoSchema),
    defaultValues: {
      ...buildDefaultValues(rolesDisponibles, camposConfig, defaultValues),
      datosAdicionales: buildDefaultDatosAdicionales(
        camposConfig,
        defaultValues?.datosAdicionales,
      ),
    },
  })

  const handleSubmit = async (values: CreateCandidatoInput) => {
    if (roles.length === 0) {
      toast.error('No hay roles configurados para este comicio')
      return
    }
    if (rolesDisponibles.length === 0) {
      toast.error(
        'Todos los roles ya alcanzaron su cupo máximo en esta lista',
      )
      return
    }
    try {
      await onSubmit(values)
    } catch (error) {
      const fieldErrors = getApiFieldErrors(error)
      if (fieldErrors.length > 0) {
        mapApiFieldErrorsToForm(fieldErrors, form.setError)
        return
      }
      toast.error(getApiErrorMessage(error))
    }
  }

  const canSubmit = roles.length > 0 && rolesDisponibles.length > 0

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className='flex flex-col gap-8'
        aria-label='Formulario de candidato'
      >
        {roles.length === 0 ? (
          <p className='text-destructive text-sm' role='alert'>
            Este comicio no tiene roles de candidato configurados.
          </p>
        ) : (
          <CandidatoRolField
            control={form.control}
            rolesDisponibles={rolesDisponibles}
            setValue={form.setValue}
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
        <CandidatoCamposDinamicos control={form.control} campos={camposConfig} />
        <Button type='submit' disabled={form.formState.isSubmitting || !canSubmit}>
          {form.formState.isSubmitting ? 'Guardando…' : submitLabel}
        </Button>
      </form>
    </Form>
  )
}
