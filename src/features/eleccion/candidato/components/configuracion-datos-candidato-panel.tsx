import { useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronDown, Lock, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { getApiErrorMessage, isConflictError } from '@/lib/api-client'
import { cn } from '@/lib/utils'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  guardarConfiguracionDatosCandidato,
  obtenerConfiguracionDatosCandidato,
} from '@/features/eleccion/candidato/api/configuracion-datos-candidato-api'
import {
  guardarConfiguracionSchema,
  type GuardarConfiguracionInput,
  type TipoCampoCandidato,
} from '@/features/eleccion/candidato/data/schema'
import { slugifyEtiquetaToClave } from '@/features/eleccion/candidato/utils/slugify-etiqueta-clave'

const TIPOS_CAMPO: { value: TipoCampoCandidato; label: string }[] = [
  { value: 'texto', label: 'Texto' },
  { value: 'numero', label: 'Número' },
  { value: 'email', label: 'Email' },
  { value: 'url', label: 'URL' },
  { value: 'fecha', label: 'Fecha' },
  { value: 'booleano', label: 'Verdadero/Falso' },
]

type ConfiguracionDatosCandidatoPanelProps = {
  idEleccion: number
  isEditable: boolean
}

const buildCampoVacio = (
  orden: number
): GuardarConfiguracionInput['campos'][number] => ({
  clave: '',
  etiqueta: '',
  tipo: 'texto',
  obligatorio: true,
  orden,
})

export const ConfiguracionDatosCandidatoPanel = ({
  idEleccion,
  isEditable,
}: ConfiguracionDatosCandidatoPanelProps) => {
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)

  const configQuery = useQuery({
    queryKey: ['config-datos-candidato', idEleccion],
    queryFn: () => obtenerConfiguracionDatosCandidato(idEleccion),
  })

  const form = useForm<GuardarConfiguracionInput>({
    resolver: zodResolver(guardarConfiguracionSchema),
    values: configQuery.data
      ? { campos: configQuery.data.campos }
      : { campos: [] },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'campos',
  })

  const guardarMutation = useMutation({
    mutationFn: (input: GuardarConfiguracionInput) =>
      guardarConfiguracionDatosCandidato(idEleccion, input),
    onSuccess: async () => {
      toast.success('Configuración guardada')
      await queryClient.invalidateQueries({
        queryKey: ['config-datos-candidato', idEleccion],
      })
    },
    onError: (error) => {
      if (isConflictError(error)) {
        toast.error(getApiErrorMessage(error))
        return
      }
      toast.error(getApiErrorMessage(error))
    },
  })

  const configEditable = configQuery.data?.editable ?? false
  const canEditForm = isEditable && configEditable

  const handleSubmit = async (values: GuardarConfiguracionInput) => {
    const camposConOrden = values.campos.map((campo, index) => ({
      ...campo,
      clave: slugifyEtiquetaToClave(campo.etiqueta),
      orden: index + 1,
    }))
    await guardarMutation.mutateAsync({ campos: camposConOrden })
  }

  const handleAddCampo = () => {
    append(buildCampoVacio(fields.length + 1))
  }

  const camposCount = configQuery.data?.campos.length ?? 0
  const resumenCampos =
    camposCount === 0
      ? 'Sin campos adicionales configurados'
      : `${camposCount} campo${camposCount === 1 ? '' : 's'} configurado${camposCount === 1 ? '' : 's'}`

  const cardHeader = (
    <CardHeader className='flex flex-row items-start justify-between gap-4 space-y-0'>
      <div className='flex flex-col gap-1.5 text-left'>
        <CardTitle>Datos solicitados a candidatos</CardTitle>
        <CardDescription>
          {isOpen
            ? 'Defina los campos adicionales que se pedirán al registrar cada candidato. Los datos personales (nombre, apellido y rol) son fijos.'
            : resumenCampos}
        </CardDescription>
      </div>
      <ChevronDown
        className={cn(
          'mt-1 size-5 shrink-0 text-muted-foreground transition-transform duration-200',
          isOpen && 'rotate-180'
        )}
        aria-hidden='true'
      />
    </CardHeader>
  )

  if (configQuery.isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Datos solicitados a candidatos</CardTitle>
          <CardDescription>Cargando configuración…</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <button
            type='button'
            className='w-full rounded-t-xl text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
            aria-expanded={isOpen}
            aria-label={
              isOpen
                ? 'Ocultar configuración de datos de candidatos'
                : 'Mostrar configuración de datos de candidatos'
            }
          >
            {cardHeader}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className='flex flex-col gap-4 border-t pt-6'>
            {!isEditable && (
              <Alert>
                <Lock className='size-4' />
                <AlertTitle>Comicio oficializado</AlertTitle>
                <AlertDescription>
                  La configuración no puede modificarse porque el comicio ya no
                  está en borrador.
                </AlertDescription>
              </Alert>
            )}

            {isEditable && !configEditable && configQuery.data && (
              <Alert>
                <Lock className='size-4' />
                <AlertTitle>Configuración bloqueada</AlertTitle>
                <AlertDescription>
                  Ya hay {configQuery.data.cantidadCandidatos} candidato
                  {configQuery.data.cantidadCandidatos === 1 ? '' : 's'}{' '}
                  registrado
                  {configQuery.data.cantidadCandidatos === 1 ? '' : 's'}.
                  Elimine todos los candidatos para poder modificar esta
                  configuración.
                </AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className='flex flex-col gap-4'
                aria-label='Configuración de datos de candidato'
              >
                {fields.length === 0 && (
                  <p className='text-sm text-muted-foreground'>
                    No hay campos configurados. Agregue los datos adicionales
                    que desea solicitar a cada candidato.
                  </p>
                )}

                {fields.map((field, index) => {
                  const tipo = form.watch(`campos.${index}.tipo`)
                  const showTextValidation =
                    tipo === 'texto' || tipo === 'email'
                  const showNumberValidation = tipo === 'numero'

                  return (
                    <fieldset
                      key={field.id}
                      className='flex flex-col gap-3 rounded-lg border p-4'
                    >
                      <legend className='px-1 text-sm font-medium'>
                        Dato {index + 1}
                      </legend>
                      <div className='grid gap-3 sm:grid-cols-2'>
                        <FormField
                          control={form.control}
                          name={`campos.${index}.etiqueta`}
                          render={({ field: formField }) => (
                            <FormItem className='sm:col-span-2'>
                              <FormLabel>Nombre del dato</FormLabel>
                              <FormControl>
                                <Input
                                  {...formField}
                                  placeholder='Legajo UTN'
                                  disabled={!canEditForm}
                                  onChange={(event) => {
                                    const value = event.target.value
                                    formField.onChange(value)
                                    if (canEditForm) {
                                      form.setValue(
                                        `campos.${index}.clave`,
                                        slugifyEtiquetaToClave(value),
                                        { shouldValidate: true }
                                      )
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`campos.${index}.clave`}
                          render={({ field: formField }) => (
                            <FormItem className='sm:col-span-2'>
                              <FormLabel>Clave</FormLabel>
                              <FormControl>
                                <Input
                                  {...formField}
                                  readOnly
                                  tabIndex={-1}
                                  aria-readonly='true'
                                  className='bg-muted'
                                  placeholder='se-genera-automaticamente'
                                />
                              </FormControl>
                              <p className='text-xs text-muted-foreground'>
                                Se genera en minúsculas reemplazando espacios
                                por guiones.
                              </p>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`campos.${index}.tipo`}
                          render={({ field: formField }) => (
                            <FormItem>
                              <FormLabel>Tipo</FormLabel>
                              <Select
                                value={formField.value}
                                onValueChange={formField.onChange}
                                disabled={!canEditForm}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder='Seleccione tipo' />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {TIPOS_CAMPO.map((item) => (
                                    <SelectItem
                                      key={item.value}
                                      value={item.value}
                                    >
                                      {item.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`campos.${index}.obligatorio`}
                          render={({ field: formField }) => (
                            <FormItem className='flex flex-row items-center justify-between gap-3 rounded-lg border p-3'>
                              <FormLabel>Obligatorio</FormLabel>
                              <FormControl>
                                <Switch
                                  checked={formField.value}
                                  onCheckedChange={formField.onChange}
                                  disabled={!canEditForm}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`campos.${index}.ejemplo`}
                          render={({ field: formField }) => (
                            <FormItem>
                              <FormLabel>Ejemplo (opcional)</FormLabel>
                              <FormControl>
                                <Input {...formField} disabled={!canEditForm} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`campos.${index}.ayuda`}
                          render={({ field: formField }) => (
                            <FormItem>
                              <FormLabel>Ayuda (opcional)</FormLabel>
                              <FormControl>
                                <Input {...formField} disabled={!canEditForm} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {(showTextValidation || showNumberValidation) && (
                        <div className='grid gap-3 sm:grid-cols-2'>
                          {showTextValidation && (
                            <>
                              <FormField
                                control={form.control}
                                name={`campos.${index}.validacion.minLength`}
                                render={({ field: formField }) => (
                                  <FormItem>
                                    <FormLabel>Longitud mínima</FormLabel>
                                    <FormControl>
                                      <Input
                                        type='number'
                                        min={0}
                                        disabled={!canEditForm}
                                        value={formField.value ?? ''}
                                        onChange={(e) =>
                                          formField.onChange(
                                            e.target.value === ''
                                              ? undefined
                                              : Number(e.target.value)
                                          )
                                        }
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`campos.${index}.validacion.maxLength`}
                                render={({ field: formField }) => (
                                  <FormItem>
                                    <FormLabel>Longitud máxima</FormLabel>
                                    <FormControl>
                                      <Input
                                        type='number'
                                        min={1}
                                        disabled={!canEditForm}
                                        value={formField.value ?? ''}
                                        onChange={(e) =>
                                          formField.onChange(
                                            e.target.value === ''
                                              ? undefined
                                              : Number(e.target.value)
                                          )
                                        }
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`campos.${index}.validacion.pattern`}
                                render={({ field: formField }) => (
                                  <FormItem className='sm:col-span-2'>
                                    <FormLabel>
                                      Patrón regex (opcional)
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        {...formField}
                                        placeholder='^\\d{4,6}$'
                                        disabled={!canEditForm}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`campos.${index}.validacion.patternMessage`}
                                render={({ field: formField }) => (
                                  <FormItem className='sm:col-span-2'>
                                    <FormLabel>Mensaje del patrón</FormLabel>
                                    <FormControl>
                                      <Input
                                        {...formField}
                                        disabled={!canEditForm}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </>
                          )}
                          {showNumberValidation && (
                            <>
                              <FormField
                                control={form.control}
                                name={`campos.${index}.validacion.min`}
                                render={({ field: formField }) => (
                                  <FormItem>
                                    <FormLabel>Mínimo</FormLabel>
                                    <FormControl>
                                      <Input
                                        type='number'
                                        disabled={!canEditForm}
                                        value={formField.value ?? ''}
                                        onChange={(e) =>
                                          formField.onChange(
                                            e.target.value === ''
                                              ? undefined
                                              : Number(e.target.value)
                                          )
                                        }
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`campos.${index}.validacion.max`}
                                render={({ field: formField }) => (
                                  <FormItem>
                                    <FormLabel>Máximo</FormLabel>
                                    <FormControl>
                                      <Input
                                        type='number'
                                        disabled={!canEditForm}
                                        value={formField.value ?? ''}
                                        onChange={(e) =>
                                          formField.onChange(
                                            e.target.value === ''
                                              ? undefined
                                              : Number(e.target.value)
                                          )
                                        }
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </>
                          )}
                        </div>
                      )}

                      {canEditForm && (
                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          className='self-start text-destructive'
                          onClick={() => remove(index)}
                          aria-label={`Eliminar campo ${index + 1}`}
                        >
                          <Trash2 className='me-2 size-4' />
                          Eliminar campo
                        </Button>
                      )}
                    </fieldset>
                  )
                })}

                {canEditForm && (
                  <div className='flex flex-wrap gap-2'>
                    <Button
                      type='button'
                      variant='outline'
                      onClick={handleAddCampo}
                      aria-label='Agregar campo'
                    >
                      <Plus className='me-2 size-4' />
                      Agregar campo
                    </Button>
                    <Button type='submit' disabled={guardarMutation.isPending}>
                      {guardarMutation.isPending
                        ? 'Guardando…'
                        : 'Guardar configuración'}
                    </Button>
                  </div>
                )}
              </form>
            </Form>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
